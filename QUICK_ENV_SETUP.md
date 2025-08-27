# 🚀 Account 2 クイック環境変数設定

## ⚡ 今すぐ設定が必要な環境変数

### 1️⃣ Vercelダッシュボードを開く
https://vercel.com/tatatas-projects-a26fbad6/line-booking-account2-new/settings/environment-variables

### 2️⃣ LINE_CHANNEL_ACCESS_TOKEN を追加

1. 「Add New」をクリック
2. 以下を入力:
   ```
   Key: LINE_CHANNEL_ACCESS_TOKEN
   Value: [Account 2のChannel Access Token]
   ```
3. Environment: すべてチェック ✅
4. 「Save」をクリック

### 3️⃣ トークンの取得方法

**もし手元にない場合:**
1. https://developers.line.biz/ を開く
2. Account 2のチャネルを選択
3. 「Messaging API」タブ
4. 「Channel access token」セクション
5. 「Issue」をクリック

### 4️⃣ 動作確認

LINEアプリでAccount 2に「予約」と送信
→ 予約URLが返ってくればOK！

## ❗ トラブルシューティング

**返信が来ない場合:**
1. Vercel Functionsログを確認:
   https://vercel.com/tatatas-projects-a26fbad6/line-booking-account2-new/functions

2. LINE Developersで確認:
   - Webhook URL: `https://line-booking-account2-new.vercel.app/webhook`
   - Webhook: **ON**
   - 応答メッセージ: **OFF**

**それでもダメな場合:**
Vercelで再デプロイ:
1. Deploymentsタブ
2. 最新のデプロイの「...」メニュー
3. 「Redeploy」をクリック