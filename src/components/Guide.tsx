import { ArrowLeft, Key, ShieldAlert, ExternalLink, AlertCircle, BarChart3, Lightbulb } from 'lucide-react';

interface Props {
  onClose: () => void;
}

export default function Guide({ onClose }: Props) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={onClose}
          className="text-slate-300 hover:text-white text-sm flex items-center gap-1 mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> メニューへ戻る
        </button>

        <h1 className="text-3xl font-bold text-white mb-2">使い方ガイド</h1>
        <p className="text-slate-400 text-sm mb-6">APIキーとは何か、取得方法、無料枠の仕組み、上限確認、トラブル対処までを初心者向けに解説します。</p>

        <nav className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 mb-6 text-sm">
          <div className="text-slate-300 font-semibold mb-2">目次</div>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-1 text-indigo-300">
            <li><a href="#what" className="hover:text-indigo-200">① APIキーとは?</a></li>
            <li><a href="#get" className="hover:text-indigo-200">② 無料APIキーの取得手順</a></li>
            <li><a href="#multi" className="hover:text-indigo-200">③ 複数のキーが作れるのはなぜ?</a></li>
            <li><a href="#safe" className="hover:text-indigo-200">④ 無料枠で絶対守ること</a></li>
            <li><a href="#quota" className="hover:text-indigo-200">⑤ 使用量・上限の確認</a></li>
            <li><a href="#trouble" className="hover:text-indigo-200">⑥ トラブル対処</a></li>
          </ul>
        </nav>

        <section id="what" className="bg-slate-800/40 border border-slate-700 rounded-2xl p-6 mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-3">
            <Key className="w-5 h-5 text-indigo-400" /> ① APIキーとは?
          </h2>
          <div className="text-slate-300 text-sm space-y-3 leading-relaxed">
            <p className="bg-indigo-900/30 border-l-4 border-indigo-400 p-3 rounded">
              <span className="font-bold text-indigo-200">一言で:</span> APIキー = Googleのサーバーに「このリクエストは私からです」と証明するための長い文字列 (パスワード相当)
            </p>
            <p>このアプリはブラウザから直接 Google の Gemini サーバーに「臨床ケースを作って」と送信します。その時「誰として送っているか」を Google に知らせる必要があります。それが <span className="text-indigo-300 font-mono">AIzaSy...</span> で始まる40文字前後のAPIキーです。</p>
            <p><span className="font-semibold text-white">APIとは:</span> Application Programming Interface の略で、プログラム同士の会話ルール。ChatGPTやGeminiを「チャット画面」から使うのが普通の使い方、<span className="text-indigo-300">API経由</span>で使うとこのアプリのように「別のアプリの中からAIを呼び出せる」ようになります。</p>
            <p className="text-xs bg-slate-900/60 border border-slate-700 p-3 rounded"><span className="font-semibold text-white">保存場所:</span> キーはあなたのブラウザ内(localStorage)にだけ保存されます。サーバーには送信されません。別ブラウザや別端末では貼り直しが必要です。</p>
          </div>
        </section>

        <section id="get" className="bg-slate-800/40 border border-slate-700 rounded-2xl p-6 mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-3">
            🆓 ② Google AI Studioで無料APIキーを取得する
          </h2>
          <ol className="text-slate-300 text-sm space-y-3 list-decimal list-inside leading-relaxed">
            <li><span className="font-semibold text-white">Googleアカウントを用意</span> — 普段のGmailでOK</li>
            <li>
              <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer"
                className="text-indigo-300 hover:text-indigo-200 inline-flex items-center gap-1 font-semibold">
                Google AI Studio のAPIキーページ <ExternalLink className="w-3 h-3" />
              </a>
              にアクセス
            </li>
            <li><span className="font-semibold text-white">「Create API key」</span> ボタンをクリック</li>
            <li>プロジェクト選択画面が出たら「Create API key in new project」を選択(既存プロジェクトもOK)</li>
            <li>表示された <span className="font-mono text-indigo-300">AIzaSy...</span> の文字列を右のアイコンでコピー</li>
            <li>このアプリの <span className="font-semibold text-white">「APIキー設定」</span> 画面に貼り付けて保存</li>
            <li>「接続テスト」で <span className="text-emerald-400">✅ 成功</span> と出れば完了</li>
          </ol>
        </section>

        <section id="multi" className="bg-slate-800/40 border border-slate-700 rounded-2xl p-6 mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-3">
            🗝 ③ APIキーがいくつも作れるのはなぜ?
          </h2>
          <div className="text-slate-300 text-sm space-y-3 leading-relaxed">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-slate-700">
                <tbody>
                  <tr className="border-b border-slate-700">
                    <td className="p-3 bg-slate-900/60 font-semibold text-white w-1/3">Googleアカウント</td>
                    <td className="p-3">あなた自身 (1つ)</td>
                  </tr>
                  <tr className="border-b border-slate-700">
                    <td className="p-3 bg-slate-900/60 font-semibold text-white">Google Cloud プロジェクト</td>
                    <td className="p-3">"財布"。無料枠・請求・使用量はここ単位で管理</td>
                  </tr>
                  <tr>
                    <td className="p-3 bg-slate-900/60 font-semibold text-white">APIキー</td>
                    <td className="p-3">プロジェクトに紐づく「鍵」。<span className="text-indigo-300">1つのプロジェクトに複数作れる</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-3">
              <p className="text-red-200 font-semibold mb-1">⚠ キーを増やしても無料枠は増えません</p>
              <p className="text-red-100/80 text-xs">同じプロジェクト内のキーは全て同じ無料枠を共有します。3つ作っても上限は3倍になりません。</p>
            </div>
            <p><span className="font-semibold text-white">では何のため?</span></p>
            <ul className="list-disc list-inside space-y-1 text-xs ml-2">
              <li>アプリごとに使い分ける → どれかが漏洩したとき、その鍵だけ削除できる</li>
              <li>古い鍵を定期的にローテーションする</li>
              <li>チームで共有を避けたいときに個人ごとに分ける</li>
            </ul>
            <p className="text-xs">無料枠を本当に増やしたい時だけ、<span className="text-indigo-300">新しいプロジェクト</span>を作成します(ただし規約の範囲内で)。</p>
          </div>
        </section>

        <section id="safe" className="bg-amber-900/20 border border-amber-700/50 rounded-2xl p-6 mb-4">
          <h2 className="text-xl font-bold text-amber-200 flex items-center gap-2 mb-3">
            <ShieldAlert className="w-5 h-5" /> ④ 無料枠で絶対守ること
          </h2>

          <div className="space-y-4 text-sm">
            <div>
              <p className="font-semibold text-amber-100 mb-2">🚨 他人に絶対に教えない・渡さない</p>
              <ul className="list-disc list-inside space-y-1 text-amber-50/90 text-xs">
                <li>SlackやLINEでコピペして送らない → 受け手に自分で作ってもらう</li>
                <li>GitHub公開リポジトリにコミットしない → <span className="font-mono">.env</span>に入れて<span className="font-mono">.gitignore</span>追加</li>
                <li>ブログやスクショに写り込ませない</li>
                <li>漏れたら Google AI Studio の鍵一覧から🗑で即削除、作り直す</li>
              </ul>
            </div>

            <div className="bg-emerald-900/30 border border-emerald-700/50 rounded-lg p-3">
              <p className="font-bold text-emerald-200 mb-1">💸 勝手に有料化することは"ありません"</p>
              <p className="text-emerald-100/90 text-xs leading-relaxed">
                Gemini APIは、<span className="font-semibold">あなたが明示的にBilling(請求先クレジットカード)を有効化しない限り</span>、
                無料枠を超えたら単にエラー(429)が返るだけで料金は発生しません。
              </p>
              <p className="text-emerald-100/80 text-xs mt-2 leading-relaxed">
                <span className="font-semibold">確認方法:</span> <a href="https://console.cloud.google.com/billing" target="_blank" rel="noopener" className="text-emerald-300 underline">Google Cloud Billing</a>を開き、
                プロジェクトに「お支払いアカウントがリンクされていません」と表示されていれば、絶対に課金されません。
              </p>
            </div>
          </div>
        </section>

        <section id="quota" className="bg-slate-800/40 border border-slate-700 rounded-2xl p-6 mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-3">
            <BarChart3 className="w-5 h-5 text-indigo-400" /> ⑤ 使用量・上限の確認方法
          </h2>

          <div className="text-slate-300 text-sm space-y-4">
            <div>
              <p className="font-semibold text-white mb-1">Gemini 2.0 Flash の無料枠 (目安)</p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border border-slate-700">
                  <thead>
                    <tr className="bg-slate-900/60">
                      <th className="p-2 text-left border-b border-slate-700">項目</th>
                      <th className="p-2 text-left border-b border-slate-700">目安</th>
                      <th className="p-2 text-left border-b border-slate-700">超えたら</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-700"><td className="p-2">1分あたりリクエスト(RPM)</td><td className="p-2">15回</td><td className="p-2">1〜2分待てば復活</td></tr>
                    <tr className="border-b border-slate-700"><td className="p-2">1日あたりリクエスト(RPD)</td><td className="p-2">1,500回</td><td className="p-2">翌日UTC 0時(日本時間朝9時)まで停止</td></tr>
                    <tr><td className="p-2">1分あたりトークン(TPM)</td><td className="p-2">1,000,000</td><td className="p-2">ほぼ当たらない</td></tr>
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-slate-500 mt-2">このアプリは1ケース生成で約1リクエスト。1日1,500ケースまで余裕で遊べます。<br/>実際の上限値は<a href="https://ai.google.dev/gemini-api/docs/rate-limits" target="_blank" rel="noopener" className="text-indigo-300 underline">公式ドキュメント</a>で最新をご確認ください。</p>
            </div>

            <div>
              <p className="font-semibold text-white mb-1">💡 実際の使用量を確認する方法</p>
              <ol className="list-decimal list-inside space-y-2 text-xs">
                <li>
                  <a href="https://console.cloud.google.com/apis/dashboard" target="_blank" rel="noopener" className="text-indigo-300 underline">Google Cloud Console の APIダッシュボード</a>にアクセス
                </li>
                <li>プロジェクトを選択(例: "Generative Language Client")</li>
                <li><span className="font-semibold">「API とサービス」→「ダッシュボード」</span>→ <span className="font-mono text-indigo-300">Generative Language API</span>をクリック</li>
                <li>
                  <span className="font-semibold">概要タブ</span>でグラフ確認:
                  <ul className="list-disc list-inside ml-5 mt-1 text-[11px]">
                    <li>📈 Traffic (直近60分/24時間のリクエスト数)</li>
                    <li>📉 Errors (失敗率)</li>
                    <li>⏱ Latency (応答時間)</li>
                  </ul>
                </li>
                <li><span className="font-semibold">「Quotas &amp; System Limits」タブ</span>で残量/上限確認</li>
              </ol>
            </div>
          </div>
        </section>

        <section id="trouble" className="bg-slate-800/40 border border-slate-700 rounded-2xl p-6 mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-3">
            <AlertCircle className="w-5 h-5 text-red-400" /> ⑥ トラブル対処
          </h2>

          <div className="text-slate-300 text-sm space-y-4">
            <details className="bg-slate-900/60 rounded-lg border border-slate-700" open>
              <summary className="cursor-pointer p-3 font-semibold text-white hover:bg-slate-900/80 rounded-lg">
                🔴「接続エラー」または「シナリオ生成失敗」(2回目以降)
              </summary>
              <div className="p-4 pt-0 text-xs space-y-2">
                <p className="text-amber-200 font-semibold">最も多い原因: 短時間の連投で <span className="font-mono">レート制限(RPM)</span> に触れているか、一時的なGoogle側の遅延</p>
                <ul className="list-disc list-inside space-y-1">
                  <li><span className="font-semibold">1〜2分待ってから「次のケース」</span>を押す(アプリは自動で2回リトライしますが、それでもダメな場合)</li>
                  <li>ブラウザの広告ブロッカー/プライバシー拡張機能を<span className="font-semibold">一時OFF</span>にして再試行</li>
                  <li>モバイル通信や VPN 経由だと不安定になることあり → 自宅Wi-Fiで試す</li>
                  <li>会社/学校のネットワークだと <span className="font-mono">generativelanguage.googleapis.com</span> がブロックされている可能性 → 外部Wi-Fiで試す</li>
                  <li>ブラウザのキャッシュをクリアして再読み込み (<span className="font-mono">Ctrl+Shift+R</span>)</li>
                </ul>
              </div>
            </details>

            <details className="bg-slate-900/60 rounded-lg border border-slate-700">
              <summary className="cursor-pointer p-3 font-semibold text-white hover:bg-slate-900/80 rounded-lg">
                🟠「APIキーが無効」と出る
              </summary>
              <div className="p-4 pt-0 text-xs space-y-2">
                <ul className="list-disc list-inside space-y-1">
                  <li>前後に空白やタブ文字を巻き込んでいないか確認(再コピペ)</li>
                  <li><span className="font-mono text-indigo-300">AIzaSy</span> で始まる40文字前後か確認</li>
                  <li>Google AI Studio で鍵が <span className="font-semibold">Active</span> になっているか(Deletedなら作り直す)</li>
                  <li>
                    プロジェクトに <a href="https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com" target="_blank" rel="noopener" className="text-indigo-300 underline">Generative Language API</a> が有効化されているか
                  </li>
                </ul>
              </div>
            </details>

            <details className="bg-slate-900/60 rounded-lg border border-slate-700">
              <summary className="cursor-pointer p-3 font-semibold text-white hover:bg-slate-900/80 rounded-lg">
                🟡「無料枠上限」「Rate limit」と出るが無料枠は残っているはず
              </summary>
              <div className="p-4 pt-0 text-xs space-y-2">
                <p className="text-amber-200">
                  このエラーは <span className="font-semibold">1分あたりのRPM制限</span>
                  (Flash=5回 / Flash-Lite=10回)または
                  <span className="font-semibold">1日20リクエストのRPD制限</span>のどちらかです。
                </p>
                <ul className="list-disc list-inside space-y-1">
                  <li>まず<span className="font-semibold">1〜2分待って</span>から再試行 → RPM制限ならこれで直る</li>
                  <li>連続で出る場合は1日20回の上限に到達した可能性 → 翌日UTC 0時(日本時間朝9時)を待つか、別プロジェクトのキーに切替</li>
                  <li>モデルを <span className="font-mono">gemini-2.5-flash-lite</span> に変える(RPMがFlashの2倍で余裕あり)</li>
                </ul>
              </div>
            </details>

            <details className="bg-slate-900/60 rounded-lg border border-slate-700">
              <summary className="cursor-pointer p-3 font-semibold text-white hover:bg-slate-900/80 rounded-lg">
                🟠「JSONパース不能」「ケース生成に失敗」(3回連続失敗)
              </summary>
              <div className="p-4 pt-0 text-xs space-y-2">
                <ul className="list-disc list-inside space-y-1">
                  <li>APIキー設定画面でモデルを <span className="font-mono">gemini-2.5-flash</span> に変更(より安定)</li>
                  <li>難易度を「初級」に下げて試す</li>
                  <li>何回か繰り返す(モデル出力の揺らぎ)</li>
                </ul>
              </div>
            </details>

            <details className="bg-slate-900/60 rounded-lg border border-slate-700">
              <summary className="cursor-pointer p-3 font-semibold text-white hover:bg-slate-900/80 rounded-lg">
                🟡 「Geminiの安全フィルタでブロック」
              </summary>
              <div className="p-4 pt-0 text-xs space-y-2">
                <ul className="list-disc list-inside space-y-1">
                  <li>医学用語(死亡率・副作用等)が稀に誤検出される</li>
                  <li>もう一度「新しいケースを生成」を押すだけで通ることが多い</li>
                </ul>
              </div>
            </details>
          </div>
        </section>

        <section className="bg-indigo-900/20 border border-indigo-700/50 rounded-2xl p-6 mb-4">
          <h2 className="text-xl font-bold text-indigo-200 flex items-center gap-2 mb-3">
            <Lightbulb className="w-5 h-5" /> 最後に
          </h2>
          <p className="text-indigo-100/90 text-sm leading-relaxed">
            このアプリはCore GRADE (Guyatt et al. BMJ 2025) の学習を目的とした教育ツールです。
            生成される臨床ケースはAIが創作した<span className="font-semibold">架空のもの</span>であり、
            実際の診療判断に使う目的ではありません。評価フローと推奨判断の練習にご活用ください。
          </p>
          <p className="text-xs text-indigo-200/70 mt-3">
            問題・改善提案は <a href="https://github.com/mxe050/GRADE-tanken/issues" target="_blank" rel="noopener" className="text-indigo-300 underline">GitHub Issues</a>へ。
          </p>
        </section>

        <div className="text-center mt-8">
          <button
            onClick={onClose}
            className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white font-semibold py-3 px-8 rounded-xl"
          >
            メニューへ戻る
          </button>
        </div>
      </div>
    </div>
  );
}
