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

  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: options.maxOutputTokens ?? 5000,
        temperature: options.temperature ?? 0.8,
        responseMimeType: options.responseMimeType ?? 'application/json',
      },
    });
    const response = result.response;
    const text = response.text();
    if (!text) throw new ApiError('APIが空の応答を返しました。', 'EMPTY');
    return text;
  } catch (e: any) {
    const msg = String(e?.message || e);
    if (/API key not valid|API_KEY_INVALID|invalid.*api.*key/i.test(msg)) {
      throw new ApiError('APIキーが無効です。Google AI Studioで正しいキーを作成し直してください。', 'INVALID_KEY');
    }
    if (/quota|RESOURCE_EXHAUSTED|429/i.test(msg)) {
      throw new ApiError('無料枠の上限に達しました。しばらく待つか、別のAPIキーを使ってください（詳細はREADMEの「上限確認」参照）。', 'QUOTA');
    }
    if (/SAFETY|blocked|prohibited/i.test(msg)) {
      throw new ApiError('Geminiの安全フィルタで応答がブロックされました。もう一度試すか、難易度を変えてください。', 'SAFETY');
    }
    if (/fetch|network|NetworkError|Failed to fetch/i.test(msg)) {
      throw new ApiError('ネットワークエラー: 接続を確認してください。', 'NETWORK');
    }
    if (/model.*not found|404|NOT_FOUND/i.test(msg)) {
      throw new ApiError(`モデル "${modelId}" が見つかりません。別のモデルに切り替えてください。`, 'MODEL');
    }
    throw new ApiError(`Gemini APIエラー: ${msg}`, 'UNKNOWN');
  }
}

export class ApiError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.code = code;
    this.name = 'ApiError';
  }
}
