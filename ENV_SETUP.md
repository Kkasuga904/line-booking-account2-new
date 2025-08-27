# Account 2 環境変数設定ガイド

## 必要な環境変数

### 1. LINE_CHANNEL_ACCESS_TOKEN
**取得方法:**
1. [LINE Developers Console](https://developers.line.biz/)にログイン
2. Account 2用のチャネルを選択
3. Messaging API → Channel access token
4. 「Issue」をクリックしてトークン生成

### 2. LIFF_ID (オプション)
**取得方法:**
1. LINE Developers Consoleで「LIFF」タブを選択
2. 「追加」をクリック
3. 以下を設定:
   - LIFF app name: `Account2予約`
   - Size: `Full`
   - Endpoint URL: `https://line-booking-account2-new.vercel.app/liff-calendar`
   - Scope: `profile`, `openid`
4. 作成後、LIFF IDをコピー

## Vercelでの設定手順

1. [Vercelダッシュボード](https://vercel.com/tatatas-projects-a26fbad6/line-booking-account2-new)を開く

2. **Settings** → **Environment Variables**

3. 以下を追加:
   ```
   Key: LINE_CHANNEL_ACCESS_TOKEN
   Value: [取得したトークン]
   Environment: ✅ Production ✅ Preview ✅ Development
   ```

4. LIFF IDも同様に追加:
   ```
   Key: LIFF_ID
   Value: [取得したLIFF ID]
   Environment: ✅ Production ✅ Preview ✅ Development
   ```

5. **Save**をクリック

## 動作確認

### 1. Webhook確認
LINE Developersコンソールで「Verify」をクリック
→ 「Success」と表示されればOK

### 2. メッセージ返信確認
LINEアプリでAccount 2を友だち追加
→ 「予約」と送信
→ 予約リンクが返ってくることを確認

### 3. LIFF確認
返信されたLIFF URLをタップ
→ 予約カレンダーが表示されることを確認

## トラブルシューティング

### 「token_not_configured」エラー
→ LINE_CHANNEL_ACCESS_TOKENが設定されていません

### LIFFが開かない
→ LIFF_IDが正しく設定されているか確認
→ LIFF URLのEndpointが正しいか確認

### 返信が来ない
→ Webhook URLが正しく設定されているか確認
→ Webhook: ONになっているか確認
→ 応答メッセージ: OFFになっているか確認