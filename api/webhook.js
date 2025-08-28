/**
 * Account 2 LINE Webhook Handler with Capacity Management
 * 
 * このエンドポイントはLINE Messaging APIからのWebhookを処理します。
 * 店長による制限コマンドの解析と、予約制限機能を含みます。
 * 重要: LINEの仕様により、必ず200ステータスを返す必要があります。
 * 
 * @param {Request} req - HTTPリクエスト
 * @param {Response} res - HTTPレスポンス
 */

// Capacity command parser import
// Note: 現在はファイルパス問題により直接import不可、将来的に対応
// import { CapacityCommandParser } from '../../line-booking-system/utils/capacity-command-parser.js';

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
      replyMessages = [
        {
          type: 'text',
          text: `ご登録ありがとうございます！🎉\n\n【Restaurant Account2】\nカジュアルダイニング\n\n営業時間:\n月〜金 11:00-22:00\n土日祝 10:00-23:00\n\nご予約は下記ボタンから簡単にできます👇`
        },
        {
          type: 'template',
          altText: '予約メニュー',
          template: {
            type: 'buttons',
            text: '何をご希望ですか？',
            actions: [
              {
                type: 'uri',
                label: '📅 新規予約',
                uri: liffUrl
              },
              {
                type: 'message',
                label: '📋 予約確認',
                text: '予約確認'
              },
              {
                type: 'message',
                label: '📞 お問い合わせ',
                text: 'お問い合わせ'
              }
            ]
          }
        }
      ];
    }
    // メッセージイベント（ユーザーがテキストメッセージを送信した時）
    else if (event.type === 'message' && event.message?.text && event.replyToken) {
      const userMessage = event.message.text;
      const userMessageLower = userMessage.toLowerCase();
      
      // 制限コマンドの処理（店長専用機能）
      if (userMessage.startsWith('/limit') || userMessage.startsWith('/stop') || userMessage === '/limits') {
        try {
          // TODO: 実際の実装では適切な認証を行う
          // 現在は簡易版として直接処理
          
          const response = await processCapacityCommand(userMessage, event.source?.userId, 'restaurant-002');
          replyMessages = [{
            type: 'text',
            text: response.success ? response.message : `エラー: ${response.error}`
          }];
        } catch (error) {
          console.error('Capacity command error:', error);
          replyMessages = [{
            type: 'text',
            text: '制限コマンドの処理中にエラーが発生しました。'
          }];
        }
      }
      // キーワードに応じた返信を生成
      else if (userMessageLower.includes('予約')) {
        replyMessages = [
          {
            type: 'template',
            altText: '予約オプション',
            template: {
              type: 'confirm',
              text: '新規予約をご希望ですか？',
              actions: [
                {
                  type: 'uri',
                  label: 'はい（予約画面へ）',
                  uri: liffUrl
                },
                {
                  type: 'message',
                  label: '予約を確認する',
                  text: '予約確認'
                }
              ]
            }
          }
        ];
      } else if (userMessageLower.includes('確認') || userMessageLower.includes('変更') || userMessageLower.includes('キャンセル')) {
        // TODO: 実際の予約確認機能実装後は予約情報を返す
        replyMessages = [
          {
            type: 'text',
            text: '予約確認システムをご利用いただきありがとうございます。'
          },
          {
            type: 'template',
            altText: '予約管理',
            template: {
              type: 'buttons',
              text: '予約の確認・変更はこちらから',
              actions: [
                {
                  type: 'uri',
                  label: '📊 予約管理画面',
                  uri: 'https://line-booking-account2-new.vercel.app/admin-calendar'
                },
                {
                  type: 'message',
                  label: '🔍 予約番号で検索',
                  text: '予約番号：'
                },
                {
                  type: 'message',
                  label: '📞 電話で確認',
                  text: 'お問い合わせ'
                }
              ]
            }
          }
        ];
      } else if (userMessageLower.includes('営業') || userMessageLower.includes('時間')) {
        replyMessages = [
          {
            type: 'text',
            text: `📍 Restaurant Account2\n\n【営業時間】\n月〜金: 11:00〜22:00 (L.O. 21:30)\n土日祝: 10:00〜23:00 (L.O. 22:30)\n\n【定休日】\n年中無休（年末年始を除く）\n\n【アクセス】\n〒100-0001\n東京都千代田区サンプル1-2-3\n\n☎️ 03-0000-0000`
          },
          {
            type: 'template',
            altText: 'クイックアクション',
            template: {
              type: 'buttons',
              text: '本日のご予約はいかがですか？',
              actions: [
                {
                  type: 'uri',
                  label: '📅 今すぐ予約',
                  uri: liffUrl
                },
                {
                  type: 'message',
                  label: '🍽 本日のメニュー',
                  text: 'メニュー'
                }
              ]
            }
          }
        ];
      } else if (userMessageLower.includes('メニュー') || userMessageLower.includes('料理')) {
        replyMessages = [{
          type: 'text',
          text: `🍽 本日のおすすめ\n\n【ランチ】11:00-15:00\n・日替わりパスタ ¥1,200\n・本日の魚料理 ¥1,500\n・黒毛和牛ハンバーグ ¥1,800\n\n【ディナー】17:00-22:00\n・シェフおまかせコース ¥5,000〜\n・アラカルト各種\n\n※価格は税込です`
        }];
      } else if (userMessageLower.includes('問い合わせ') || userMessageLower.includes('電話')) {
        replyMessages = [{
          type: 'text',
          text: `📞 お問い合わせ\n\nお電話: 03-0000-0000\n受付時間: 10:00-21:00\n\nLINEでもご質問を承っております。\nお気軽にメッセージをお送りください！`
        }];
      } else if (userMessageLower.includes('予約番号')) {
        replyMessages = [{
          type: 'text',
          text: `予約番号をお送りください。\n例: R123456789\n\n予約番号は予約完了時にお送りしたメッセージに記載されています。`
        }];
      } else if (userMessage.startsWith('R') && userMessage.length > 8) {
        // 予約番号らしき文字列の処理
        replyMessages = [{
          type: 'text',
          text: `予約番号 ${userMessage} を確認中...\n\n申し訳ございません。現在システムメンテナンス中です。\nお手数ですが、お電話（03-0000-0000）でご確認ください。`
        }];
      } else {
        // クイックリプライで選択肢を提示
        replyMessages = [{
          type: 'text',
          text: `こんにちは！ご用件をお選びください👇`,
          quickReply: {
            items: [
              {
                type: 'action',
                action: {
                  type: 'message',
                  label: '🍴 新規予約',
                  text: '予約したい'
                }
              },
              {
                type: 'action',
                action: {
                  type: 'message',
                  label: '📋 予約確認',
                  text: '予約確認'
                }
              },
              {
                type: 'action',
                action: {
                  type: 'message',
                  label: '⏰ 営業時間',
                  text: '営業時間'
                }
              },
              {
                type: 'action',
                action: {
                  type: 'message',
                  label: '🍽 メニュー',
                  text: 'メニュー'
                }
              },
              {
                type: 'action',
                action: {
                  type: 'message',
                  label: '📞 お問い合わせ',
                  text: 'お問い合わせ'
                }
              }
            ]
          }
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
 * 制限コマンドを処理する関数
 * 本来は separate utility から import すべきだが、
 * パス問題により一時的にここに簡易実装
 * 
 * @param {string} messageText - コマンドテキスト
 * @param {string} userId - ユーザーID
 * @param {string} storeId - 店舗ID
 * @returns {Promise<Object>} 処理結果
 */
async function processCapacityCommand(messageText, userId, storeId) {
  // 簡易実装: コマンドを認識して適切なレスポンスを返す
  const text = messageText.trim();
  
  if (text === '/limits') {
    // 制限ルール一覧の取得（仮実装）
    return {
      success: true,
      message: '📋 現在の制限ルール:\n\n現在、制限ルールは設定されていません。\n\n利用可能なコマンド:\n/limit today 20 ... 今日の予約を20件まで制限\n/limit sat,sun lunch 5/h ... 週末ランチを1時間5件まで\n/stop today 18:00- ... 今日18時以降予約停止'
    };
  }
  
  if (text.startsWith('/limit ') || text.startsWith('/stop ')) {
    // 制限設定コマンドの解析（仮実装）
    return {
      success: true,
      message: `制限ルールを設定しました:\n${text}\n\n（注: 現在はテスト実装です。本格実装は準備中）`
    };
  }
  
  return {
    success: false,
    error: '未対応のコマンドです'
  };
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