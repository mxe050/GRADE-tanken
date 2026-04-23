import {
  GoogleGenerativeAI,
  GenerativeModel,
  HarmCategory,
  HarmBlockThreshold,
  SchemaType,
  type Schema,
} from '@google/generative-ai';

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
  try { return localStorage.getItem(STORAGE_KEY) || ''; } catch { return ''; }
}

export function setApiKey(key: string): void {
  try {
    if (key) localStorage.setItem(STORAGE_KEY, key);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

export function getModel(): string {
  try { return localStorage.getItem(MODEL_KEY) || DEFAULT_MODEL; } catch { return DEFAULT_MODEL; }
}

export function setModel(model: string): void {
  try { localStorage.setItem(MODEL_KEY, model); } catch {}
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
  responseSchema?: Schema;
  timeoutMs?: number;
}

export interface GenerateResult {
  text: string;
  finishReason?: string;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function classifyError(e: any): ApiError {
  const msg = String(e?.message || e);
  const status = e?.status ?? e?.statusText;

  if (/API key not valid|API_KEY_INVALID|invalid.*api.*key|403.*PERMISSION_DENIED/i.test(msg)) {
    return new ApiError(
      'APIキーが無効か、Generative Language APIがプロジェクトで有効になっていません。\n→ Google AI Studioで新しいキーを作成するか、https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com で有効化してください。',
      'INVALID_KEY'
    );
  }
  if (/SAFETY|blocked|prohibited|content.*filter/i.test(msg)) {
    return new ApiError('Geminiの安全フィルタでブロックされました。「次のケース」を押して再試行してください。', 'SAFETY');
  }
  if (/model.*not found|models\/.*not found|404.*NOT_FOUND/i.test(msg)) {
    return new ApiError('選択中のモデルが利用できません。APIキー設定画面でモデルを変更してください。', 'MODEL');
  }
  if (/responseSchema|400.*INVALID_ARGUMENT|response_mime_type/i.test(msg)) {
    return new ApiError('このモデルはスキーマ出力非対応の可能性があります。自動的に通常モードで再試行します。', 'SCHEMA_UNSUPPORTED');
  }
  if (/429|RESOURCE_EXHAUSTED|Too Many Requests/i.test(msg) || status === 429) {
    return new ApiError(
      'レート制限にかかりました(Gemini無料枠の1分15リクエストなど)。\n【対処】1〜2分待ってから「次のケース」を押してください。それでも直らない場合のみ日次上限の可能性です。',
      'RATE_LIMIT'
    );
  }
  if (/5\d\d|INTERNAL|UNAVAILABLE|DEADLINE_EXCEEDED/i.test(msg)) {
    return new ApiError('Google側の一時的エラーです。少し待ってから再試行してください。', 'SERVER');
  }
  if (/fetch|network|NetworkError|Failed to fetch|ERR_|ECONN|ETIMEDOUT|abort|timeout/i.test(msg)) {
    return new ApiError(
      '接続エラー: Geminiサーバーに到達できません。\n【対処】(1) ネット接続を確認 (2) ブラウザの拡張機能(広告ブロッカー等)を一時OFF (3) VPN/プロキシをOFF (4) 1〜2分待って再試行',
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

async function callGemini(
  model: GenerativeModel,
  prompt: string,
  options: GenerateOptions,
  timeoutMs: number,
  attempt: number,
): Promise<GenerateResult> {
  const generationConfig: any = {
    maxOutputTokens: options.maxOutputTokens ?? 8192,
    temperature: options.temperature ?? 0.8,
    responseMimeType: options.responseMimeType ?? 'application/json',
  };
  if (options.responseSchema) generationConfig.responseSchema = options.responseSchema;

  const result = await withTimeout(
    model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig,
    }),
    timeoutMs,
    `generateContent attempt ${attempt}`
  );
  const response = result.response;
  const text = response.text() || '';
  const finishReason = response?.candidates?.[0]?.finishReason;
  return { text, finishReason };
}

export async function generateText(
  prompt: string,
  options: GenerateOptions = {}
): Promise<GenerateResult> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new ApiError('APIキーが設定されていません。メニューの「APIキー設定」から入力してください。', 'NO_KEY');
  }
  const modelId = getModel();
  const model = buildModel(apiKey, modelId);
  const timeoutMs = options.timeoutMs ?? 120_000;

  const maxRetries = 2;
  let lastError: ApiError | null = null;
  let useSchema = !!options.responseSchema;

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      const opts = useSchema ? options : { ...options, responseSchema: undefined };
      const { text, finishReason } = await callGemini(model, prompt, opts, timeoutMs, attempt);

      if (!text) {
        throw new ApiError(
          finishReason === 'MAX_TOKENS'
            ? '応答がトークン上限で途切れました。自動的に再試行します。'
            : 'APIが空の応答を返しました(safety filterの可能性)。',
          finishReason === 'MAX_TOKENS' ? 'TRUNCATED' : 'EMPTY'
        );
      }
      if (finishReason && finishReason !== 'STOP' && finishReason !== 'MAX_TOKENS') {
        console.warn(`[Gemini] finishReason=${finishReason}`);
      }
      return { text, finishReason };
    } catch (e: any) {
      lastError = e instanceof ApiError ? e : classifyError(e);
      // Schema非対応モデルへの自動フォールバック
      if (lastError.code === 'SCHEMA_UNSUPPORTED' && useSchema) {
        console.warn('[Gemini] responseSchema未対応 → schemaなしで再試行');
        useSchema = false;
        continue;
      }
      const retriable = ['RATE_LIMIT', 'SERVER', 'NETWORK', 'EMPTY', 'TRUNCATED'].includes(lastError.code);
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

// ============================================================================
// ロバストなJSON抽出 — 末尾切断・fence・余計な前置きを許容
// ============================================================================
export function extractJsonRobust(text: string): any {
  if (!text) return null;
  let s = text.trim();

  // ```json ... ``` や ``` を除去
  s = s.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();

  // 前置き削除: 最初の '{' 以降だけ採用
  const first = s.indexOf('{');
  if (first < 0) return null;
  s = s.slice(first);

  // そのままパース成功ならOK
  try { return JSON.parse(s); } catch {}

  // 末尾からのフォールバック: 中括弧のバランスを取りながら最長有効なJSONを探す
  // 1. 全てのトップレベル '}' 位置で試す
  for (let i = s.length - 1; i >= 0; i--) {
    if (s[i] !== '}') continue;
    const cand = s.slice(0, i + 1);
    try { return JSON.parse(cand); } catch {}
  }

  // 2. 末尾を補完してパース — 不完全な最後の要素を切り落として閉じる
  const repaired = repairTruncatedJson(s);
  if (repaired) {
    try { return JSON.parse(repaired); } catch {}
  }

  return null;
}

// 末尾が途切れたJSONを、直前の完結した位置まで切り詰めて閉じる修復関数
function repairTruncatedJson(s: string): string | null {
  let depth = 0;                 // {} の深さ
  let arrDepth = 0;              // [] の深さ
  let inStr = false;
  let esc = false;
  // 最後に「完全に安定した挿入位置」= 各オブジェクト/配列の直後カンマなし末尾
  // 方針: 文字列外の最後の , または { or [ の直前まで切って、残りのbracket/brace を閉じる
  let lastSafe = -1;

  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (esc) { esc = false; continue; }
    if (c === '\\' && inStr) { esc = true; continue; }
    if (c === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (c === '{') depth++;
    else if (c === '}') depth--;
    else if (c === '[') arrDepth++;
    else if (c === ']') arrDepth--;
    // オブジェクト/配列のカンマ区切り直後は、次の項目が途中でも安全に切れる
    if (c === ',' && depth + arrDepth > 0) lastSafe = i;
  }

  if (lastSafe < 0) return null;

  let truncated = s.slice(0, lastSafe); // 末尾カンマも除外

  // 改めて深さカウント
  depth = 0; arrDepth = 0; inStr = false; esc = false;
  for (let i = 0; i < truncated.length; i++) {
    const c = truncated[i];
    if (esc) { esc = false; continue; }
    if (c === '\\' && inStr) { esc = true; continue; }
    if (c === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (c === '{') depth++;
    else if (c === '}') depth--;
    else if (c === '[') arrDepth++;
    else if (c === ']') arrDepth--;
  }

  // 文字列途中で終わっていたら閉じる
  if (inStr) truncated += '"';
  // 開いている配列を閉じる
  while (arrDepth > 0) { truncated += ']'; arrDepth--; }
  // 開いているオブジェクトを閉じる
  while (depth > 0) { truncated += '}'; depth--; }

  return truncated;
}

// ============================================================================
// Core GRADE SRケース用のresponseSchema — これで有効JSONが保証される
// ============================================================================
export const SR_CASE_SCHEMA: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    title: { type: SchemaType.STRING },
    field: { type: SchemaType.STRING },
    clinical_scenario: { type: SchemaType.STRING },
    target_pico: {
      type: SchemaType.OBJECT,
      properties: {
        population: { type: SchemaType.STRING },
        intervention: { type: SchemaType.STRING },
        comparator: { type: SchemaType.STRING },
        outcome: { type: SchemaType.STRING },
      },
      required: ['population', 'intervention', 'comparator', 'outcome'],
    },
    outcome_type: { type: SchemaType.STRING },
    mid_description: { type: SchemaType.STRING },
    ci_data: {
      type: SchemaType.OBJECT,
      properties: {
        point_estimate_num: { type: SchemaType.NUMBER },
        ci_low_num: { type: SchemaType.NUMBER },
        ci_high_num: { type: SchemaType.NUMBER },
        null_value_num: { type: SchemaType.NUMBER },
        mid_benefit_num: { type: SchemaType.NUMBER },
        mid_harm_num: { type: SchemaType.NUMBER, nullable: true },
        unit: { type: SchemaType.STRING },
      },
      required: ['point_estimate_num', 'ci_low_num', 'ci_high_num', 'null_value_num', 'mid_benefit_num', 'unit'],
    },
    num_trials: { type: SchemaType.INTEGER },
    total_n: { type: SchemaType.INTEGER },
    pooled_result: {
      type: SchemaType.OBJECT,
      properties: {
        effect_measure: { type: SchemaType.STRING },
        point_estimate: { type: SchemaType.STRING },
        ci_95: { type: SchemaType.STRING },
        absolute_effect: { type: SchemaType.STRING },
        interpretation: { type: SchemaType.STRING },
      },
      required: ['effect_measure', 'point_estimate', 'ci_95', 'absolute_effect', 'interpretation'],
    },
    trial_characteristics: { type: SchemaType.STRING },
    heterogeneity: { type: SchemaType.STRING },
    applicability_notes: { type: SchemaType.STRING },
    search_and_publication: { type: SchemaType.STRING },
    correct_judgments: {
      type: SchemaType.OBJECT,
      properties: {
        rob: {
          type: SchemaType.OBJECT,
          properties: {
            decision: { type: SchemaType.STRING },
            rationale: { type: SchemaType.STRING },
            flowchart_path: { type: SchemaType.STRING },
          },
          required: ['decision', 'rationale', 'flowchart_path'],
        },
        imprecision: {
          type: SchemaType.OBJECT,
          properties: {
            decision: { type: SchemaType.STRING },
            rationale: { type: SchemaType.STRING },
            flowchart_path: { type: SchemaType.STRING },
          },
          required: ['decision', 'rationale', 'flowchart_path'],
        },
        inconsistency: {
          type: SchemaType.OBJECT,
          properties: {
            decision: { type: SchemaType.STRING },
            rationale: { type: SchemaType.STRING },
            flowchart_path: { type: SchemaType.STRING },
          },
          required: ['decision', 'rationale', 'flowchart_path'],
        },
        indirectness: {
          type: SchemaType.OBJECT,
          properties: {
            decision: { type: SchemaType.STRING },
            rationale: { type: SchemaType.STRING },
            flowchart_path: { type: SchemaType.STRING },
          },
          required: ['decision', 'rationale', 'flowchart_path'],
        },
        publication: {
          type: SchemaType.OBJECT,
          properties: {
            decision: { type: SchemaType.STRING },
            rationale: { type: SchemaType.STRING },
            flowchart_path: { type: SchemaType.STRING },
          },
          required: ['decision', 'rationale', 'flowchart_path'],
        },
      },
      required: ['rob', 'imprecision', 'inconsistency', 'indirectness', 'publication'],
    },
    final_certainty: { type: SchemaType.STRING },
    final_rationale: { type: SchemaType.STRING },
    teaching_point: { type: SchemaType.STRING },
    sof_outcomes: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          name: { type: SchemaType.STRING },
          importance: { type: SchemaType.STRING },
          trials: { type: SchemaType.INTEGER },
          n: { type: SchemaType.INTEGER },
          relative_effect: { type: SchemaType.STRING },
          absolute_effect: { type: SchemaType.STRING },
          certainty: { type: SchemaType.STRING },
        },
        required: ['name', 'importance', 'trials', 'n', 'relative_effect', 'absolute_effect', 'certainty'],
      },
    },
    etd_framework: {
      type: SchemaType.OBJECT,
      properties: {
        benefits_harms_summary: { type: SchemaType.STRING },
        values_preferences: { type: SchemaType.STRING },
        resources_feasibility: { type: SchemaType.STRING },
        correct_recommendation: { type: SchemaType.STRING },
        recommendation_rationale: { type: SchemaType.STRING },
      },
      required: ['benefits_harms_summary', 'values_preferences', 'resources_feasibility', 'correct_recommendation', 'recommendation_rationale'],
    },
  },
  required: [
    'title', 'field', 'clinical_scenario', 'target_pico', 'outcome_type', 'mid_description',
    'ci_data', 'num_trials', 'total_n', 'pooled_result', 'trial_characteristics',
    'heterogeneity', 'applicability_notes', 'search_and_publication', 'correct_judgments',
    'final_certainty', 'final_rationale', 'teaching_point', 'sof_outcomes', 'etd_framework',
  ],
};
