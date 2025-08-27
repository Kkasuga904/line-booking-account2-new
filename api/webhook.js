export default async function handler(req, res) {
  console.log('=== Account 2 Webhook ===');
  console.log('Method:', req.method);
  console.log('Headers:', req.headers);
  
  // Handle GET requests (browser access)
  if (req.method === 'GET') {
    return res.status(200).json({ ok: true, message: 'LINE webhook endpoint is active' });
  }
  
  // Handle OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    const body = req.body ?? await readJson(req);
    console.log('Body:', JSON.stringify(body));
    
    // LINE webhook verification (empty events array)
    if (body?.events && body.events.length === 0) {
      console.log('LINE webhook verification detected');
      return res.status(200).json({ ok: true });
    }
    
    const ev = body?.events?.[0];
    if (!ev?.replyToken) {
      console.log('No replyToken, returning 200 OK');
      return res.status(200).json({ ok: true, skip: true });
    }

    const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    if (!token) {
      console.error('LINE_CHANNEL_ACCESS_TOKEN not set');
      // Still return 200 to pass LINE webhook verification
      return res.status(200).json({ ok: true, error: 'token_not_configured' });
    }
    
    const r = await fetch('https://api.line.me/v2/bot/message/reply', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        replyToken: ev.replyToken, 
        messages: [{ type: 'text', text: '予約システムAccount2からの返信です' }] 
      })
    });
    
    const txt = await r.text();
    console.log('A2 LINE reply', r.status, txt);
    
    // Always return 200 for LINE webhook
    res.status(200).json({ ok: true, lineStatus: r.status });
  } catch (e) {
    console.error('A2 webhook error', e);
    // Always return 200 for LINE webhook
    res.status(200).json({ ok: true, error: 'internal' });
  }
}
function readJson(req){return new Promise((resolve,reject)=>{let d='';req.on('data',c=>d+=c);req.on('end',()=>{try{resolve(JSON.parse(d||'{}'))}catch(e){reject(e)}});req.on('error',reject)})}