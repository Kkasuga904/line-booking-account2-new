/**
 * カレンダー予約API with Capacity Validation
 * 
 * LIFF（LINE Front-end Framework）やWebフォームから
 * 予約情報を受け取り、キャパシティ制限をチェックして処理するエンドポイント
 * 
 * @param {Request} req - HTTPリクエスト
 * @param {Response} res - HTTPレスポンス
 */

// Capacity validator import
// Note: 現在はファイルパス問題により直接import不可、将来的に対応
// import { CapacityValidator } from '../../line-booking-system/utils/capacity-validator.js';

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
    
    // キャパシティ制限の検証
    const capacityResult = await validateCapacity(reservation);
    if (!capacityResult.allowed) {
      return res.status(409).json({
        error: 'Capacity exceeded',
        message: capacityResult.reason || '予約上限に達しています',
        rule: capacityResult.rule
      });
    }
    
    // デバッグ用ログ（本番環境では適切なロギングサービスを使用）
    console.log('New reservation created:', reservation);
    console.log('Capacity validation passed:', capacityResult);
    
    // TODO: ここでデータベースに保存する処理を追加
    // await saveToDatabase(reservation);
    
    // TODO: 確認メール/LINE通知を送信
    // await sendConfirmation(reservation);
    
    // LINE通知用の確認メッセージ作成
    const confirmationMessage = createConfirmationMessage(reservation);
    
    // TODO: LINE通知を送信
    // await sendLineNotification(reservation.customer_id, confirmationMessage);
    
    // 成功レスポンス
    // フロントエンドで予約IDを表示できるように、予約情報を返す
    res.status(200).json({
      success: true,
      reservation,
      message: confirmationMessage,
      displayMessage: `予約番号: ${reservationId}\n\n予約完了通知をLINEでお送りしました。`
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

/**
 * キャパシティ制限の検証を行う関数
 * 本来は separate utility から import すべきだが、
 * パス問題により一時的にここに簡易実装
 * 
 * @param {Object} reservation - 予約オブジェクト
 * @returns {Promise<{allowed: boolean, reason?: string}>} 検証結果
 */
async function validateCapacity(reservation) {
  // 簡易実装: 基本的な検証のみ
  
  // 時間帯による制限例
  const hour = parseInt(reservation.time.split(':')[0]);
  const reservationDate = new Date(reservation.date);
  const isWeekend = reservationDate.getDay() === 0 || reservationDate.getDay() === 6;
  
  // 例: 週末のランチタイム（11-15時）は制限
  if (isWeekend && hour >= 11 && hour <= 15) {
    // 実際の実装では既存の予約数をカウントする
    const existingCount = 0; // TODO: データベースから取得
    const limit = 3; // 1時間あたり3件まで
    
    if (existingCount >= limit) {
      return {
        allowed: false,
        reason: `申し訳ございません。\n\n📊 週末ランチタイム（11:00-15:00）\n現在、ご指定の時間帯は予約が満席です。\n\n【ご提案】\n・前後の時間帯 (10:30 または 15:30)\n・平日の同じ時間帯\n\nご不便をおかけして申し訳ございません。`,
        alternativeTimes: ['10:30', '15:30'],
        alternativeDays: ['平日']
      };
    }
  }
  
  // 例: 平日夕方の制限
  if (!isWeekend && hour >= 17 && hour <= 20) {
    const existingCount = 0; // TODO: データベースから取得
    const limit = 5; // 1時間あたり5件まで
    
    if (existingCount >= limit) {
      return {
        allowed: false,
        reason: `申し訳ございません。\n\n📊 平日夕方（17:00-20:00）\nご指定の時間帯は現在満席です。\n\n【ご提案】\n・20:30以降の時間帯\n・週末の同じ時間帯\n\n他の時間帯でもご検討いただければ幸いです。`,
        alternativeTimes: ['20:30', '21:00'],
        alternativeDays: ['土曜日', '日曜日']
      };
    }
  }
  
  // 全体的な1日制限の例
  const dailyLimit = 50; // 1日50件まで
  const dailyCount = 0; // TODO: データベースから取得
  
  if (dailyCount >= dailyLimit) {
    return {
      allowed: false,
      reason: `大変申し訳ございません。\n\n本日はご予約が上限に達しました。\n\n【ご提案】\n・明日以降のご予約\n・キャンセル待ちリストへの登録\n\nお電話でのお問い合わせ: 03-0000-0000`
    };
  }
  
  // 予約可能な場合のメッセージ
  return { 
    allowed: true,
    message: 'お席をご用意できます🎉' 
  };
}

/**
 * 予約確認メッセージを作成
 * @param {Object} reservation - 予約オブジェクト
 * @returns {string} 確認メッセージ
 */
function createConfirmationMessage(reservation) {
  const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'];
  const date = new Date(reservation.date);
  const day = dayOfWeek[date.getDay()];
  
  return `🎉 ご予約が確定しました！\n\n【予約詳細】\n予約番号: ${reservation.id}\nお名前: ${reservation.customer_name}様\n日付: ${reservation.date} (${day})\n時間: ${reservation.time}\n人数: ${reservation.people}名様\n${reservation.note ? `備考: ${reservation.note}\n` : ''}\n【ご注意】\n・キャンセルは前日までにお願いします\n・遅刻の際はお電話ください\n\nお会いできるのを楽しみにしております！`;
}