# GRADE 探偵 Pro 🕵️

**Core GRADE (Guyatt et al. *BMJ* 2025) のSR評価から推奨決定までを"ゲーム感覚"で学ぶ学習アプリ**
Google Gemini API (**無料枠で動きます**) を使って、AIが毎回ランダムに臨床的に意味のあるシステマティックレビュー(SR)ケースを生成します。

- 5つのGRADEドメイン (Risk of Bias / Imprecision / Inconsistency / Indirectness / Publication bias) を判断
- Summary of Findings (SoF) 表とEvidence-to-Decision (EtD) フレームで推奨 (Strong/Conditional × FOR/AGAINST) を決定
- 正解・フローチャート経路・Teaching Pointで即座にフィードバック

---

## 📑 目次

1. [⚡ クイックスタート (3分で動かす)](#-クイックスタート-3分で動かす)
2. [🔑 APIキーとは? — 初心者向け完全ガイド](#-apiキーとは--初心者向け完全ガイド)
3. [🆓 Google AI Studio で無料APIキーを取得する](#-google-ai-studio-で無料apiキーを取得する)
4. [🗝 複数のAPIキーを作成できるのはなぜ?](#-複数のapiキーを作成できるのはなぜ)
5. [💰 無料枠でも絶対守ること + 勝手に課金されないことの確認](#-無料枠でも絶対守ること--勝手に課金されないことの確認)
6. [📊 使用量(上限)の確認方法](#-使用量上限の確認方法)
7. [🛠 トラブルシューティング](#-トラブルシューティング)
8. [🧑‍💻 開発者向け](#-開発者向け)
9. [📚 参考文献](#-参考文献)

---

## ⚡ クイックスタート (3分で動かす)

### A. ローカルで動かす場合

```bash
# 依存関係のインストール
npm install

# 開発サーバー起動
npm run dev
```

ブラウザで `http://localhost:5173` を開く。

画面右上の **「⚠ APIキーを設定してください」** → Google AI StudioのキーをコピペしてSave → メニューに戻って難易度を選び「新しいCPG・SRケースを生成」をクリック。

### B. 配布版(ビルド済み)を使う場合

[GitHub Releases](https://github.com/mxe050/GRADE-tanken/releases) または `dist/` の `index.html` をダブルクリックするだけで動きます(ブラウザオンリー、サーバー不要)。

---

## 🔑 APIキーとは? — 初心者向け完全ガイド

### ① APIキーを一言で言うと…

> **APIキー = Googleのサーバーに「このリクエストは私からです」と証明するための長い文字列 (パスワードのようなもの)**

- このアプリはブラウザから直接 Google の Gemini サーバーに「臨床ケースを作って」とお願いします
- その時「どのアカウントとしてお願いしているか」を Google に知らせる必要がある
- それが **APIキー** です
- キーを持っている人は、**あなたのGoogleアカウントの名義で** AIを呼び出せてしまうので、**絶対に他人に見せてはいけない**

### ② 「API」って何?

- **API (Application Programming Interface)** = プログラム同士の会話ルール
- ChatGPT や Gemini をブラウザで「チャット画面」から使うのが普通の使い方
- **API経由** で使うと、このアプリのように「別のアプリの中からAIを呼び出す」ことができる
- ChatGPTのSubscription (月額) と GoogleのAPI (従量課金だが無料枠あり) は**別料金体系**です

### ③ APIキーの見た目

```
AIzaSyDabc_xyz1234567890abcdefghijklmnopqrst
```
(上のは例。`AIzaSy` で始まる40文字前後のランダム文字列)

### ④ どこに保存される?

このアプリでは **あなたのブラウザ内部 (`localStorage`)** だけに保存されます。
- サーバーには送信されません
- 別のブラウザ・別の端末では、また貼り直す必要があります
- `削除` ボタンで即座に消せます

---

## 🆓 Google AI Studio で無料APIキーを取得する

### Step 1. Googleアカウントを用意

普段使っているGmailアカウントでOK。未ログインの場合は最初にログインを求められます。

### Step 2. Google AI Studio にアクセス

👉 **https://aistudio.google.com/app/apikey**

### Step 3. 「Create API key」をクリック

<details>
<summary>プロジェクトを選ぶ画面が出たら? (画像あり)</summary>

- 初めての場合は自動で「Generative Language Client」という名前のGoogle Cloudプロジェクトが作られます → そのまま「Create API key in new project」をクリック
- すでに使っているプロジェクトに紐づけたい場合は一覧から選択
</details>

### Step 4. 表示された文字列をコピー

`AIzaSy...` で始まる40文字前後の文字列が出ます。右のコピーアイコンでコピー。

### Step 5. このアプリの「APIキー設定」画面に貼り付け → 保存

「接続テスト」で `✅ 成功` と出たら完了。メニューに戻って遊べます。

---

## 🗝 複数のAPIキーを作成できるのはなぜ?

Google AI Studio の APIキーページでは `Create API key` を何度押しても新しいキーを作れます。これには理由があります。

### 🔍 仕組み

| 概念 | 役割 |
|---|---|
| **Googleアカウント** | あなた自身 (1つ) |
| **Google Cloud プロジェクト** | "財布"。無料枠・請求・使用量はここ単位で管理 |
| **APIキー** | プロジェクトに紐づく「鍵」。**1つのプロジェクトに複数作れる** |

### ✅ キーをいくつ作っても無料枠は増えない

```
[Googleアカウント]
  └── [プロジェクトA]  ← 無料枠は 1日 1500リクエスト(プロジェクト単位)
       ├── 鍵1 (このアプリ用)
       ├── 鍵2 (開発テスト用)
       └── 鍵3 (別アプリ用)
```

**全部のキーが同じ無料枠を共有します。** キー3つ作っても 3倍にはなりません。

### 💡 では何のために複数作るのか?

1. **アプリごとに使い分ける** (このアプリ用の鍵、別ツール用の鍵など)
   → どれかが漏洩したとき、**その鍵だけ削除**して他に影響を出さない
2. **古い鍵をローテーションする** (定期的に作り直して古いのは削除)
3. **チームで共有する場合** (使い回しを避ける)

### 🆚 無料枠を"本当に"増やしたい場合

新しい **プロジェクト** を作る (鍵ではない)。
- Google AI Studio の左上プロジェクトプルダウン → 「New project」
- ただし **1つのGoogleアカウントでプロジェクトを量産して無料枠を稼ぐのはGoogle利用規約違反** の恐れがあるので、個人学習目的なら1プロジェクトで十分

---

## 💰 無料枠でも絶対守ること + 勝手に課金されないことの確認

### 🚨 他人に絶対に教えない・渡さない

| やってはいけない | 代わりに |
|---|---|
| SlackやLINEでコピペして送る | 受け手に自分でAPIキーを作ってもらう |
| GitHubの公開リポジトリにコミット | `.env` に入れて `.gitignore` 追加 |
| ブログやスクショに写り込ませる | マスク (`AIzaSy...****`) で隠す |
| 友人に「ちょっと使わせて」と言われたら渡す | 「自分で5分で作れるよ」と案内 |

**漏れたら?** → Google AI Studioの鍵一覧で、その鍵の 🗑 アイコンを押して即削除。新しい鍵を作り直す。

### 💸 勝手に有料化することは"ない"

**超重要**: Gemini APIは **明示的にBilling (請求先クレジットカード) を有効化しない限り、無料枠を超えたら単にエラー (429 Quota Exceeded) が返るだけ** です。

```
無料枠の状態:
  └── 上限に達した瞬間 → エラーが返って止まる → 料金は発生しない ✅

Billing有効化後 (自分で明示的に設定):
  └── 無料枠超過分 → 従量課金 (1,000,000トークンあたり$0.XX) ⚠
```

**確認方法**:
1. https://console.cloud.google.com/billing を開く
2. 使っているプロジェクト (例: "Generative Language Client") を選択
3. 「お支払いアカウントがリンクされていません」と表示されていれば **無料枠のみ = 絶対に課金されない**
4. Billing accountが紐づいている場合は、「アラート」を 1$ などに設定して防御

### 📏 無料枠の上限 (Gemini 2.0 Flash, 2026年4月時点の代表値)

| 種類 | 目安 | 超えたら |
|---|---|---|
| 1分あたりリクエスト数 (RPM) | 15回 | 1分待てば復活 |
| 1日あたりリクエスト数 (RPD) | 1,500回 | 翌日UTC 0時まで停止 |
| 1分あたりトークン数 (TPM) | 1,000,000 | ほぼ当たらない |

※実際の値はGoogle側の方針で変動します。最新は[公式ドキュメント](https://ai.google.dev/gemini-api/docs/rate-limits) で確認を。

このアプリは 1ケース生成で約 1リクエスト (+ヒント使えば+1) なので、**1日に1,500ケース** 遊んでも大丈夫。

---

## 📊 使用量(上限)の確認方法

### 方法1. Google AI Studio の上部メーター (最速)

1. https://aistudio.google.com/ を開く
2. 右上のプロフィールアイコン隣に使用量の簡易表示があることがある (モデルによる)

### 方法2. Google Cloud Console のメトリクス (詳細)

1. https://console.cloud.google.com/apis/dashboard
2. プロジェクトを選択 (例: "Generative Language Client")
3. 左メニュー「API とサービス」→「ダッシュボード」
4. `Generative Language API` を選択
5. 「概要」タブで以下が見られます:
   - 📈 **Traffic** (直近60分 / 24時間 のリクエスト数グラフ)
   - 📉 **Errors** (どれぐらい失敗したか)
   - ⏱ **Latency** (応答時間)
6. 「Quotas & System Limits」タブで残量と上限を確認

### 方法3. Billing (課金) ページ ※Billing有効化している人のみ

1. https://console.cloud.google.com/billing
2. 当月の従量料金が表示される
3. **予算アラートを必ず設定** (例: $1 に達したらメール通知)

---

## 🛠 トラブルシューティング

### 🔴 シナリオ(SRケース)が生成されない / ずっとローディング

症状別に対処法を示します:

#### ① 「APIキーが無効です」と表示される
- [ ] キーを貼り付けるときに **前後の空白やタブ文字** を巻き込んでいないか確認
- [ ] `AIzaSy` で始まる40文字前後か確認 (短すぎる/長すぎるは別物)
- [ ] Google AI Studioで該当の鍵が **「Active」** になっているか (Deleted になってたら新しく作る)
- [ ] プロジェクトに **Generative Language API が有効化** されているか ([ここから有効化](https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com))

#### ② 「無料枠の上限に達しました」(429 / Quota Exceeded)
- [ ] 1分あたり15回の制限に当たった → 1〜2分待つ
- [ ] 1日1,500回の制限に当たった → **UTC 0時 = 日本時間 朝9時** まで待つ
- [ ] 別のGoogleアカウントで新プロジェクトを作り、別キーに差し替える
- [ ] モデルを `gemini-2.0-flash-lite` に変更 (より大きな無料枠がある場合あり)

#### ③ 「ネットワークエラー」
- [ ] インターネット接続を確認
- [ ] 会社/学校のネットワーク → ファイアウォールで `generativelanguage.googleapis.com` がブロックされている可能性 → 自宅のWi-Fiなどで試す
- [ ] VPNを使っている → オフにして試す
- [ ] ブラウザの拡張機能 (広告ブロッカー等) → 無効化して再試行

#### ④ 「モデルが見つかりません」
- 選択中のモデルが廃止された可能性 → APIキー設定画面で `gemini-2.0-flash` に戻す

#### ⑤ 「ケース生成に失敗: JSONパース不能」 (3回連続で失敗)
- AIの応答が崩れる、または途中で切れている
- [ ] モデルを `gemini-2.5-flash` に変更 (より安定)
- [ ] 難易度を **初級** に下げて試す
- [ ] 何回か繰り返す (AIの揺らぎのことがある)
- [ ] ブラウザのキャッシュをクリアして再読み込み (Ctrl+Shift+R)

#### ⑥ 「Geminiの安全フィルタでブロックされました」
- 稀に医学的な記述 (死亡率・薬剤副作用など) が引っかかる
- [ ] 難易度を変えて再試行
- [ ] もう一度「新しいケースを生成」を押す

#### ⑦ ヒントだけ動かない
- シナリオ生成は通っているのにヒントが失敗 → 大抵は一時的なレート制限
- [ ] 1分待って再試行

### 🟠 画面が崩れる / ボタンが反応しない

- [ ] ブラウザのコンソール (F12 → Console) を開いてエラーを確認
- [ ] 最新のChrome / Edge / Firefox で試す (Internet Explorer非対応)
- [ ] モバイルで使いにくい → PCまたはタブレット横向き推奨 (3カラムUI)

### 🟡 スコアが保存されない

- ゲームを閉じると消えます (セッション限り)。意図的に "気楽に遊ぶ" 設計です。

---

## 🧑‍💻 開発者向け

### スタック

- [Vite](https://vitejs.dev/) + React 18 + TypeScript
- [Tailwind CSS](https://tailwindcss.com/) (ユーティリティCSS)
- [lucide-react](https://lucide.dev/) (アイコン)
- [@google/generative-ai](https://www.npmjs.com/package/@google/generative-ai) 公式SDK

### ディレクトリ

```
GRADE-tanken/
├─ src/
│   ├─ App.tsx                    ルーティング
│   ├─ main.tsx                   エントリ
│   ├─ index.css                  Tailwind
│   ├─ components/
│   │   ├─ BiasDetective.tsx      ゲーム本体
│   │   └─ ApiKeySetup.tsx        APIキー管理
│   └─ lib/
│       └─ gemini.ts              Gemini APIラッパー
├─ index.html
├─ package.json
├─ vite.config.ts
├─ tsconfig.json
├─ tailwind.config.js
└─ postcss.config.js
```

### ビルド

```bash
npm install
npm run build       # dist/ に静的ファイル出力
npm run preview     # 確認サーバー
```

`dist/` の中身をそのまま GitHub Pages / Netlify / Vercel / Cloudflare Pages に置けば動きます。

### APIキーのセキュリティに関する注意

このアプリは **クライアントサイドでAPIキーを使う** 設計です。本格的なプロダクション配信で **他人にも使わせる** 場合は、キーが盗まれる可能性があるので:

1. **自分専用のまま個人利用にとどめる** (推奨: 最も安全)
2. もしくはバックエンドAPIを立てて、キーをサーバー側に隠す

---

## 📚 参考文献

- **Core GRADE (BMJ 2025 シリーズ)** — Guyatt GH et al.
  - Part 1: [Overview](https://www.bmj.com/content/389/bmj-2024-083858)
  - Part 2: Imprecision
  - Part 3: Inconsistency
  - Part 4: [Risk of bias](https://www.bmj.com/content/389/bmj-2024-083864)
  - Part 5: Indirectness
  - Part 6: Summary of Findings
  - Part 7: Evidence to Decision
- **ROBUST-RCT** (Risk Of Bias instrument for Use in SysTematic reviews - for Randomised Controlled Trials)
- [GRADEpro Handbook (日本語)](https://book.gradepro.org/)

### 本アプリで学べること

| タブ/機能 | 対応する Core GRADE 概念 |
|---|---|
| SR論文タブ(CI図含) | Imprecision (MID / Null / OIS), 試験特性 → RoB |
| SoF表タブ | 複数アウトカムのcertainty統合 (Part 6) |
| フローチャートタブ | 各ドメインの判断アルゴリズム (Part 2-5の Fig.) |
| EtDタブ | Benefits-harms / Values / Resources → 推奨決定 (Part 7) |
| 最終certaintyボタン | **Gestalt判断** (ドメインの機械加算ではない) |
| 推奨の強度 | High/Moderate → Strong可、Low/Very Low → 原則Conditional |

---

## 📝 ライセンス

MIT License — 学習・臨床現場の勉強会・医学教育での利用を歓迎します。

## 🙏 謝辞

- **Gordon Guyatt先生** と Core GRADE BMJ series 2025 の著者陣
- 日本語CoreGRADEハンドブック執筆・翻訳に関わった皆様
- Google AI Studio / Gemini チーム

---

**Issue / 改善提案は GitHub へ** 👉 https://github.com/mxe050/GRADE-tanken/issues
