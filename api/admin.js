/**
 * 予約管理API (Account 2専用)
 * 
 * このAPIは予約情報のCRUD操作を提供します。
 * 現在はインメモリストレージを使用していますが、
 * 将来的にはデータベース（Supabase等）に置き換え可能です。
 */

// インメモリストレージ（サーバーレス環境では揮発性）
// 注意: Vercelのサーバーレス関数は状態を保持しないため、
// 本番環境ではデータベースの使用を推奨
let reservations = [];

/**
 * 管理API メインハンドラー
 * 
 * @param {Request} req - HTTPリクエスト
 * @param {Response} res - HTTPレスポンス
 */
export default async function handler(req, res) {
  // CORS設定（クロスオリジンリクエストを許可）
  // 開発環境での利便性のため全オリジンを許可しているが、
  // 本番環境では特定のドメインのみに制限することを推奨
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // CORS プリフライトリクエストの処理
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // リクエスト情報の取得
  const { method } = req;
  const url = new URL(req.url, `http://${req.headers.host}`);
  const id = url.searchParams.get('id');  // URLパラメータからIDを取得
  
  try {
    // HTTPメソッドに応じた処理を実行
    switch (method) {
      case 'GET':
        // 予約一覧の取得
        // store_id で Account 2 の予約のみをフィルタリング
        // 複数アカウント対応のための重要な処理
        res.status(200).json({ 
          success: true, 
          reservations: reservations.filter(r => r.store_id === 'restaurant-002'),
          total: reservations.filter(r => r.store_id === 'restaurant-002').length
        });
        break;
        
      case 'POST':
        // 新規予約の作成
        // 一意なIDを自動生成（タイムスタンプベース）
        const newReservation = {
          id: 'R' + Date.now().toString(36).toUpperCase(),  // 例: R1ABC2DEF
          ...req.body,                                       // リクエストボディの内容を展開
          store_id: 'restaurant-002',                        // Account 2のストアIDを固定
          created_at: new Date().toISOString()              // 作成日時を記録
        };
        reservations.push(newReservation);
        
        // 201 Created ステータスで新規作成した予約を返す
        res.status(201).json({ success: true, reservation: newReservation });
        break;
        
      case 'PUT':
        // 予約更新
        if (!id) {
          return res.status(400).json({ error: 'ID required' });
        }
        const index = reservations.findIndex(r => r.id === id);
        if (index === -1) {
          return res.status(404).json({ error: 'Reservation not found' });
        }
        reservations[index] = { ...reservations[index], ...req.body };
        res.status(200).json({ success: true, reservation: reservations[index] });
        break;
        
      case 'DELETE':
        // 予約削除
        if (!id) {
          return res.status(400).json({ error: 'ID required' });
        }
        const deleteIndex = reservations.findIndex(r => r.id === id);
        if (deleteIndex === -1) {
          return res.status(404).json({ error: 'Reservation not found' });
        }
        reservations.splice(deleteIndex, 1);
        res.status(200).json({ success: true });
        break;
        
      default:
        res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Admin API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}