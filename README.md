# DAIMARUYU INBOUND BOARD

大丸有エリア インバウンド購買データダッシュボード（単一HTML・ID/PW認証・AES-256-GCM暗号化・GitHub Pages公開）。

- 公開URL: https://ketrketr2.github.io/daimaruyu-inbound-board/
- 6タブ構成: KPI月次 / 国別 / 施設・店舗 / 買い回り / リピート・定着 / 滞在・単価
- データ: 実サンプル1ヶ月分（2026年5月・実数）＋シード固定の生成ダミー。全ウィジェットに「実データ 2026-05」「ダミー」「実データ×ダミー配分」バッジを表示。
- 本リポジトリには **暗号化済み index.html のみ** を置く（平文 `body.html` はローカル管理。公開リポジトリに平文データを置かないこと）。

## 認証の仕組み

- 本体HTML＋データJSON＋初期化JSを gzip → **AES-256-GCM** で暗号化し、base64で `index.html` に埋め込み。
- 鍵導出: `PBKDF2-HMAC-SHA256`・**310,000回**・salt 16byte（ビルドごとに乱数）。パスフレーズは `ID + ":" + PASSWORD`。
- 復号はブラウザの WebCrypto（`crypto.subtle`）。HTMLソースを見ても平文・データは存在しない。
- リロードすると再認証（セッション保存はしない設計）。

## ID/PW の変更手順

1. ローカルに `body.html`（平文本体）と `build_encrypt.mjs` を置く
2. 新しいID/PWでビルド:
   ```bash
   node build_encrypt.mjs 新ID 新パスワード
   ```
3. 生成された `index.html` をリポジトリにコミット（Pagesに数十秒〜2分で反映）

※ ローカル動作確認用にChart.jsを埋め込む場合: `node build_encrypt.mjs ID PW --inline-chartjs ./chart.umd.js`

## データ差し替え手順（本データ受領後）

1. `body.html` 冒頭の `<script>` 内 **`const DATA = {...}`** を受領データで更新
   - `total` / `kubun` / `brand` / `kuni` / `shisetsu`: 月次実数（配列は `[名称, 件数, 利用人数, 取扱高円]`）
   - `cont` / `pairsReal` / `repeat` / `freq` / `interval` / `range` / `days` / `facDist`: ID代替集計10本
2. 複数月受領後は、ダミー生成ブロック（`monthly` / `daily` / `kuniMonthly` / `heat`）を実データ配列への置き換えに変更
3. 差し替えた月のウィジェットのバッジを `ダミー` → `実データ YYYY-MM` に更新
4. `node build_encrypt.mjs ID PW` → `index.html` をコミット

## 技術構成

- Chart.js v4（CDN）／ BIZ UDGothic（Google Fonts）／ 素のJS（フレームワーク・localStorage不使用）
- デザイントークン: 背景 `#0F1B2E`・パネル `#16263D`・アクセント `#00C2FF`・系列6色
