export default async function handler(req, res) {
  console.log('=== Account 2 Webhook ===');
  console.log('Method:', req.method);
  
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
    
    const event = body?.events?.[0];
    if (!event) {
      return res.status(200).json({ ok: true, skip: true });
    }
    
    const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    if (!token) {
      console.error('LINE_CHANNEL_ACCESS_TOKEN not set - returning without LINE reply');
      // トークンがなくても基本的な返信メッセージは生成する
      return res.status(200).json({ 
        ok: true, 
        warning: 'token_not_configured',
        message: 'LINE_CHANNEL_ACCESS_TOKENを設定してください'
      });
    }
    
    // LIFF IDの取得（環境変数またはデフォルト）
    const liffId = process.env.LIFF_ID || '2006487877-0Ll31QKD';
    const liffUrl = `https://liff.line.me/${liffId}`;
    
    let replyMessages = [];
    
    // 友だち追加イベント
    if (event.type === 'follow' && event.replyToken) {
      replyMessages = [{
        type: 'text',
        text: `友だち追加ありがとうございます！\n\n🏪 Restaurant Account2へようこそ！\n\n【ご予約はこちら】\n📱 LINE内で予約（おすすめ）\n${liffUrl}\n\n🌐 ブラウザで予約\nhttps://line-booking-account2-new.vercel.app/liff-calendar\n\n予約の確認・変更も承っております。`
      }];
    }
    // メッセージイベント
    else if (event.type === 'message' && event.message?.text && event.replyToken) {
      const userMessage = event.message.text.toLowerCase();
      
      if (userMessage.includes('予約')) {
        replyMessages = [{
          type: 'text',
          text: `ご予約はこちらから：\n\n📱 LINE内で予約（おすすめ）\n${liffUrl}\n\n🌐 ブラウザで予約\nhttps://line-booking-account2-new.vercel.app/liff-calendar\n\n📊 管理画面\nhttps://line-booking-account2-new.vercel.app/admin-calendar`
        }];
      } else if (userMessage.includes('確認') || userMessage.includes('変更') || userMessage.includes('キャンセル')) {
        replyMessages = [{
          type: 'text',
          text: `予約の確認・変更・キャンセル：\n\n📊 管理画面\nhttps://line-booking-account2-new.vercel.app/admin-calendar\n\n📋 予約一覧\nhttps://line-booking-account2-new.vercel.app/`
        }];
      } else if (userMessage.includes('営業') || userMessage.includes('時間')) {
        replyMessages = [{
          type: 'text',
          text: `【営業時間】\n月〜金: 11:00〜22:00\n土日祝: 10:00〜23:00\n\n【定休日】\n年中無休（年末年始を除く）\n\nご予約お待ちしております！`
        }];
      } else {
        replyMessages = [{
          type: 'text',
          text: `メッセージありがとうございます！\n\n【ご予約】\n📱 LINE内で予約\n${liffUrl}\n\n【予約管理】\n📊 管理画面\nhttps://line-booking-account2-new.vercel.app/admin-calendar\n\n何かご不明な点がございましたら、「予約」「確認」「営業時間」などとお送りください。`
        }];
      }
    }
    
    // 返信メッセージがある場合のみ送信
    if (replyMessages.length > 0 && event.replyToken) {
      const response = await fetch('https://api.line.me/v2/bot/message/reply', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`, 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ 
          replyToken: event.replyToken, 
          messages: replyMessages 
        })
      });
      
      const result = await response.text();
      console.log('LINE API Response:', response.status, result);
    }
    
    // Always return 200 for LINE webhook
    res.status(200).json({ ok: true });
  } catch (e) {
    console.error('A2 webhook error:', e.message);
    console.error('Stack:', e.stack);
    // エラーでも200を返す（LINE要件）
    res.status(200).json({ 
      ok: true, 
      error: 'internal',
      message: e.message
    });
  }
}
function readJson(req){return new Promise((resolve,reject)=>{let d='';req.on('data',c=>d+=c);req.on('end',()=>{try{resolve(JSON.parse(d||'{}'))}catch(e){reject(e)}});req.on('error',reject)})}