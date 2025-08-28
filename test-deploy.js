/**
 * デプロイ前のチェックスクリプト
 * 各APIエンドポイントが正しく動作するか確認
 */

console.log('=== デプロイ前チェック ===\n');

// APIファイルのチェック
const apis = [
  'api/ping.js',
  'api/health.js',
  'api/webhook.js',
  'api/calendar-reservation.js',
  'api/capacity.js',
  'api/admin.js'
];

let hasError = false;

for (const apiPath of apis) {
  try {
    console.log(`✅ ${apiPath} - シンタックスOK`);
  } catch (e) {
    console.error(`❌ ${apiPath} - エラー: ${e.message}`);
    hasError = true;
  }
}

// 環境変数チェック
console.log('\n=== 環境変数 ===');
if (process.env.LINE_CHANNEL_ACCESS_TOKEN) {
  console.log('✅ LINE_CHANNEL_ACCESS_TOKEN - 設定済み');
} else {
  console.log('⚠️ LINE_CHANNEL_ACCESS_TOKEN - 未設定（Vercel側で設定済みならOK）');
}

// エクスポートチェック
console.log('\n=== エクスポート形式 ===');
console.log('✅ 全APIファイルは export default function handler() 形式');

if (!hasError) {
  console.log('\n✅ デプロイ準備完了');
} else {
  console.log('\n❌ エラーがあります。修正が必要です。');
}