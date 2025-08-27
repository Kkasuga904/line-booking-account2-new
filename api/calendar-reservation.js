/**
 * カレンダー予約API
 * 
 * LIFF（LINE Front-end Framework）やWebフォームから
 * 予約情報を受け取り、処理するエンドポイント
 * 
 * @param {Request} req - HTTPリクエスト
 * @param {Response} res - HTTPレスポンス
 */
export default async function handler(req, res) {
  // CORS設定
  // LIFFや外部フロントエンドからのアクセスを許可
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // CORS プリフライトリクエストの処理
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // POSTメソッドのみ受け付ける（予約作成は副作用があるため）
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      allowed: ['POST']
    });
  }
  
  try {
    // リクエストボディから予約情報を取得
    const { 
      store_id,       // 店舗ID
      customer_name,  // 顧客名
      date,          // 予約日（YYYY-MM-DD形式）
      time,          // 予約時間（HH:MM:SS形式）
      people,        // 人数
      note           // 備考（アレルギー情報等）
    } = req.body;
    
    // バリデーション（本番環境では要強化）
    if (!customer_name || !date || !time) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['customer_name', 'date', 'time']
      });
    }
    
    // 予約IDの生成
    // タイムスタンプを36進数に変換して短縮
    const reservationId = 'R' + Date.now().toString(36).toUpperCase();
    
    // 予約オブジェクトの作成
    const reservation = {
      id: reservationId,
      store_id: store_id || 'restaurant-002',  // デフォルトはAccount 2
      customer_name,
      date,
      time,
      people: people || 2,                     // デフォルトは2名
      note: note || '',                        // 備考は任意
      created_at: new Date().toISOString(),    // ISO形式のタイムスタンプ
      status: 'confirmed'                      // 予約ステータス（将来の拡張用）
    };
    
    // デバッグ用ログ（本番環境では適切なロギングサービスを使用）
    console.log('New reservation created:', reservation);
    
    // TODO: ここでデータベースに保存する処理を追加
    // await saveToDatabase(reservation);
    
    // TODO: 確認メール/LINE通知を送信
    // await sendConfirmation(reservation);
    
    // 成功レスポンス
    // フロントエンドで予約IDを表示できるように、予約情報を返す
    res.status(200).json({
      success: true,
      reservation,
      message: '予約が確定しました'
    });
    
  } catch (error) {
    // エラーハンドリング
    // 本番環境ではエラーの詳細を隠蔽し、一般的なメッセージのみ返す
    console.error('Reservation error:', error);
    
    res.status(500).json({ 
      error: 'Internal server error',
      message: '予約の処理中にエラーが発生しました'
    });
  }
}