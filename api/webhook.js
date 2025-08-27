/**
 * Account 2 LINE Webhook Handler
 * 
 * このエンドポイントはLINE Messaging APIからのWebhookを処理します。
 * 重要: LINEの仕様により、必ず200ステータスを返す必要があります。
 * 
 * @param {Request} req - HTTPリクエスト
 * @param {Response} res - HTTPレスポンス
 */
export default async function handler(req, res) {
  // デバッグ用: リクエストの基本情報をログ出力
  console.log('=== Account 2 Webhook ===');
  console.log('Method:', req.method);
  
  // GETリクエストの処理（ブラウザからの動作確認用）
  // 本番環境でもエンドポイントの生存確認に使用
  if (req.method === 'GET') {
    return res.status(200).json({ 
      ok: true, 
      message: 'LINE webhook endpoint is active',
      timestamp: new Date().toISOString()
    });
  }
  
  // OPTIONSリクエストの処理（CORS preflight）
  // ブラウザからのクロスオリジンリクエストに対応
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    // リクエストボディの取得
    // Vercelの場合はreq.bodyが自動パースされるが、念のためフォールバック
    const body = req.body ?? await readJson(req);
    console.log('Body:', JSON.stringify(body));
    
    // LINE Webhook検証リクエストの処理
    // LINEは初回設定時に空のevents配列を送信して疎通確認を行う
    if (body?.events && body.events.length === 0) {
      console.log('LINE webhook verification detected');
      return res.status(200).json({ ok: true });
    }
    
    // イベントの取得（通常は配列の最初の要素のみ処理）
    const event = body?.events?.[0];
    if (!event) {
      // イベントがない場合も200を返す（エラーではない）
      return res.status(200).json({ ok: true, skip: true });
    }
    
    // 環境変数からLINE Channel Access Tokenを取得
    // このトークンがないとLINEにメッセージを送信できない
    const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    if (!token) {
      console.error('LINE_CHANNEL_ACCESS_TOKEN not set - returning without LINE reply');
      // トークンが設定されていない場合でも200を返す（重要）
      return res.status(200).json({ 
        ok: true, 
        warning: 'token_not_configured',
        message: 'LINE_CHANNEL_ACCESS_TOKENを設定してください'
      });
    }
    
    // LIFF IDの取得
    // LIFF (LINE Front-end Framework) は、LINEアプリ内でWebアプリを開くための仕組み
    // 環境変数で設定可能、未設定の場合はデフォルト値を使用
    const liffId = process.env.LIFF_ID || '2006487877-0Ll31QKD';
    const liffUrl = `https://liff.line.me/${liffId}`;
    
    // 返信メッセージの配列を初期化
    let replyMessages = [];
    
    // イベントタイプ別の処理
    // 友だち追加イベント（ユーザーがボットを友だち追加した時）
    if (event.type === 'follow' && event.replyToken) {
      replyMessages = [{
        type: 'text',
        text: `友だち追加ありがとうございます！\n\n🏪 Restaurant Account2へようこそ！\n\n【ご予約はこちら】\n📱 LINE内で予約（おすすめ）\n${liffUrl}\n\n🌐 ブラウザで予約\nhttps://line-booking-account2-new.vercel.app/liff-calendar\n\n予約の確認・変更も承っております。`
      }];
    }
    // メッセージイベント（ユーザーがテキストメッセージを送信した時）
    else if (event.type === 'message' && event.message?.text && event.replyToken) {
      // メッセージを小文字に変換して判定を簡単にする
      const userMessage = event.message.text.toLowerCase();
      
      // キーワードに応じた返信を生成
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
    
    // 返信メッセージがある場合のみLINE APIを呼び出す
    if (replyMessages.length > 0 && event.replyToken) {
      // LINE Messaging API の Reply エンドポイントを呼び出し
      // replyTokenは1分間有効なので、即座に返信する必要がある
      const response = await fetch('https://api.line.me/v2/bot/message/reply', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,  // 認証トークン
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ 
          replyToken: event.replyToken,  // 返信用トークン（1回のみ使用可）
          messages: replyMessages         // 返信メッセージ配列（最大5つ）
        })
      });
      
      // レスポンスをログに記録（デバッグ用）
      const result = await response.text();
      console.log('LINE API Response:', response.status, result);
    }
    
    // 処理が成功してもエラーでも必ず200を返す（LINE Webhookの仕様）
    // 200以外を返すとLINEが再送信を行う可能性がある
    res.status(200).json({ ok: true });
    
  } catch (e) {
    // エラーハンドリング
    // エラーが発生してもサービスを継続させるため、詳細をログに記録して200を返す
    console.error('A2 webhook error:', e.message);
    console.error('Stack:', e.stack);
    
    // エラーでも必ず200を返す（重要：LINEの再送信を防ぐため）
    res.status(200).json({ 
      ok: true, 
      error: 'internal',
      message: e.message  // デバッグ用にエラーメッセージを含める
    });
  }
}

/**
 * リクエストボディをJSONとして読み取るヘルパー関数
 * Vercelでは通常不要だが、フォールバックとして用意
 * 
 * @param {Request} req - HTTPリクエストオブジェクト
 * @returns {Promise<Object>} パースされたJSONオブジェクト
 */
function readJson(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => data += chunk);
    req.on('end', () => {
      try {
        resolve(JSON.parse(data || '{}'));
      } catch(e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}