import { useState } from 'react';
import {
  Award, BookOpen, RefreshCw, CheckCircle2, XCircle, Lightbulb, Sparkles,
  FileText, Activity, AlertTriangle, ArrowRight, Target, Eye, Users,
  BarChart3, ClipboardCheck, Table, ChevronRight, Key, Shield, Info, ExternalLink,
  Shuffle, List, Pencil,
} from 'lucide-react';
import { generateText, ApiError, getApiKey, extractJsonRobust, SR_CASE_SCHEMA } from '../lib/gemini';

const DOMAINS = [
  { id: 'rob', name: 'Risk of Bias', nameJa: 'バイアスリスク', desc: '組入試験の方法論的限界', icon: AlertTriangle },
  { id: 'imprecision', name: 'Imprecision', nameJa: '不精確性', desc: '95%CIと閾値(null/MID)の関係、OIS', icon: Target },
  { id: 'inconsistency', name: 'Inconsistency', nameJa: '非一貫性', desc: '試験間の結果のばらつき(説明不能)', icon: BarChart3 },
  { id: 'indirectness', name: 'Indirectness', nameJa: '非直接性', desc: 'target PICOとのミスマッチ・代替アウトカム', icon: Users },
  { id: 'publication', name: 'Publication Bias', nameJa: '出版バイアス', desc: '小規模・企業資金・funnel plot非対称', icon: Eye },
] as const;

const CERTAINTY_LEVELS = [
  { id: 'high', label: 'High', labelJa: '高', stars: 4, bg: 'emerald' },
  { id: 'moderate', label: 'Moderate', labelJa: '中', stars: 3, bg: 'green' },
  { id: 'low', label: 'Low', labelJa: '低', stars: 2, bg: 'amber' },
  { id: 'very_low', label: 'Very Low', labelJa: '非常に低い', stars: 1, bg: 'red' },
] as const;

const RECOMMENDATIONS = [
  { id: 'strong_for', label: 'Strong FOR', labelJa: '強く推奨 (介入を)', color: 'emerald', desc: 'ほぼ全員が介入を選ぶ' },
  { id: 'conditional_for', label: 'Conditional FOR', labelJa: '条件付き推奨 (介入を)', color: 'green', desc: '多数は介入、一部は別選択' },
  { id: 'conditional_against', label: 'Conditional AGAINST', labelJa: '条件付き非推奨', color: 'amber', desc: '多数は介入せず、一部は介入' },
  { id: 'strong_against', label: 'Strong AGAINST', labelJa: '強く非推奨', color: 'red', desc: 'ほぼ全員が介入を選ばない' },
] as const;

const DIFFICULTY: Record<string, { label: string; desc: string }> = {
  easy: { label: '初級 (医学生)', desc: '1-2ドメインで明確にrate down' },
  medium: { label: '中級 (研修医)', desc: '複数ドメインで判断が混在' },
  hard: { label: '上級 (専門医)', desc: 'close callやsubgroup効果を含む' },
};

const PRESET_TOPICS: string[] = [
  '循環器内科(高血圧・心不全・虚血性心疾患・不整脈)',
  '呼吸器内科(喘息・COPD・肺炎・ARDS)',
  '消化器内科(炎症性腸疾患・肝疾患・H.pylori)',
  '腎臓内科(CKD・AKI・透析)',
  '内分泌代謝(糖尿病・甲状腺・脂質異常症)',
  '神経内科(脳卒中・認知症・パーキンソン病・てんかん)',
  '血液内科(白血病・リンパ腫・貧血)',
  '腫瘍内科(乳がん・肺がん・大腸がん)',
  '感染症(HIV・結核・COVID-19・敗血症)',
  '救急・集中治療',
  '外科・周術期管理',
  '整形外科(変形性関節症・骨折・脊椎疾患)',
  '産婦人科(妊娠合併症・周産期)',
  '小児科(ワクチン・小児感染症・新生児)',
  '精神科(うつ病・統合失調症・不安障害)',
  '皮膚科(アトピー性皮膚炎・乾癬)',
  '眼科(緑内障・加齢黄斑・白内障)',
  '耳鼻咽喉科(中耳炎・副鼻腔炎・めまい)',
  '歯科・口腔外科(歯周病・う蝕・親知らず抜歯)',
  '口腔ケア・摂食嚥下',
  'リハビリテーション',
  '緩和ケア・疼痛管理',
  '麻酔科(術後疼痛・PONV)',
  '泌尿器科(前立腺疾患・尿路結石・腎がん)',
  '予防医学・スクリーニング',
];

const FlowBox = ({ children, color = 'slate', className = '' }: any) => {
  const colors: Record<string, string> = {
    slate: 'bg-slate-100 border-slate-300 text-slate-800',
    blue: 'bg-blue-100 border-blue-300 text-blue-900',
    red: 'bg-red-100 border-red-400 text-red-900',
    green: 'bg-emerald-100 border-emerald-400 text-emerald-900',
    amber: 'bg-amber-100 border-amber-400 text-amber-900',
    indigo: 'bg-indigo-100 border-indigo-300 text-indigo-900',
  };
  return (
    <div className={`border-2 rounded-lg px-2 py-1.5 text-xs font-medium text-center ${colors[color]} ${className}`}>
      {children}
    </div>
  );
};

const Arrow = ({ label = '', vertical = true }: any) => (
  <div className={`flex items-center justify-center ${vertical ? 'flex-col py-0.5' : 'flex-row px-0.5'}`}>
    {label && <div className="text-[10px] text-slate-500 mb-0.5">{label}</div>}
    <div className="text-slate-400 text-sm leading-none">{vertical ? '↓' : '→'}</div>
  </div>
);

const ImprecisionFlowchart = ({ highlight }: any) => (
  <div className="space-y-1">
    <FlowBox color="slate">CIが閾値(null/MID)を跨ぐか?</FlowBox>
    <div className="grid grid-cols-2 gap-2">
      <div>
        <div className="text-[10px] text-center text-slate-500">Yes</div>
        <Arrow />
        <FlowBox color="red" className={highlight === 'rate_down_1' ? 'ring-2 ring-red-500' : 'opacity-70'}>1段階下げる</FlowBox>
        <div className="text-[10px] text-slate-500 mt-1 text-center">2閾値跨ぐ or "may"相当 → 2段階も検討</div>
      </div>
      <div>
        <div className="text-[10px] text-center text-slate-500">No</div>
        <Arrow />
        <FlowBox color="slate">大きな効果?</FlowBox>
        <Arrow label="Yes" />
        <FlowBox color="slate">OIS評価</FlowBox>
        <Arrow />
        <FlowBox color="green" className={highlight === 'no_rate_down' ? 'ring-2 ring-emerald-500' : 'opacity-70'}>N≥OIS: 下げない</FlowBox>
      </div>
    </div>
  </div>
);

const InconsistencyFlowchart = ({ highlight }: any) => (
  <div className="space-y-1">
    <FlowBox color="slate">点推定値の違いが大きく、CIオーバーラップ限定?</FlowBox>
    <div className="grid grid-cols-2 gap-2">
      <div>
        <div className="text-[10px] text-center text-slate-500">No</div>
        <Arrow />
        <FlowBox color="green" className={highlight === 'no_rate_down' ? 'ring-2 ring-emerald-500' : 'opacity-70'}>下げない</FlowBox>
      </div>
      <div>
        <div className="text-[10px] text-center text-slate-500">Yes</div>
        <Arrow />
        <FlowBox color="slate">閾値との関係</FlowBox>
        <Arrow />
        <FlowBox color="red" className={highlight === 'rate_down_1' || highlight === 'rate_down_2' ? 'ring-2 ring-red-500' : 'opacity-70'}>両側散らばる: 下げる</FlowBox>
      </div>
    </div>
  </div>
);

const RobFlowchart = ({ highlight }: any) => (
  <div className="space-y-1">
    <FlowBox color="slate">高リスク試験が支配的(&gt;55-65%の重み)?</FlowBox>
    <div className="grid grid-cols-2 gap-2">
      <div>
        <div className="text-[10px] text-center text-slate-500">Yes</div>
        <Arrow />
        <FlowBox color="red" className={highlight === 'rate_down_1' || highlight === 'rate_down_2' ? 'ring-2 ring-red-500' : 'opacity-70'}>下げる(方向で説明不可なら)</FlowBox>
      </div>
      <div>
        <div className="text-[10px] text-center text-slate-500">No</div>
        <Arrow />
        <FlowBox color="slate">低vs高で結果が違う?</FlowBox>
        <Arrow />
        <FlowBox color="green" className={highlight === 'no_rate_down' ? 'ring-2 ring-emerald-500' : 'opacity-70'}>下げない</FlowBox>
      </div>
    </div>
  </div>
);

const IndirectnessFlowchart = ({ highlight }: any) => (
  <div className="space-y-1">
    <FlowBox color="slate">target PICOと研究PICOの差異</FlowBox>
    <Arrow />
    <FlowBox color="slate">同じ影響と考えられるか?</FlowBox>
    <div className="grid grid-cols-3 gap-1 mt-1">
      <FlowBox color="green" className={highlight === 'no_rate_down' ? 'ring-2 ring-emerald-500' : 'opacity-70'}>Yes: 下げない</FlowBox>
      <FlowBox color="red" className={highlight === 'rate_down_1' ? 'ring-2 ring-red-500' : 'opacity-70'}>Dissimilar: 1段階</FlowBox>
      <FlowBox color="red" className={highlight === 'rate_down_2' ? 'ring-2 ring-red-500' : 'opacity-70'}>Very dissimilar: 2段階</FlowBox>
    </div>
  </div>
);

const PublicationFlowchart = ({ highlight }: any) => (
  <div className="space-y-1">
    <FlowBox color="slate">多くが小規模 &amp; 企業資金?</FlowBox>
    <div className="grid grid-cols-2 gap-2">
      <div>
        <div className="text-[10px] text-center text-slate-500">Yes</div>
        <Arrow />
        <FlowBox color="red" className={highlight === 'rate_down_1' ? 'ring-2 ring-red-500' : 'opacity-70'}>下げる</FlowBox>
      </div>
      <div>
        <div className="text-[10px] text-center text-slate-500">No</div>
        <Arrow />
        <FlowBox color="slate">統計分析可能(≥10試験)?</FlowBox>
        <Arrow />
        <FlowBox color="slate">funnel非対称 or 未公表記録?</FlowBox>
        <Arrow />
        <FlowBox color="green" className={highlight === 'no_rate_down' ? 'ring-2 ring-emerald-500' : 'opacity-70'}>No: 下げない</FlowBox>
      </div>
    </div>
  </div>
);

const DomainFlowchart = ({ domainId, highlight }: any) => {
  switch (domainId) {
    case 'rob': return <RobFlowchart highlight={highlight} />;
    case 'imprecision': return <ImprecisionFlowchart highlight={highlight} />;
    case 'inconsistency': return <InconsistencyFlowchart highlight={highlight} />;
    case 'indirectness': return <IndirectnessFlowchart highlight={highlight} />;
    case 'publication': return <PublicationFlowchart highlight={highlight} />;
    default: return null;
  }
};

const CIVisualizer = ({ pointEstimate, ciLow, ciHigh, nullValue, midBenefit, midHarm, unit }: any) => {
  const allValues = [pointEstimate, ciLow, ciHigh, nullValue, midBenefit, midHarm].filter((v) => v !== undefined && v !== null);
  if (allValues.length < 3) return null;
  const min = Math.min(...allValues);
  const max = Math.max(...allValues);
  const range = max - min || 1;
  const padding = range * 0.15;
  const plotMin = min - padding;
  const plotMax = max + padding;
  const plotRange = plotMax - plotMin;
  const pos = (v: number) => ((v - plotMin) / plotRange) * 100;

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3">
      <div className="text-[10px] text-slate-500 mb-2 font-semibold">CIと閾値の関係 ({unit})</div>
      <div className="relative h-16">
        <div className="absolute top-8 left-0 right-0 h-px bg-slate-300"></div>
        {nullValue !== undefined && nullValue !== null && (
          <div className="absolute top-2 bottom-2" style={{ left: `${pos(nullValue)}%` }}>
            <div className="w-px h-full bg-slate-500"></div>
            <div className="absolute -bottom-5 text-[9px] text-slate-600 -translate-x-1/2 whitespace-nowrap">null</div>
          </div>
        )}
        {midBenefit !== undefined && midBenefit !== null && (
          <div className="absolute top-2 bottom-2" style={{ left: `${pos(midBenefit)}%` }}>
            <div className="w-px h-full bg-emerald-500"></div>
            <div className="absolute -bottom-5 text-[9px] text-emerald-700 -translate-x-1/2 whitespace-nowrap">MID利益</div>
          </div>
        )}
        {midHarm !== undefined && midHarm !== null && midHarm !== midBenefit && (
          <div className="absolute top-2 bottom-2" style={{ left: `${pos(midHarm)}%` }}>
            <div className="w-px h-full bg-red-500"></div>
            <div className="absolute -bottom-5 text-[9px] text-red-700 -translate-x-1/2 whitespace-nowrap">MID害</div>
          </div>
        )}
        <div className="absolute top-7 h-0.5 bg-indigo-500" style={{ left: `${pos(ciLow)}%`, width: `${pos(ciHigh) - pos(ciLow)}%` }}></div>
        <div className="absolute top-6 w-0.5 h-1.5 bg-indigo-500" style={{ left: `${pos(ciLow)}%` }}></div>
        <div className="absolute top-6 w-0.5 h-1.5 bg-indigo-500" style={{ left: `${pos(ciHigh)}%` }}></div>
        <div className="absolute top-6 w-2 h-2 bg-indigo-600 rounded-full -translate-x-1/2" style={{ left: `${pos(pointEstimate)}%` }}></div>
      </div>
      <div className="flex justify-between text-[10px] text-slate-500 mt-1">
        <span>{plotMin.toFixed(2)}</span>
        <span>{plotMax.toFixed(2)}</span>
      </div>
    </div>
  );
};

const SoFTable = ({ outcomes }: any) => {
  if (!outcomes || outcomes.length === 0) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
      <div className="bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 flex items-center gap-1">
        <Table className="w-3.5 h-3.5" /> Summary of Findings Table
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-2 py-2 font-semibold text-slate-700">アウトカム</th>
              <th className="text-left px-2 py-2 font-semibold text-slate-700">試験数 / N</th>
              <th className="text-left px-2 py-2 font-semibold text-slate-700">相対効果</th>
              <th className="text-left px-2 py-2 font-semibold text-slate-700">絶対効果</th>
              <th className="text-left px-2 py-2 font-semibold text-slate-700">Certainty</th>
              <th className="text-left px-2 py-2 font-semibold text-slate-700">重要度</th>
            </tr>
          </thead>
          <tbody>
            {outcomes.map((o: any, i: number) => {
              const cert = CERTAINTY_LEVELS.find((c) => c.id === o.certainty);
              return (
                <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-2 py-2 text-slate-800 font-medium">{o.name}</td>
                  <td className="px-2 py-2 text-slate-600">{o.trials}/{o.n.toLocaleString()}</td>
                  <td className="px-2 py-2 text-slate-600 font-mono text-[11px]">{o.relative_effect}</td>
                  <td className="px-2 py-2 text-slate-600 text-[11px]">{o.absolute_effect}</td>
                  <td className="px-2 py-2">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 4 }).map((_, j) => (
                        <span key={j} className={j < (cert?.stars || 0) ? 'text-amber-500' : 'text-slate-300'}>★</span>
                      ))}
                    </div>
                    <div className="text-[10px] text-slate-500">{cert?.labelJa}</div>
                  </td>
                  <td className="px-2 py-2">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                      o.importance === 'critical' ? 'bg-red-100 text-red-700' :
                      o.importance === 'important' ? 'bg-amber-100 text-amber-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {o.importance === 'critical' ? '重大' : o.importance === 'important' ? '重要' : 'その他'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const validateCase = (c: any): string | null => {
  if (!c || typeof c !== 'object') return 'JSONがオブジェクトでない';
  const required = ['title', 'field', 'target_pico', 'ci_data', 'pooled_result',
    'trial_characteristics', 'risk_of_bias_info', 'heterogeneity', 'applicability_notes', 'search_and_publication',
    'correct_judgments', 'final_certainty', 'sof_outcomes', 'etd_framework'];
  for (const key of required) {
    if (!(key in c)) return `必須フィールド欠落: ${key}`;
  }
  if (!c.correct_judgments || typeof c.correct_judgments !== 'object') return 'correct_judgmentsが不正';
  for (const d of DOMAINS) {
    if (!c.correct_judgments[d.id]) return `correct_judgments.${d.id}がない`;
    if (!['no_rate_down', 'rate_down_1', 'rate_down_2'].includes(c.correct_judgments[d.id].decision)) {
      return `correct_judgments.${d.id}.decisionが不正`;
    }
  }
  if (!['high', 'moderate', 'low', 'very_low'].includes(c.final_certainty)) return 'final_certaintyが不正';
  if (!Array.isArray(c.sof_outcomes) || c.sof_outcomes.length === 0) return 'sof_outcomesが空';
  if (!c.etd_framework.correct_recommendation ||
      !['strong_for', 'conditional_for', 'conditional_against', 'strong_against'].includes(c.etd_framework.correct_recommendation)) {
    return 'etd_framework.correct_recommendationが不正';
  }
  return null;
};

interface Props {
  onOpenApiKeySetup: () => void;
  onOpenGuide: () => void;
}

export default function BiasDetective({ onOpenApiKeySetup, onOpenGuide }: Props) {
  const [screen, setScreen] = useState<'menu' | 'loading' | 'play'>('menu');
  const [difficulty, setDifficulty] = useState<keyof typeof DIFFICULTY>('medium');
  const [topic, setTopic] = useState<string>('');
  const [topicMode, setTopicMode] = useState<'free' | 'preset'>('free');
  const [presetPickMode, setPresetPickMode] = useState<'random' | 'list'>('random');
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [srCase, setSrCase] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [finalCertainty, setFinalCertainty] = useState<string | null>(null);
  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [score, setScore] = useState(0);
  const [casesPlayed, setCasesPlayed] = useState(0);
  const [hintUsed, setHintUsed] = useState(false);
  const [hint, setHint] = useState('');
  const [loadingHint, setLoadingHint] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'paper' | 'sof' | 'flowchart' | 'etd'>('paper');
  const [activeDomain, setActiveDomain] = useState<string>('rob');
  const [phase, setPhase] = useState<'grade' | 'etd'>('grade');
  const [loadingMessage, setLoadingMessage] = useState('SRケースを生成中...');

  const hasApiKey = !!getApiKey();

  const generateCase = async (diff: keyof typeof DIFFICULTY, topicOverride?: string) => {
    if (!getApiKey()) {
      setError('先にGoogle Gemini APIキーを設定してください。');
      return;
    }

    const resolveTopic = (): string => {
      if (topicOverride !== undefined) return topicOverride;
      if (topicMode === 'preset') {
        if (presetPickMode === 'random') {
          return PRESET_TOPICS[Math.floor(Math.random() * PRESET_TOPICS.length)];
        }
        return selectedPreset;
      }
      return topic;
    };
    const topicTrimmed = resolveTopic().trim().slice(0, 80);

    setScreen('loading');
    setError('');
    setAnswers({});
    setFinalCertainty(null);
    setRecommendation(null);
    setResult(null);
    setHintUsed(false);
    setHint('');
    setActiveTab('paper');
    setPhase('grade');

    const makePrompt = (attempt: number) => [
      'あなたは臨床疫学の教育者です。Core GRADE (Guyattら 2025 BMJ series) の学習用として、RCTのシステマティックレビュー(SR)の架空ケースを生成してください。',
      '',
      '難易度: ' + DIFFICULTY[diff].label + ' — ' + DIFFICULTY[diff].desc,
      topicTrimmed
        ? `【題材指定】今回のケースは必ず「${topicTrimmed}」に関連する診療領域・疾患・手技・集団で作成してください。field および clinical_scenario はこの題材に合致させ、target_pico も違和感のない範囲で題材に即すこと。ただし学習価値を確保するため、RCT/SRとして臨床的に妥当な介入・比較・アウトカム・効果推定値・不均一性・RoBプロファイルを構築してください(非現実的な題材でも無理に押し通さず、隣接領域で補正してよい)。`
        : '',
      attempt > 1 ? `\n【再試行${attempt}回目】前回のJSONが不完全でした。簡潔かつ完全なJSONを返してください。` : '',
      '',
      '【厳守】有効なJSONのみを返すこと。前置き・解説・コードブロック記法は一切含めない。文字列内のダブルクォートは必ずエスケープ(\\")する。',
      '',
      '以下のスキーマに厳密に従う:',
      '',
      '{',
      '  "title": "string (SRタイトル日本語)",',
      '  "field": "string (診療科)",',
      '  "clinical_scenario": "string (80-120字)",',
      '  "target_pico": {',
      '    "population": "string",',
      '    "intervention": "string",',
      '    "comparator": "string",',
      '    "outcome": "string (主要アウトカム名)"',
      '  },',
      '  "outcome_type": "binary or continuous",',
      '  "mid_description": "string",',
      '  "ci_data": {',
      '    "point_estimate_num": number,',
      '    "ci_low_num": number,',
      '    "ci_high_num": number,',
      '    "null_value_num": number,',
      '    "mid_benefit_num": number,',
      '    "mid_harm_num": number or null,',
      '    "unit": "string"',
      '  },',
      '  "num_trials": integer,',
      '  "total_n": integer,',
      '  "pooled_result": {',
      '    "effect_measure": "string",',
      '    "point_estimate": "string",',
      '    "ci_95": "string",',
      '    "absolute_effect": "string",',
      '    "interpretation": "string"',
      '  },',
      '  "trial_characteristics": "string (3-4文、組入試験の設計・母集団・介入内容・追跡期間の概要)",',
      '  "risk_of_bias_info": "string (4-6文、RoB2の5ドメインを必ず網羅: (1)ランダム化の生成方法・割付の隠蔽化、(2)介入への盲検化(参加者・医療者)、(3)脱落率/ITT解析の有無、(4)アウトカム測定者の盲検化・測定方法の客観性、(5)事前登録(prospective registration)と結果報告の完全性)。難易度に応じバイアス源を混ぜて記述する。",',
      '  "heterogeneity": "string (2-3文、I²値含む)",',
      '  "applicability_notes": "string (2-3文)",',
      '  "search_and_publication": "string (2-3文)",',
      '  "correct_judgments": {',
      '    "rob": {"decision": "no_rate_down/rate_down_1/rate_down_2", "rationale": "string (100-150字)", "flowchart_path": "string (50-80字)"},',
      '    "imprecision": {"decision": "...", "rationale": "...", "flowchart_path": "..."},',
      '    "inconsistency": {"decision": "...", "rationale": "...", "flowchart_path": "..."},',
      '    "indirectness": {"decision": "...", "rationale": "...", "flowchart_path": "..."},',
      '    "publication": {"decision": "...", "rationale": "...", "flowchart_path": "..."}',
      '  },',
      '  "final_certainty": "high/moderate/low/very_low",',
      '  "final_rationale": "string (150-200字、gestalt判断の説明)",',
      '  "teaching_point": "string (100-150字)",',
      '  "sof_outcomes": [',
      '    {',
      '      "name": "string (アウトカム名、主要アウトカムを含む3-4個)",',
      '      "importance": "critical/important/other",',
      '      "trials": integer,',
      '      "n": integer,',
      '      "relative_effect": "string (例: RR 0.75 (95% CI 0.60-0.94))",',
      '      "absolute_effect": "string (例: 1000人あたり12人減 (8-16人減))",',
      '      "certainty": "high/moderate/low/very_low"',
      '    }',
      '  ],',
      '  "etd_framework": {',
      '    "benefits_harms_summary": "string (100-150字、ベネフィットとハームのバランス)",',
      '    "values_preferences": "string (100-150字、患者の価値観・選好の想定)",',
      '    "resources_feasibility": "string (80-120字、コスト・実行可能性)",',
      '    "correct_recommendation": "strong_for/conditional_for/conditional_against/strong_against",',
      '    "recommendation_rationale": "string (200-250字、なぜその強さ・方向か)"',
      '  }',
      '}',
      '',
      '【重要な数値的整合性】',
      '1. RRなら null=1.0、MDなら null=0',
      '2. CIと点推定値の関係から、rob以外のドメイン(imprecision/inconsistencyなど)の判断が論理的に導けるようにする',
      '3. sof_outcomesには主要アウトカムを必ず含み、他2-3個のアウトカムも追加(ハーム/副次/QOL等)',
      '4. 難易度別rate down数: 初級1-2 / 中級2-3 / 上級3-4',
      '5. 最終certainty → 推奨の強さ: High/Moderate → Strong可、Low/Very Low → 原則Conditional',
      '6. EtD推奨方向は絶対効果とMIDから妥当に導く',
      '7. RoBの判断(no_rate_down/rate_down_1/rate_down_2)は、必ず risk_of_bias_info に記述した5ドメインの具体情報から学習者が独力で導けるようにする。rationaleは risk_of_bias_info と矛盾してはならない。',
    ].filter(Boolean).join('\n');

    const maxAttempts = 3;
    let lastText = '';
    let lastFinish = '';
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      setLoadingMessage(`SRケース生成中... (試行${attempt}/${maxAttempts})`);
      try {
        // 試行1-2は responseSchema を使って構造化出力(最も安定)
        // 試行3は schemaなし + より高いmax_tokens でフォールバック
        const useSchema = attempt <= 2;
        const { text, finishReason } = await generateText(makePrompt(attempt), {
          maxOutputTokens: useSchema ? 8192 : 16384,
          temperature: attempt === 1 ? 0.85 : 0.7,
          responseMimeType: 'application/json',
          responseSchema: useSchema ? SR_CASE_SCHEMA : undefined,
        });
        lastText = text;
        lastFinish = finishReason || '';
        const parsed = extractJsonRobust(text);

        if (!parsed) {
          console.warn(`試行${attempt}: JSONパース失敗 (finish=${finishReason})\nレスポンス先頭300字:`, text.slice(0, 300));
          if (attempt === maxAttempts) {
            const preview = text.slice(0, 200).replace(/\s+/g, ' ');
            const tips = finishReason === 'MAX_TOKENS'
              ? '原因: トークン上限で途切れた。モデルを gemini-2.5-flash に変更すると改善することがあります。'
              : '原因: モデルが予期しない形式で返した。モデルを gemini-2.5-flash(高品質) と gemini-2.5-flash-lite(軽量) で切り替えてみてください。';
            setError(`ケース生成に失敗: JSONパース不能(3回試行)\n${tips}\n\n【finishReason】${finishReason || '不明'}\n【応答先頭】${preview}...`);
            setScreen('menu');
            return;
          }
          continue;
        }

        const validationError = validateCase(parsed);
        if (validationError) {
          console.warn(`試行${attempt}: 検証失敗 - ${validationError}`);
          if (attempt === maxAttempts) {
            setError(`ケース生成に失敗: ${validationError}\n(モデルをgemini-2.5-flashに変えると改善することがあります)`);
            setScreen('menu');
            return;
          }
          continue;
        }

        setSrCase(parsed);
        setScreen('play');
        return;
      } catch (e: any) {
        console.error(`試行${attempt}エラー:`, e);
        if (e instanceof ApiError) {
          // リトライ可能なエラーは自動的にgenerateText内で処理済み。ここに来たら最終的な失敗
          setError(e.message);
          setScreen('menu');
          return;
        }
        if (attempt === maxAttempts) {
          setError(`ケース生成に失敗しました: ${String(e?.message || e).slice(0, 200)}\n通信状況とAPIキーを確認して、もう一度お試しください。\n(finishReason: ${lastFinish || '不明'})`);
          setScreen('menu');
          return;
        }
      }
    }
    // 念のためフォールバック
    if (lastText) {
      console.error('最終失敗。最後のレスポンス:', lastText.slice(0, 500));
    }
  };

  const setDomainAnswer = (domainId: string, decision: string) => {
    if (result) return;
    setAnswers((prev) => ({ ...prev, [domainId]: decision }));
  };

  const getHint = async () => {
    if (hintUsed || !srCase) return;
    setLoadingHint(true);

    const unanswered = DOMAINS.filter((d) => !answers[d.id]);
    const target = unanswered.length > 0 ? unanswered[0] : DOMAINS[0];

    const prompt = [
      '次のSRケースで「' + target.nameJa + '」ドメインの判断について、答えを明かさない方向性ヒントを1-2文(100字以内)で。',
      '',
      'ドメイン: ' + target.desc,
      '組入試験: ' + srCase.trial_characteristics,
      'RoB情報: ' + (srCase.risk_of_bias_info || '(未提示)'),
      '不均一性: ' + srCase.heterogeneity,
      '直接性: ' + srCase.applicability_notes,
      '検索/出版: ' + srCase.search_and_publication,
      '結果: ' + srCase.pooled_result.point_estimate + ' ' + srCase.pooled_result.ci_95 + ' / MID: ' + srCase.mid_description,
      '',
      'ヒントのみ出力。前置き不要。',
    ].join('\n');

    try {
      const { text } = await generateText(prompt, {
        maxOutputTokens: 300,
        temperature: 0.5,
        responseMimeType: 'text/plain',
      });
      setHint(text.trim());
      setHintUsed(true);
    } catch (e: any) {
      setHint(e instanceof ApiError ? e.message : 'ヒントを取得できませんでした。');
    }
    setLoadingHint(false);
  };

  const proceedToEtd = () => {
    if (DOMAINS.every((d) => answers[d.id]) && finalCertainty) {
      setPhase('etd');
      setActiveTab('paper');
    }
  };

  const submitAnswer = () => {
    const correct = srCase.correct_judgments;
    let domainCorrect = 0;
    const domainResults: Record<string, any> = {};

    DOMAINS.forEach((d) => {
      const userAnswer = answers[d.id];
      const correctAnswer = correct[d.id].decision;
      const isCorrect = userAnswer === correctAnswer;
      if (isCorrect) domainCorrect++;
      domainResults[d.id] = {
        user: userAnswer,
        correct: correctAnswer,
        isCorrect,
        rationale: correct[d.id].rationale,
        flowchartPath: correct[d.id].flowchart_path,
      };
    });

    const finalCorrect = finalCertainty === srCase.final_certainty;
    const recCorrect = recommendation === srCase.etd_framework.correct_recommendation;
    const domainPoints = domainCorrect * 6;
    const finalPoints = finalCorrect ? 15 : 0;
    const recPoints = recCorrect ? 20 : 0;
    const hintPenalty = hintUsed ? 5 : 0;
    const gained = Math.max(0, domainPoints + finalPoints + recPoints - hintPenalty);

    setScore((prev) => prev + gained);
    setCasesPlayed((prev) => prev + 1);

    setResult({
      domainResults,
      domainCorrect,
      finalCorrect,
      recCorrect,
      userFinal: finalCertainty,
      correctFinal: srCase.final_certainty,
      userRec: recommendation,
      correctRec: srCase.etd_framework.correct_recommendation,
      gained,
    });
    setActiveTab('paper');
  };

  const nextCase = () => generateCase(difficulty);
  const backToMenu = () => {
    setScreen('menu');
    setSrCase(null);
    setAnswers({});
    setFinalCertainty(null);
    setRecommendation(null);
    setResult(null);
    setPhase('grade');
  };

  const allDomainsAnswered = DOMAINS.every((d) => answers[d.id]);
  const canProceed = allDomainsAnswered && finalCertainty;
  const canSubmit = canProceed && recommendation;

  if (screen === 'menu') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 flex items-center justify-center">
        <div className="max-w-2xl w-full">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-500 mb-4 shadow-lg shadow-purple-500/30">
              <Activity className="w-10 h-10 text-white" strokeWidth={2.5} />
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">GRADE 探偵 Pro</h1>
            <p className="text-slate-300">SRのエビデンス評価から推奨決定まで一気通貫で学ぶ</p>
            <p className="text-slate-400 text-xs mt-2">Core GRADE (Guyatt et al. BMJ 2025) · SoFテーブル · EtD枠組み搭載</p>
            <p className="text-slate-500 text-[11px] mt-1">Powered by Google Gemini API</p>
          </div>

          <div className="mb-4 flex items-center gap-2">
            <button
              onClick={onOpenApiKeySetup}
              className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all border flex items-center justify-center gap-2 ${
                hasApiKey
                  ? 'bg-emerald-900/30 border-emerald-700 text-emerald-200 hover:bg-emerald-900/50'
                  : 'bg-amber-900/30 border-amber-600 text-amber-100 hover:bg-amber-900/50 animate-pulse'
              }`}
            >
              <Key className="w-4 h-4" />
              {hasApiKey ? 'APIキー設定済 (クリックで変更)' : '⚠ APIキーを設定してください'}
            </button>
            <button
              onClick={onOpenGuide}
              className="py-2.5 px-4 rounded-xl text-sm font-medium transition-all border border-slate-600 bg-slate-800/60 text-slate-200 hover:bg-slate-700 flex items-center justify-center gap-2 whitespace-nowrap"
              title="APIキーとは・取得方法・無料枠・トラブル対処"
            >
              📖 使い方ガイド
            </button>
          </div>

          {(score > 0 || casesPlayed > 0) && (
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-4 mb-6 flex justify-around text-white">
              <div className="text-center">
                <div className="text-3xl font-bold text-indigo-400">{score}</div>
                <div className="text-xs text-slate-400 mt-1">総スコア</div>
              </div>
              <div className="w-px bg-slate-700"></div>
              <div className="text-center">
                <div className="text-3xl font-bold text-indigo-400">{casesPlayed}</div>
                <div className="text-xs text-slate-400 mt-1">ケース解決</div>
              </div>
            </div>
          )}

          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-6 mb-4">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />難易度を選択
            </h2>
            <div className="space-y-3">
              {Object.entries(DIFFICULTY).map(([key, val]) => (
                <button
                  key={key}
                  onClick={() => setDifficulty(key as keyof typeof DIFFICULTY)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    difficulty === key ? 'border-indigo-400 bg-indigo-400/10' : 'border-slate-700 hover:border-slate-600 bg-slate-900/30'
                  }`}
                >
                  <div className="text-white font-semibold">{val.label}</div>
                  <div className="text-slate-400 text-sm mt-1">{val.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-6 mb-4">
            <div className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Target className="w-4 h-4 text-indigo-400" />題材を指定 <span className="text-xs font-normal text-slate-400">(任意)</span>
            </div>

            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={() => setTopicMode('free')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium border transition-all flex items-center justify-center gap-1.5 ${
                  topicMode === 'free'
                    ? 'border-indigo-400 bg-indigo-400/15 text-indigo-100'
                    : 'border-slate-700 bg-slate-900/40 text-slate-400 hover:border-slate-600'
                }`}
              >
                <Pencil className="w-3.5 h-3.5" />フリー入力
              </button>
              <button
                type="button"
                onClick={() => setTopicMode('preset')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium border transition-all flex items-center justify-center gap-1.5 ${
                  topicMode === 'preset'
                    ? 'border-indigo-400 bg-indigo-400/15 text-indigo-100'
                    : 'border-slate-700 bg-slate-900/40 text-slate-400 hover:border-slate-600'
                }`}
              >
                <List className="w-3.5 h-3.5" />プリセットから選ぶ
              </button>
            </div>

            {topicMode === 'free' ? (
              <>
                <input
                  id="topic-input"
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="例: 歯科 / 胃がん / ARDS / 親知らず抜歯"
                  maxLength={80}
                  className="w-full bg-slate-900 border border-slate-600 focus:border-indigo-400 rounded-lg px-3 py-2.5 text-white text-sm outline-none placeholder:text-slate-500"
                />
                <div className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                  空欄ならAIが自由に題材を選びます。診療科・疾患・手技・集団など自由に指定可。
                  題材が狭すぎる場合、隣接領域で補正される場合があります。
                </div>
              </>
            ) : (
              <>
                <div className="flex gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setPresetPickMode('random')}
                    className={`flex-1 py-1.5 px-2 rounded-md text-[11px] font-medium border transition-all flex items-center justify-center gap-1 ${
                      presetPickMode === 'random'
                        ? 'border-purple-400 bg-purple-400/15 text-purple-100'
                        : 'border-slate-700 bg-slate-900/40 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <Shuffle className="w-3 h-3" />ランダムに選ぶ
                  </button>
                  <button
                    type="button"
                    onClick={() => setPresetPickMode('list')}
                    className={`flex-1 py-1.5 px-2 rounded-md text-[11px] font-medium border transition-all flex items-center justify-center gap-1 ${
                      presetPickMode === 'list'
                        ? 'border-purple-400 bg-purple-400/15 text-purple-100'
                        : 'border-slate-700 bg-slate-900/40 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <List className="w-3 h-3" />リストから指定
                  </button>
                </div>

                {presetPickMode === 'list' ? (
                  <select
                    value={selectedPreset}
                    onChange={(e) => setSelectedPreset(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-600 focus:border-indigo-400 rounded-lg px-3 py-2.5 text-white text-sm outline-none"
                  >
                    <option value="">-- 領域を選択(未選択時はAIが自由選択) --</option>
                    {PRESET_TOPICS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                ) : (
                  <div className="w-full bg-slate-900/60 border border-dashed border-slate-600 rounded-lg px-3 py-2.5 text-slate-300 text-xs leading-relaxed flex items-start gap-2">
                    <Shuffle className="w-3.5 h-3.5 mt-0.5 text-purple-400 shrink-0" />
                    <span>生成ボタンを押すたびに、{PRESET_TOPICS.length}領域からランダムに1つ選ばれます。バリエーション豊富な学習におすすめ。</span>
                  </div>
                )}
                <div className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                  プリセットは診療領域の粒度で定義。題材が狭すぎる場合、AIが隣接領域で補正します。
                </div>
              </>
            )}
          </div>

          <div className="bg-amber-900/20 border border-amber-700/50 rounded-xl p-4 mb-4 text-xs text-amber-100/90">
            <div className="font-semibold text-amber-200 mb-2 flex items-center gap-1">
              <Info className="w-3.5 h-3.5" />ご利用にあたって
            </div>
            <ul className="space-y-1.5 list-disc list-inside leading-relaxed">
              <li>基本的訓練のためのアプリのため、厳密な評価でない場合があります。</li>
              <li>
                シナリオ・解説は、AIが作成しており、AIの能力に従います。
                より高性能を求める方は、これを利用して他のAPIで動くように修正してください。
              </li>
              <li>
                さらに詳しく学びたい方は:
                <ul className="mt-1 ml-4 space-y-1 list-none">
                  <li>
                    ・
                    <a
                      href="https://mxe050.github.io/CPGSRuser/#page-0"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-300 hover:text-indigo-200 underline inline-flex items-center gap-1"
                    >
                      EBMの実践のためのGRADE
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </li>
                  <li>
                    ・
                    <a
                      href="https://core-grade-guide-1-mxe050s-projects.vercel.app"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-300 hover:text-indigo-200 underline inline-flex items-center gap-1"
                    >
                      CPG/SR作成者のためのGRADE
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </li>
                </ul>
              </li>
            </ul>
          </div>

          <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-4 mb-4 text-xs text-slate-300">
            <div className="font-semibold text-slate-200 mb-2 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" />ゲームの流れ (3ステップ)
            </div>
            <ol className="space-y-1 list-decimal list-inside text-slate-400">
              <li><span className="text-indigo-300">Phase 1:</span> 5ドメインでrate down判断 + 最終certainty決定</li>
              <li><span className="text-indigo-300">Phase 2:</span> Summary of Findings + EtDを見て推奨(strong/conditional × for/against)を決定</li>
              <li><span className="text-indigo-300">Phase 3:</span> 各判断の正解・フローチャート経路・gestalt解説を確認</li>
            </ol>
          </div>

          <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-4 mb-4 text-xs text-slate-300">
            <div className="font-semibold text-slate-200 mb-2 flex items-center gap-1">
              <Table className="w-3.5 h-3.5" />4つのタブの使い分け
            </div>
            <ul className="space-y-1.5 text-slate-400">
              <li><span className="text-slate-200 font-semibold">📄 SR論文:</span> 試験特性・不均一性・直接性・検索情報などの<span className="text-indigo-300">一次情報</span>。Phase 1の5ドメイン判断の根拠を探す場所。</li>
              <li><span className="text-slate-200 font-semibold">📊 SoF表:</span> 全アウトカムの効果推定値とcertaintyの<span className="text-indigo-300">全体像</span>。複数アウトカムのバランスを見て推奨決定に使う。</li>
              <li><span className="text-slate-200 font-semibold">🔀 フロー:</span> 迷ったとき、ドメインごとの<span className="text-indigo-300">判断ロジック</span>を図で確認。各ドメインのボタンから直接ジャンプ可。</li>
              <li><span className="text-slate-200 font-semibold">✅ EtD:</span> 推奨決定に必要な<span className="text-indigo-300">ベネフィット/ハーム・価値観・資源</span>。Phase 2で主に使う(Phase 1では閲覧のみ可)。</li>
            </ul>
          </div>

          {error && <div className="bg-red-900/30 border border-red-700 text-red-200 rounded-xl p-3 mb-4 text-sm whitespace-pre-wrap">{error}</div>}

          <button
            onClick={() => generateCase(difficulty)}
            disabled={!hasApiKey}
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl shadow-lg shadow-purple-500/30 transition-all flex items-center justify-center gap-2"
          >
            <BookOpen className="w-5 h-5" />新しいCPG・SRケースを生成
          </button>
          {!hasApiKey && (
            <p className="text-center text-amber-300 text-xs mt-2">↑ まず上の「APIキーを設定」から設定してください</p>
          )}
        </div>
      </div>
    );
  }

  if (screen === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <RefreshCw className="w-12 h-12 text-indigo-400 animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">{loadingMessage}</p>
          <p className="text-slate-400 text-sm mt-2">GeminiがSRケースを執筆中...</p>
          <p className="text-slate-500 text-xs mt-4">失敗時は自動で再試行されます(最大3回)</p>
        </div>
      </div>
    );
  }

  if (screen === 'play' && srCase) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-4">
            <button onClick={backToMenu} className="text-slate-600 hover:text-slate-900 text-sm flex items-center gap-1">
              ← メニュー
            </button>
            <div className="flex items-center gap-3 text-sm">
              <span className="flex items-center gap-1 text-indigo-600 font-semibold">
                <Award className="w-4 h-4" /> {score}
              </span>
              <span className="text-slate-400">|</span>
              <span className="text-slate-600">{DIFFICULTY[difficulty].label}</span>
            </div>
          </div>

          <div className="mb-4 flex items-center gap-2 text-xs flex-wrap">
            <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full ${phase === 'grade' ? 'bg-indigo-500 text-white font-semibold' : result ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
              <span className="w-4 h-4 rounded-full bg-white/30 flex items-center justify-center text-[10px]">1</span>
              Phase 1: GRADE評価
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
            <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full ${phase === 'etd' && !result ? 'bg-indigo-500 text-white font-semibold' : result ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
              <span className="w-4 h-4 rounded-full bg-white/30 flex items-center justify-center text-[10px]">2</span>
              Phase 2: 推奨決定
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
            <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full ${result ? 'bg-indigo-500 text-white font-semibold' : 'bg-slate-200 text-slate-600'}`}>
              <span className="w-4 h-4 rounded-full bg-white/30 flex items-center justify-center text-[10px]">3</span>
              Phase 3: 解説
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3">
              <div className="flex gap-1 mb-3 bg-white rounded-xl border border-slate-200 p-1">
                <button
                  onClick={() => setActiveTab('paper')}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${activeTab === 'paper' ? 'bg-indigo-500 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  <FileText className="w-3.5 h-3.5 inline mr-1" />SR論文
                </button>
                <button
                  onClick={() => setActiveTab('sof')}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${activeTab === 'sof' ? 'bg-indigo-500 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  <Table className="w-3.5 h-3.5 inline mr-1" />SoF表
                </button>
                <button
                  onClick={() => setActiveTab('flowchart')}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${activeTab === 'flowchart' ? 'bg-indigo-500 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  <Activity className="w-3.5 h-3.5 inline mr-1" />フロー
                </button>
                <button
                  onClick={() => setActiveTab('etd')}
                  disabled={phase === 'grade' && !result}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${activeTab === 'etd' ? 'bg-indigo-500 text-white' : 'text-slate-600 hover:bg-slate-100 disabled:opacity-40'}`}
                >
                  <ClipboardCheck className="w-3.5 h-3.5 inline mr-1" />EtD
                </button>
              </div>

              {!result && (
                <div className="mb-3 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-3 text-xs">
                  <div className="font-semibold text-indigo-900 mb-1.5 flex items-center gap-1">
                    <Lightbulb className="w-3.5 h-3.5" />
                    {phase === 'grade' ? 'Phase 1: 各タブをこう使う' : 'Phase 2: 各タブをこう使う'}
                  </div>
                  {phase === 'grade' ? (
                    <ul className="space-y-0.5 text-slate-700">
                      <li><span className="font-semibold">📄 SR論文:</span> 主に使う。組入試験の特徴→ROB、不均一性→Inconsistency、直接性→Indirectness、検索→Publication bias、CI図→Imprecisionを判断</li>
                      <li><span className="font-semibold">📊 SoF表:</span> 他アウトカムの情報を参考に見る(最終certaintyのgestalt判断に役立つ)</li>
                      <li><span className="font-semibold">🔀 フロー:</span> 判断に迷ったらドメインボタン→自動でフロー表示、または手動でこのタブへ</li>
                      <li><span className="font-semibold text-slate-400">✅ EtD:</span> Phase 2まで閲覧不可</li>
                    </ul>
                  ) : (
                    <ul className="space-y-0.5 text-slate-700">
                      <li><span className="font-semibold">✅ EtD:</span> メインで使う。ベネフィット/ハームのバランス・患者の価値観・資源から推奨の方向と強さを決める</li>
                      <li><span className="font-semibold">📊 SoF表:</span> 複数アウトカムのcertaintyと絶対効果を俯瞰。critical outcomeに注目</li>
                      <li><span className="font-semibold">📄 SR論文:</span> 必要なら結果の詳細を確認</li>
                      <li><span className="font-semibold text-slate-500">🔀 フロー:</span> Phase 1の振り返りに使う(Phase 2では判断に使わない)</li>
                    </ul>
                  )}
                </div>
              )}

              {activeTab === 'paper' && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                  <div className="mb-4">
                    <div className="inline-block bg-indigo-100 text-indigo-700 text-xs font-medium px-2 py-1 rounded mb-2">
                      {srCase.field} · Systematic Review of RCTs
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 leading-snug">{srCase.title}</h2>
                    <p className="text-xs text-slate-500 mt-2 italic">{srCase.clinical_scenario}</p>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-4">
                    <div className="text-xs font-semibold text-slate-500 mb-2">Target PICO</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <div><span className="font-semibold text-slate-700">P:</span> <span className="text-slate-600">{srCase.target_pico.population}</span></div>
                      <div><span className="font-semibold text-slate-700">I:</span> <span className="text-slate-600">{srCase.target_pico.intervention}</span></div>
                      <div><span className="font-semibold text-slate-700">C:</span> <span className="text-slate-600">{srCase.target_pico.comparator}</span></div>
                      <div><span className="font-semibold text-slate-700">O:</span> <span className="text-slate-600">{srCase.target_pico.outcome}</span></div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-4 mb-4">
                    <div className="text-xs font-semibold text-indigo-700 mb-2">主要アウトカムの結果</div>
                    <div className="grid grid-cols-3 gap-3 text-sm mb-2">
                      <div>
                        <div className="text-xs text-slate-500">指標</div>
                        <div className="font-semibold text-slate-800">{srCase.pooled_result.effect_measure}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500">点推定値</div>
                        <div className="font-semibold text-slate-800">{srCase.pooled_result.point_estimate}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500">95% CI</div>
                        <div className="font-semibold text-slate-800">{srCase.pooled_result.ci_95}</div>
                      </div>
                    </div>
                    <div className="text-xs text-slate-600 border-t border-indigo-200 pt-2 mt-2 space-y-1">
                      <div><span className="font-semibold">絶対効果: </span>{srCase.pooled_result.absolute_effect}</div>
                      <div><span className="font-semibold">解釈: </span>{srCase.pooled_result.interpretation}</div>
                      <div><span className="font-semibold">試験数: </span>{srCase.num_trials}本 / <span className="font-semibold">総N: </span>{srCase.total_n.toLocaleString()}</div>
                      <div><span className="font-semibold">MID: </span>{srCase.mid_description}</div>
                    </div>

                    {srCase.ci_data && (
                      <div className="mt-3">
                        <CIVisualizer
                          pointEstimate={srCase.ci_data.point_estimate_num}
                          ciLow={srCase.ci_data.ci_low_num}
                          ciHigh={srCase.ci_data.ci_high_num}
                          nullValue={srCase.ci_data.null_value_num}
                          midBenefit={srCase.ci_data.mid_benefit_num}
                          midHarm={srCase.ci_data.mid_harm_num}
                          unit={srCase.ci_data.unit}
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-4 text-sm text-slate-700 leading-relaxed">
                    <section>
                      <h3 className="font-semibold text-slate-900 text-sm mb-2 border-b border-slate-200 pb-1 flex items-center gap-1">
                        <Shield className="w-3.5 h-3.5 text-slate-600" />組入試験の特徴
                      </h3>
                      <p>{srCase.trial_characteristics}</p>
                    </section>
                    <section className="bg-red-50/60 border border-red-200 rounded-lg p-3 -mx-1">
                      <h3 className="font-semibold text-red-900 text-sm mb-2 border-b border-red-200 pb-1 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-500" />バイアスリスク情報 (RoB2の5ドメイン)
                      </h3>
                      <p className="text-slate-800 whitespace-pre-line">
                        {srCase.risk_of_bias_info || '(生成されませんでした。新しいケースを生成してください)'}
                      </p>
                    </section>
                    <section>
                      <h3 className="font-semibold text-slate-900 text-sm mb-2 border-b border-slate-200 pb-1 flex items-center gap-1">
                        <BarChart3 className="w-3.5 h-3.5 text-amber-500" />不均一性
                      </h3>
                      <p>{srCase.heterogeneity}</p>
                    </section>
                    <section>
                      <h3 className="font-semibold text-slate-900 text-sm mb-2 border-b border-slate-200 pb-1 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-blue-500" />直接性
                      </h3>
                      <p>{srCase.applicability_notes}</p>
                    </section>
                    <section>
                      <h3 className="font-semibold text-slate-900 text-sm mb-2 border-b border-slate-200 pb-1 flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5 text-purple-500" />検索・出版バイアス
                      </h3>
                      <p>{srCase.search_and_publication}</p>
                    </section>
                  </div>

                  {hint && (
                    <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2">
                      <Lightbulb className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-amber-900">{hint}</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'sof' && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                  <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <Table className="w-5 h-5 text-indigo-500" />Summary of Findings
                  </h3>
                  <p className="text-xs text-slate-500 mb-3">各アウトカムの効果推定値とcertaintyをまとめた表。推奨を決める際の核となる情報源です。</p>
                  <SoFTable outcomes={srCase.sof_outcomes} />
                </div>
              )}

              {activeTab === 'flowchart' && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                  <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-indigo-500" />ドメイン別 判断フローチャート
                  </h3>
                  <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
                    {DOMAINS.map((d) => {
                      const Icon = d.icon;
                      const isActive = activeDomain === d.id;
                      return (
                        <button
                          key={d.id}
                          onClick={() => setActiveDomain(d.id)}
                          className={`flex-shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                            isActive ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          <Icon className="w-3 h-3" />{d.nameJa}
                        </button>
                      );
                    })}
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                    <DomainFlowchart domainId={activeDomain} highlight={result?.domainResults[activeDomain]?.correct} />
                  </div>
                  <div className="mt-3 text-xs text-slate-500 bg-blue-50 border border-blue-200 rounded p-2">
                    💡 Core GRADE BMJ series 原図に基づくフローチャート要約です。
                    {result && <span className="block mt-1 font-semibold text-blue-900">正解パスがハイライトされています。</span>}
                  </div>
                </div>
              )}

              {activeTab === 'etd' && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                  <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <ClipboardCheck className="w-5 h-5 text-indigo-500" />Evidence to Decision (EtD) 枠組み
                  </h3>
                  <p className="text-xs text-slate-500 mb-3">推奨の方向と強さを決めるための情報です。</p>

                  <div className="space-y-3 text-sm">
                    <div className="border border-slate-200 rounded-lg p-3">
                      <div className="text-xs font-semibold text-slate-500 mb-1 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />ベネフィット・ハームのバランス
                      </div>
                      <p className="text-slate-700">{srCase.etd_framework.benefits_harms_summary}</p>
                    </div>
                    <div className="border border-slate-200 rounded-lg p-3">
                      <div className="text-xs font-semibold text-slate-500 mb-1 flex items-center gap-1">
                        <Users className="w-3 h-3" />患者の価値観・選好
                      </div>
                      <p className="text-slate-700">{srCase.etd_framework.values_preferences}</p>
                    </div>
                    <div className="border border-slate-200 rounded-lg p-3">
                      <div className="text-xs font-semibold text-slate-500 mb-1 flex items-center gap-1">
                        <Target className="w-3 h-3" />資源・実行可能性
                      </div>
                      <p className="text-slate-700">{srCase.etd_framework.resources_feasibility}</p>
                    </div>

                    <div className="bg-amber-50 border border-amber-300 rounded-lg p-3 text-xs text-amber-900">
                      <div className="font-semibold mb-1">💡 Core GRADE の推奨強度の原則</div>
                      <ul className="space-y-0.5 list-disc list-inside">
                        <li>High/Moderate certainty + 明確なnet benefit → <span className="font-semibold">Strong</span>可</li>
                        <li>Low/Very Low certainty → <span className="font-semibold">原則 Conditional</span>(例外あり)</li>
                        <li>Strong = ほぼ全員が同じ選択、Conditional = 多数だが相当の人は違う選択</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 lg:sticky lg:top-4">
                {phase === 'grade' && !result && (
                  <>
                    <h3 className="font-bold text-slate-900 mb-1">Phase 1: GRADE評価</h3>
                    <p className="text-xs text-slate-500 mb-4">各ドメインと最終certaintyを判断</p>

                    <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                      {DOMAINS.map((d) => {
                        const userAns = answers[d.id];
                        const Icon = d.icon;
                        return (
                          <div key={d.id} className={`border rounded-lg p-3 border-slate-200 ${activeDomain === d.id && activeTab === 'flowchart' ? 'ring-2 ring-indigo-400' : ''}`}>
                            <button
                              onClick={() => { setActiveDomain(d.id); setActiveTab('flowchart'); }}
                              className="w-full text-left mb-2 hover:text-indigo-600 transition-colors"
                            >
                              <div className="font-semibold text-sm text-slate-900 flex items-center gap-1">
                                <Icon className="w-3.5 h-3.5" />{d.nameJa}
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5">{d.desc}</div>
                              <div className="text-[10px] text-indigo-500 mt-0.5">→ タップでフロー表示</div>
                            </button>
                            <div className="grid grid-cols-3 gap-1">
                              {[
                                { id: 'no_rate_down', label: '下げない' },
                                { id: 'rate_down_1', label: '−1' },
                                { id: 'rate_down_2', label: '−2' },
                              ].map((opt) => {
                                const selected = userAns === opt.id;
                                let btnClass = 'border-slate-200 hover:border-slate-400 text-slate-600';
                                if (selected) btnClass = 'border-indigo-500 bg-indigo-50 text-indigo-700 font-semibold';
                                return (
                                  <button
                                    key={opt.id}
                                    onClick={() => setDomainAnswer(d.id, opt.id)}
                                    className={`py-1.5 px-1 rounded border-2 text-xs transition-all ${btnClass}`}
                                  >
                                    {opt.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <div className="font-semibold text-sm text-slate-900 mb-2 flex items-center gap-1">
                        <ArrowRight className="w-4 h-4" />最終 Certainty
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {CERTAINTY_LEVELS.map((level) => {
                          const selected = finalCertainty === level.id;
                          return (
                            <button
                              key={level.id}
                              onClick={() => setFinalCertainty(level.id)}
                              className={`py-2 px-2 rounded border-2 text-sm transition-all ${selected ? 'border-indigo-500 bg-indigo-50 font-semibold' : 'border-slate-200 hover:border-slate-400'}`}
                            >
                              <div className="flex items-center justify-center gap-0.5 mb-0.5">
                                {Array.from({ length: 4 }).map((_, i) => (
                                  <span key={i} className={i < level.stars ? 'text-amber-500' : 'text-slate-300'}>★</span>
                                ))}
                              </div>
                              <div className="text-xs">{level.labelJa}</div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      <button
                        onClick={getHint}
                        disabled={hintUsed || loadingHint}
                        className="w-full text-sm py-2 rounded-lg border border-amber-300 text-amber-700 hover:bg-amber-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                      >
                        <Lightbulb className="w-4 h-4" />
                        {loadingHint ? '取得中...' : hintUsed ? 'ヒント使用済 (-5pt)' : 'ヒント (-5pt)'}
                      </button>
                      <button
                        onClick={proceedToEtd}
                        disabled={!canProceed}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                      >
                        {canProceed ? <>Phase 2へ<ChevronRight className="w-4 h-4" /></> : '全ドメイン+最終判断を入力'}
                      </button>
                    </div>
                  </>
                )}

                {phase === 'etd' && !result && (
                  <>
                    <h3 className="font-bold text-slate-900 mb-1">Phase 2: 推奨決定</h3>
                    <p className="text-xs text-slate-500 mb-4">SoF表とEtDを参照して推奨の方向と強さを決定</p>

                    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-2 mb-3 text-xs">
                      <div className="font-semibold text-indigo-900">あなたのPhase 1判断:</div>
                      <div className="text-indigo-700 mt-1">
                        最終certainty: <span className="font-bold">{CERTAINTY_LEVELS.find((l) => l.id === finalCertainty)?.labelJa}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {RECOMMENDATIONS.map((rec) => {
                        const selected = recommendation === rec.id;
                        return (
                          <button
                            key={rec.id}
                            onClick={() => setRecommendation(rec.id)}
                            className={`w-full text-left p-3 rounded border-2 transition-all ${selected ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-slate-400'}`}
                          >
                            <div className="font-semibold text-sm text-slate-900">{rec.labelJa}</div>
                            <div className="text-[11px] text-slate-500 mt-0.5">{rec.label}</div>
                            <div className="text-xs text-slate-600 mt-1">{rec.desc}</div>
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-4 space-y-2">
                      <button
                        onClick={() => { setPhase('grade'); setActiveTab('paper'); }}
                        className="w-full text-sm py-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50"
                      >
                        ← Phase 1に戻る
                      </button>
                      <button
                        onClick={submitAnswer}
                        disabled={!canSubmit}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {canSubmit ? '全て回答して提出' : '推奨を選択してください'}
                      </button>
                    </div>
                  </>
                )}

                {result && (
                  <>
                    <h3 className="font-bold text-slate-900 mb-3">判定結果</h3>
                    <div className="space-y-2 mb-4">
                      <div className={`p-3 rounded-lg border ${result.domainCorrect === 5 ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                        <div className="text-xs text-slate-600">ドメイン正解</div>
                        <div className="text-2xl font-bold text-slate-900">{result.domainCorrect}/5</div>
                      </div>
                      <div className={`p-3 rounded-lg border ${result.finalCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                        <div className="text-xs text-slate-600">最終Certainty</div>
                        <div className="font-bold text-slate-900 flex items-center gap-2">
                          {result.finalCorrect ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : <XCircle className="w-5 h-5 text-red-600" />}
                          {result.finalCorrect ? '正解' : `正解: ${CERTAINTY_LEVELS.find((l) => l.id === result.correctFinal)?.labelJa}`}
                        </div>
                      </div>
                      <div className={`p-3 rounded-lg border ${result.recCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                        <div className="text-xs text-slate-600">推奨</div>
                        <div className="font-bold text-slate-900 flex items-center gap-2">
                          {result.recCorrect ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : <XCircle className="w-5 h-5 text-red-600" />}
                          {result.recCorrect ? '正解' : `正解: ${RECOMMENDATIONS.find((r) => r.id === result.correctRec)?.labelJa}`}
                        </div>
                      </div>
                      <div className="p-3 rounded-lg border bg-indigo-50 border-indigo-200 text-center">
                        <div className="text-xs text-indigo-700">獲得ポイント</div>
                        <div className="text-3xl font-bold text-indigo-600">+{result.gained}</div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {result && (
            <div className="mt-6 bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-xl font-bold text-slate-900 mb-4">詳細解説</h3>

              <div className="space-y-3 mb-6">
                <h4 className="font-semibold text-slate-900">各ドメインの判断とフローチャート経路</h4>
                {DOMAINS.map((d) => {
                  const r = result.domainResults[d.id];
                  const Icon = d.icon;
                  return (
                    <div key={d.id} className={`border rounded-xl p-4 ${r.isCorrect ? 'border-green-300 bg-green-50/50' : 'border-red-300 bg-red-50/50'}`}>
                      <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          {r.isCorrect ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : <XCircle className="w-5 h-5 text-red-600" />}
                          <Icon className="w-4 h-4 text-slate-600" />
                          <span className="font-semibold text-slate-900">{d.nameJa} <span className="text-xs text-slate-500 font-normal">({d.name})</span></span>
                        </div>
                        <div className="text-xs text-slate-600">
                          あなた: <span className="font-mono">{r.user?.replace(/_/g, ' ')}</span> / 正解: <span className="font-mono font-bold">{r.correct.replace(/_/g, ' ')}</span>
                        </div>
                      </div>
                      {r.flowchartPath && (
                        <div className="bg-white border border-slate-200 rounded-lg p-2 mb-2 text-xs text-slate-700">
                          <span className="font-semibold text-indigo-700">📊 フローチャート経路: </span>{r.flowchartPath}
                        </div>
                      )}
                      <div className="text-sm text-slate-700">
                        <span className="text-xs font-semibold text-slate-500">理由: </span>{r.rationale}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="border rounded-xl p-4 border-indigo-300 bg-indigo-50/50 mb-4">
                <div className="font-semibold text-indigo-900 mb-2 flex items-center gap-1">
                  <Activity className="w-4 h-4" />最終 Certainty of Evidence (gestalt判断)
                </div>
                <p className="text-sm text-slate-700">{srCase.final_rationale}</p>
              </div>

              <div className="border rounded-xl p-4 border-purple-300 bg-purple-50/50 mb-4">
                <div className="font-semibold text-purple-900 mb-2 flex items-center gap-1">
                  <ClipboardCheck className="w-4 h-4" />推奨 (Evidence to Recommendation)
                </div>
                <div className="text-sm text-slate-700 mb-2">
                  <span className="font-semibold">正解: </span>
                  <span className="inline-block px-2 py-0.5 rounded bg-white border border-purple-300 font-semibold">
                    {RECOMMENDATIONS.find((r) => r.id === result.correctRec)?.labelJa}
                  </span>
                </div>
                <p className="text-sm text-slate-700">{srCase.etd_framework.recommendation_rationale}</p>
              </div>

              {srCase.teaching_point && (
                <div className="mt-4 bg-amber-50 border border-amber-300 rounded-xl p-4">
                  <div className="font-semibold text-amber-900 mb-2 flex items-center gap-1">
                    <Lightbulb className="w-4 h-4" />このケースのTeaching Point
                  </div>
                  <p className="text-sm text-amber-900">{srCase.teaching_point}</p>
                </div>
              )}

              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-slate-700">
                <div className="font-semibold text-blue-900 mb-2">💡 Core GRADEの核心 (Guyatt先生より)</div>
                <p>
                  「GRADE評価は、評価者の教育を受けた思慮深い<span className="font-semibold">gestalt判断</span>を反映すべきである」。
                  個別ドメインの機械的加算ではなく、全体を俯瞰してclose callを調整。推奨段階ではさらに benefits/harms、values、resources を総合し、strong/conditionalを決めます。
                </p>
              </div>

              <div className="mt-4 flex gap-3">
                <button onClick={backToMenu} className="flex-1 py-3 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium">
                  メニューへ
                </button>
                <button
                  onClick={nextCase}
                  className="flex-1 py-3 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white font-semibold flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />次のケース
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}
