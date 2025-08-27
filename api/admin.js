// In-memory storage for Account 2
let reservations = [];

export default async function handler(req, res) {
  // CORS設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  const { method } = req;
  const url = new URL(req.url, `http://${req.headers.host}`);
  const id = url.searchParams.get('id');
  
  try {
    switch (method) {
      case 'GET':
        // 予約一覧取得
        res.status(200).json({ 
          success: true, 
          reservations: reservations.filter(r => r.store_id === 'restaurant-002')
        });
        break;
        
      case 'POST':
        // 新規予約作成
        const newReservation = {
          id: 'R' + Date.now().toString(36).toUpperCase(),
          ...req.body,
          store_id: 'restaurant-002',
          created_at: new Date().toISOString()
        };
        reservations.push(newReservation);
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