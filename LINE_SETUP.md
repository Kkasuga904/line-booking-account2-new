# LINE Webhook設定確認手順

## 現在の状態
- Webhook URL: `https://line-booking-account2-new.vercel.app/webhook`
- ステータス: ✅ 200 OK を返している

## LINE Developersで確認すべき項目

### 1. Webhook URL
- 正確なURL: `https://line-booking-account2-new.vercel.app/webhook`
- 末尾にスラッシュ(/)を付けない

### 2. Webhook設定
- Webhook: **ON**
- 応答メッセージ: **OFF** (重要)
- あいさつメッセージ: **OFF**

### 3. 環境変数の設定（Vercelダッシュボード）
1. https://vercel.com/tatatas-projects-a26fbad6/line-booking-account2-new
2. Settings → Environment Variables
3. 追加:
   - Key: `LINE_CHANNEL_ACCESS_TOKEN`
   - Value: (LINE Developersから取得したChannel Access Token)
   - Environment: Production, Preview, Development すべて選択

### 4. テスト方法
1. LINE Developersでwebhook URLの「検証」ボタンを押す
2. 「成功」と表示されることを確認
3. LINEアプリで友だち追加してメッセージを送信
4. 「予約システムAccount2からの返信です」と返ってくることを確認

## トラブルシューティング
- 404エラーが表示される場合でも、実際にはwebhookは正常に動作している可能性があります
- Vercelのログで確認: https://vercel.com/tatatas-projects-a26fbad6/line-booking-account2-new/functions