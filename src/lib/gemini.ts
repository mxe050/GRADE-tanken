import { GoogleGenerativeAI, GenerativeModel, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

const STORAGE_KEY = 'grade_tanken_gemini_api_key';
const MODEL_KEY = 'grade_tanken_gemini_model';

export const DEFAULT_MODEL = 'gemini-2.0-flash';

export const AVAILABLE_MODELS = [
  { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash (推奨・無料枠あり・高速)' },
  { id: 'gemini-2.0-flash-lite', label: 'Gemini 2.0 Flash-Lite (超高速・軽量)' },
  { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (高性能)' },
  { id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash (旧世代・互換用)' },
];

export function getApiKey(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

export function setApiKey(key: string): void {
  try {
    if (key) localStorage.setItem(STORAGE_KEY, key);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

export function getModel(): string {
  try {
    return localStorage.getItem(MODEL_KEY) || DEFAULT_MODEL;
  } catch {
    return DEFAULT_MODEL;
  }
}

export function setModel(model: string): void {
  try {
    localStorage.setItem(MODEL_KEY, model);
  } catch {}
}

export function maskApiKey(key: string): string {
  if (!key) return '';
  if (key.length <= 10) return '*'.repeat(key.length);
  return key.slice(0, 4) + '*'.repeat(Math.max(4, key.length - 8)) + key.slice(-4);
}

function buildModel(apiKey: string, modelId: string): GenerativeModel {
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({
    model: modelId,
    safetySettings: [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
    ],
  });
}

export interface GenerateOptions {
  maxOutputTokens?: number;
  temperature?: number;
  responseMimeType?: 'application/json' | 'text/plain';
  timeoutMs?: number;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function classifyError(e: any): ApiError {
  const msg = String(e?.message || e);
  const status = e?.status ?? e?.statusText;

  if (/API key not valid|API_KEY_INVALID|invalid.*api.*key|403.*PERMISSION_DENIED/i.test(msg)) {
    return new ApiError(
      'APIキーが無効か、Generative Language APIがプロジェクトで有効になっていません。\n' +
      '→ Google AI Studioで新しいキーを作成するか、https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com で有効化してください。',
      'INVALID_KEY'
    );
  }
  if (/SAFETY|blocked|prohibited|content.*filter/i.test(msg)) {
    return new ApiError('Geminiの安全フィルタでブロックされました。「次のケース」を押して再試行してください。', 'SAFETY');
  }
  if (/model.*not found|models\/.*not found|404.*NOT_FOUND/i.test(msg)) {
    return new ApiError('選択中のモデルが利用できません。APIキー設定画面でモデルを変更してください。', 'MODEL');
  }
  if (/429|RESOURCE_EXHAUSTED|Too Many Requests/i.test(msg) || status === 429) {
    // Gemini 429 は通常「1分15リクエスト(RPM)」の一時制限。日次(RPD)の場合もあるが大抵は1-2分待てば復活。
    return new ApiError(
      'レート制限にかかりました(Gemini無料枠の1分15リクエストなど)。\n' +
      '【対処】1〜2分待ってから「次のケース」を押してください。それでも直らない場合のみ日次上限の可能性です。',
      'RATE_LIMIT'
    );
  }
  if (/5\d\d|INTERNAL|UNAVAILABLE|DEADLINE_EXCEEDED/i.test(msg)) {
    return new ApiError('Google側の一時的エラーです。少し待ってから再試行してください。', 'SERVER');
  }
  if (/fetch|network|NetworkError|Failed to fetch|ERR_|ECONN|ETIMEDOUT|abort|timeout/i.test(msg)) {
    return new ApiError(
      '接続エラー: Geminiサーバーに到達できません。\n' +
      '【対処】(1) ネット接続を確認 (2) ブラウザの拡張機能(広告ブロッカー等)を一時OFF (3) VPN/プロキシをOFF (4) 1〜2分待って再試行',
      'NETWORK'
    );
  }
  return new ApiError(`Gemini APIエラー: ${msg}`, 'UNKNOWN');
}

async function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  let t: any;
  const timeout = new Promise<never>((_, reject) => {
    t = setTimeout(() => reject(new Error(`timeout: ${label} (${ms}ms)`)), ms);
  });
  try {
    return await Promise.race([p, timeout]);
  } finally {
    clearTimeout(t);
  }
}

export async function generateText(
  prompt: string,
  options: GenerateOptions = {}
): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new ApiError('APIキーが設定されていません。メニューの「APIキー設定」から入力してください。', 'NO_KEY');
  }
  const modelId = getModel();
  const model = buildModel(apiKey, modelId);
  const timeoutMs = options.timeoutMs ?? 90_000;

  const maxRetries = 2;
  let lastError: ApiError | null = null;

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      const result = await withTimeout(
        model.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            maxOutputTokens: options.maxOutputTokens ?? 5000,
            temperature: options.temperature ?? 0.8,
            responseMimeType: options.responseMimeType ?? 'application/json',
          },
        }),
        timeoutMs,
        `generateContent attempt ${attempt}`
      );
      const response = result.response;
      const text = response.text();
      if (!text) throw new ApiError('APIが空の応答を返しました(safety filterの可能性)。', 'EMPTY');
      return text;
    } catch (e: any) {
      lastError = e instanceof ApiError ? e : classifyError(e);
      // 自動リトライの対象: RATE_LIMIT / SERVER / NETWORK / EMPTY
      const retriable = ['RATE_LIMIT', 'SERVER', 'NETWORK', 'EMPTY'].includes(lastError.code);
      if (!retriable || attempt > maxRetries) {
        throw lastError;
      }
      const backoff = lastError.code === 'RATE_LIMIT' ? 8_000 : 2_000 * attempt;
      console.warn(`[Gemini] 試行${attempt}失敗 (${lastError.code}): ${lastError.message}\n  ${backoff}ms待って再試行`);
      await sleep(backoff);
    }
  }
  throw lastError || new ApiError('不明なエラー', 'UNKNOWN');
}

export class ApiError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.code = code;
    this.name = 'ApiError';
  }
}
