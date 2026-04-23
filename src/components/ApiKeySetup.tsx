import { useState } from 'react';
import { Key, Eye, EyeOff, Trash2, ExternalLink, ShieldAlert, ArrowLeft, CheckCircle2 } from 'lucide-react';
import {
  getApiKey, setApiKey, getModel, setModel, maskApiKey,
  AVAILABLE_MODELS, generateText, ApiError,
} from '../lib/gemini';

interface Props {
  onClose: () => void;
  onOpenGuide: () => void;
}

export default function ApiKeySetup({ onClose, onOpenGuide }: Props) {
  const [key, setKey] = useState(getApiKey());
  const [show, setShow] = useState(false);
  const [model, setModelState] = useState(getModel());
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const save = () => {
    setApiKey(key.trim());
    setModel(model);
    setTestResult({ ok: true, msg: '保存しました。' });
  };

  const clear = () => {
    if (!confirm('APIキーを削除します。よろしいですか?')) return;
    setApiKey('');
    setKey('');
    setTestResult({ ok: true, msg: 'APIキーを削除しました。' });
  };

  const test = async () => {
    if (!key.trim()) {
      setTestResult({ ok: false, msg: 'APIキーを入力してください。' });
      return;
    }
    setApiKey(key.trim());
    setModel(model);
    setTesting(true);
    setTestResult(null);
    try {
      const out = await generateText('ping と1語だけ答えてください。', {
        maxOutputTokens: 20,
        responseMimeType: 'text/plain',
      });
      setTestResult({ ok: true, msg: `✅ 成功: 応答 "${out.trim().slice(0, 40)}"` });
    } catch (e: any) {
      const msg = e instanceof ApiError ? e.message : String(e?.message || e);
      setTestResult({ ok: false, msg: `❌ ${msg}` });
    }
    setTesting(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={onClose}
          className="text-slate-300 hover:text-white text-sm flex items-center gap-1 mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> メニューへ戻る
        </button>

        <div className="bg-slate-800/60 backdrop-blur border border-slate-700 rounded-2xl p-6 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <Key className="w-6 h-6 text-indigo-400" />
            <h1 className="text-2xl font-bold text-white">Google Gemini APIキー設定</h1>
          </div>

          <p className="text-slate-300 text-sm mb-4">
            このアプリはGoogle AI StudioのGemini APIキーを使ってSRケースを生成します。
            APIキーは<span className="text-indigo-300 font-semibold">お使いのブラウザ内(localStorage)にのみ保存</span>され、
            サーバーには送信されません。
          </p>

          <label className="block text-xs text-slate-400 mb-1 font-semibold">APIキー</label>
          <div className="flex gap-2 mb-2">
            <div className="flex-1 relative">
              <input
                type={show ? 'text' : 'password'}
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full bg-slate-900 border border-slate-600 focus:border-indigo-400 rounded-lg px-3 py-2.5 text-white font-mono text-sm outline-none pr-10"
              />
              <button
                onClick={() => setShow(!show)}
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                title={show ? '隠す' : '表示'}
              >
                {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <button
              onClick={clear}
              disabled={!key}
              className="bg-red-900/40 border border-red-700 hover:bg-red-900/60 text-red-200 rounded-lg px-3 py-2.5 text-sm flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
              title="削除"
            >
              <Trash2 className="w-4 h-4" /> 削除
            </button>
          </div>
          {key && (
            <div className="text-[11px] text-slate-500 font-mono mb-3">
              保存されるマスク表示: {maskApiKey(key)}
            </div>
          )}

          <label className="block text-xs text-slate-400 mb-1 font-semibold mt-3">使用モデル</label>
          <select
            value={model}
            onChange={(e) => setModelState(e.target.value)}
            className="w-full bg-slate-900 border border-slate-600 focus:border-indigo-400 rounded-lg px-3 py-2.5 text-white text-sm outline-none mb-1"
          >
            {AVAILABLE_MODELS.map((m) => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
          </select>
          <div className="text-[11px] text-slate-500 mb-4">
            迷ったら <span className="text-indigo-300">gemini-2.0-flash</span> が無料枠・速度・品質のバランスで最適です。
          </div>

          <div className="flex gap-2">
            <button
              onClick={test}
              disabled={testing || !key}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-medium py-2.5 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {testing ? 'テスト中...' : '接続テスト'}
            </button>
            <button
              onClick={save}
              disabled={!key}
              className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white font-semibold py-2.5 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1"
            >
              <CheckCircle2 className="w-4 h-4" /> 保存
            </button>
          </div>

          {testResult && (
            <div className={`mt-3 p-3 rounded-lg text-sm ${
              testResult.ok ? 'bg-emerald-900/30 border border-emerald-700 text-emerald-200' :
              'bg-red-900/30 border border-red-700 text-red-200'
            }`}>
              {testResult.msg}
            </div>
          )}
        </div>

        <div className="bg-amber-900/20 backdrop-blur border border-amber-700/50 rounded-2xl p-5 mb-4">
          <div className="flex items-center gap-2 mb-2 text-amber-200 font-semibold">
            <ShieldAlert className="w-5 h-5" /> 重要: APIキーの取り扱い
          </div>
          <ul className="text-amber-100/90 text-xs space-y-1.5 list-disc list-inside">
            <li><span className="font-semibold">他人に教えない・共有しない</span>(キーは「他人があなたのアカウントを使って生成する」ためのパスワード相当)</li>
            <li>公開リポジトリ・SNS・スクリーンショットにキーを載せない</li>
            <li>万一漏れたら、Google AI Studioで即座に「Delete」して新しいキーを作り直す</li>
            <li>無料枠の状態では<span className="font-semibold">勝手に課金されることはない</span>(有料化は自分でBilling有効化した場合のみ)</li>
          </ul>
        </div>

        <div className="bg-slate-800/40 border border-slate-700 rounded-2xl p-5">
          <div className="text-white font-semibold mb-3 flex items-center gap-2">
            🔑 APIキーの作成手順(初心者向け)
          </div>
          <ol className="text-slate-300 text-sm space-y-2 list-decimal list-inside">
            <li>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-300 hover:text-indigo-200 inline-flex items-center gap-1"
              >
                Google AI Studio の APIキーページ <ExternalLink className="w-3 h-3" />
              </a>
              にアクセス(要Googleアカウント)
            </li>
            <li>「APIキーを作成」ボタンをクリック</li>
            <li>既存のGoogle Cloudプロジェクトを選ぶ(なければ自動で作成される)</li>
            <li>表示された <span className="font-mono text-indigo-300">AIzaSy...</span> で始まる文字列をコピー</li>
            <li>上の入力欄に貼り付けて「保存」</li>
          </ol>
          <div className="text-[11px] text-slate-400 mt-3">
            詳しい解説とトラブルシューティングは{' '}
            <button onClick={onOpenGuide} className="text-indigo-300 underline hover:text-indigo-200">
              使い方ガイド
            </button>
            {' '}を参照。
          </div>
        </div>
      </div>
    </div>
  );
}
