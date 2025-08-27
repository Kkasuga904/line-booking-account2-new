/**
 * ヘルスチェックAPI
 * 
 * システムの稼働状態と設定を確認するためのエンドポイント
 * 監視ツールやデバッグで使用
 */
export default function handler(req, res) {
  // 環境変数の設定状態を確認（値は隠蔽）
  const envStatus = {
    hasLineToken: !!process.env.LINE_CHANNEL_ACCESS_TOKEN,
    hasLineSecret: !!process.env.LINE_CHANNEL_SECRET,
    hasLiffId: !!process.env.LIFF_ID,
    hasDatabaseUrl: !!process.env.DATABASE_URL
  };
  
  // Vercel環境情報
  const vercelInfo = {
    env: process.env.VERCEL_ENV || 'development',    // production/preview/development
    region: process.env.VERCEL_REGION || 'unknown',  // デプロイリージョン
    url: process.env.VERCEL_URL || 'localhost'       // デプロイURL
  };
  
  // メモリ使用状況（Node.jsランタイム）
  const memoryUsage = process.memoryUsage();
  const memoryInfo = {
    heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
    heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
    rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`
  };
  
  // レスポンスの構築
  const healthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),  // プロセスの稼働時間（秒）
    
    // APIエンドポイントの状態
    endpoints: {
      ping: 'available',
      webhook: 'available',
      admin: 'available',
      calendar: 'available'
    },
    
    // 環境変数の設定状態
    configuration: envStatus,
    
    // Vercel環境情報
    environment: vercelInfo,
    
    // システムリソース
    resources: memoryInfo,
    
    // バージョン情報
    version: {
      node: process.version,
      project: '1.0.0'
    }
  };
  
  // 200 OK で健全性情報を返す
  res.status(200).json(healthStatus);
}