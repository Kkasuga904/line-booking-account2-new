export default async function handler(req, res) {
  // CORS設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { store_id, customer_name, date, time, people, note } = req.body;
    
    // 簡易的な予約ID生成
    const reservationId = 'R' + Date.now().toString(36).toUpperCase();
    
    const reservation = {
      id: reservationId,
      store_id: store_id || 'restaurant-002',
      customer_name,
      date,
      time,
      people: people || 2,
      note: note || '',
      created_at: new Date().toISOString()
    };
    
    console.log('New reservation:', reservation);
    
    // 成功レスポンス
    res.status(200).json({
      success: true,
      reservation
    });
    
  } catch (error) {
    console.error('Reservation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}