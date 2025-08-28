/**
 * キャパシティ管理API
 * 
 * 予約制限ルールの管理とキャパシティ状況の確認を提供するエンドポイント
 * 管理者が制限ルールを設定・確認・削除するために使用
 * 
 * @param {Request} req - HTTPリクエスト
 * @param {Response} res - HTTPレスポンス
 */

// Capacity utilities import
// Note: 現在はファイルパス問題により直接import不可、将来的に対応
// import { CapacityCommandParser } from '../../line-booking-system/utils/capacity-command-parser.js';
// import { CapacityValidator } from '../../line-booking-system/utils/capacity-validator.js';

export default async function handler(req, res) {
  // CORS設定（管理画面からのアクセスを許可）
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // CORS プリフライトリクエストの処理
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // リクエスト情報の取得
  const { method } = req;
  const url = new URL(req.url, `http://${req.headers.host}`);
  const action = url.searchParams.get('action'); // action=rules, stats, validate等
  const storeId = url.searchParams.get('store_id') || 'restaurant-002'; // Account 2デフォルト
  
  try {
    // HTTPメソッドとactionパラメータに応じた処理
    switch (method) {
      case 'GET':
        return await handleGetRequest(res, action, storeId, url.searchParams);
        
      case 'POST':
        return await handlePostRequest(req, res, action, storeId);
        
      case 'PUT':
        return await handlePutRequest(req, res, url.searchParams);
        
      case 'DELETE':
        return await handleDeleteRequest(res, url.searchParams);
        
      default:
        return res.status(405).json({ 
          error: 'Method not allowed',
          allowed: ['GET', 'POST', 'PUT', 'DELETE']
        });
    }
  } catch (error) {
    console.error('Capacity API error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    });
  }
}

/**
 * GET リクエストの処理
 */
async function handleGetRequest(res, action, storeId, params) {
  switch (action) {
    case 'rules':
      // 制限ルール一覧の取得
      const rules = await getActiveRules(storeId);
      return res.status(200).json({
        success: true,
        rules,
        total: rules.length
      });
      
    case 'stats':
      // キャパシティ統計の取得
      const date = params.get('date') || new Date().toISOString().split('T')[0];
      const stats = await getCapacityStats(storeId, date);
      return res.status(200).json({
        success: true,
        date,
        stats
      });
      
    case 'validate':
      // 予約の検証（テスト用）
      const testReservation = {
        store_id: storeId,
        date: params.get('date') || new Date().toISOString().split('T')[0],
        time: params.get('time') || '12:00:00',
        seat_type: params.get('seat_type'),
        menu: params.get('menu'),
        staff: params.get('staff')
      };
      
      const validationResult = await validateCapacity(testReservation);
      return res.status(200).json({
        success: true,
        reservation: testReservation,
        validation: validationResult
      });
      
    default:
      // デフォルト: 利用可能なアクション一覧
      return res.status(200).json({
        success: true,
        message: 'Capacity Management API',
        available_actions: {
          'GET ?action=rules': '制限ルール一覧の取得',
          'GET ?action=stats&date=YYYY-MM-DD': '指定日のキャパシティ統計',
          'GET ?action=validate&date=YYYY-MM-DD&time=HH:MM': '予約検証テスト',
          'POST': '新規制限ルールの作成',
          'PUT ?rule_id=ID': '制限ルールの更新',
          'DELETE ?rule_id=ID': '制限ルールの削除'
        }
      });
  }
}

/**
 * POST リクエストの処理（新規ルール作成）
 */
async function handlePostRequest(req, res, action, storeId) {
  const body = req.body;
  
  // コマンドテキストからルールを作成
  if (body.command) {
    const result = await processCapacityCommand(body.command, body.user_id, storeId);
    return res.status(result.success ? 201 : 400).json(result);
  }
  
  // 直接ルールオブジェクトを作成
  if (body.rule) {
    const rule = {
      ...body.rule,
      store_id: storeId,
      created_at: new Date().toISOString(),
      active: true
    };
    
    const result = await createRule(rule);
    return res.status(result.success ? 201 : 400).json(result);
  }
  
  return res.status(400).json({
    error: 'Invalid request body',
    message: 'command または rule が必要です'
  });
}

/**
 * PUT リクエストの処理（ルール更新）
 */
async function handlePutRequest(req, res, params) {
  const ruleId = params.get('rule_id');
  if (!ruleId) {
    return res.status(400).json({ error: 'rule_id parameter required' });
  }
  
  const updates = req.body;
  const result = await updateRule(ruleId, updates);
  return res.status(result.success ? 200 : 404).json(result);
}

/**
 * DELETE リクエストの処理（ルール削除）
 */
async function handleDeleteRequest(res, params) {
  const ruleId = params.get('rule_id');
  if (!ruleId) {
    return res.status(400).json({ error: 'rule_id parameter required' });
  }
  
  const result = await deactivateRule(ruleId);
  return res.status(result.success ? 200 : 404).json(result);
}

// ===== データベース操作関数（簡易実装） =====

/**
 * アクティブな制限ルール一覧の取得
 */
async function getActiveRules(storeId) {
  // TODO: 実際のSupabaseクエリに置き換える
  return [
    {
      id: 'rule-001',
      store_id: storeId,
      scope_type: 'store',
      scope_ids: null,
      weekdays: [0, 6], // 土日
      time_start: '11:00',
      time_end: '15:00',
      limit_type: 'per_hour',
      limit_value: 3,
      priority: 0,
      active: true,
      description: '週末ランチタイム: 1時間あたり3件まで',
      created_at: new Date().toISOString()
    },
    {
      id: 'rule-002',
      store_id: storeId,
      scope_type: 'store',
      scope_ids: null,
      weekdays: [1, 2, 3, 4, 5], // 平日
      time_start: '17:00',
      time_end: '20:00',
      limit_type: 'per_hour',
      limit_value: 5,
      priority: 0,
      active: true,
      description: '平日夕方: 1時間あたり5件まで',
      created_at: new Date().toISOString()
    }
  ];
}

/**
 * キャパシティ統計の取得
 */
async function getCapacityStats(storeId, date) {
  // TODO: 実際のデータベースから統計を計算
  return [
    {
      rule_id: 'rule-001',
      description: '週末ランチタイム: 1時間あたり3件まで',
      limit_type: 'per_hour',
      limit_value: 3,
      current_count: 1,
      utilization: 0.33, // 33%使用
      status: 'ok'
    },
    {
      rule_id: 'rule-002',
      description: '平日夕方: 1時間あたり5件まで',
      limit_type: 'per_hour',
      limit_value: 5,
      current_count: 3,
      utilization: 0.6, // 60%使用
      status: 'warning'
    }
  ];
}

/**
 * 新規制限ルールの作成
 */
async function createRule(rule) {
  // TODO: Supabaseに保存
  console.log('Creating rule:', rule);
  return {
    success: true,
    rule: { ...rule, id: 'rule-' + Date.now() },
    message: '制限ルールを作成しました'
  };
}

/**
 * 制限ルールの更新
 */
async function updateRule(ruleId, updates) {
  // TODO: Supabaseで更新
  console.log('Updating rule:', ruleId, updates);
  return {
    success: true,
    rule: { id: ruleId, ...updates },
    message: '制限ルールを更新しました'
  };
}

/**
 * 制限ルールの無効化
 */
async function deactivateRule(ruleId) {
  // TODO: Supabaseで無効化
  console.log('Deactivating rule:', ruleId);
  return {
    success: true,
    message: '制限ルールを無効化しました'
  };
}

/**
 * キャパシティ制限の検証
 */
async function validateCapacity(reservation) {
  // 簡易実装（calendar-reservation.jsと同じロジック）
  const hour = parseInt(reservation.time.split(':')[0]);
  const reservationDate = new Date(reservation.date);
  const isWeekend = reservationDate.getDay() === 0 || reservationDate.getDay() === 6;
  
  if (isWeekend && hour >= 11 && hour <= 15) {
    const existingCount = 1; // 仮の値
    const limit = 3;
    
    if (existingCount >= limit) {
      return {
        allowed: false,
        reason: '週末ランチタイム: 1時間あたり3件まで（上限に達しています）'
      };
    }
  }
  
  return { 
    allowed: true,
    message: 'キャパシティ制限に問題ありません'
  };
}

/**
 * 制限コマンドの処理
 */
async function processCapacityCommand(command, userId, storeId) {
  // 簡易実装（webhook.jsと同じロジック）
  const text = command.trim();
  
  if (text === '/limits') {
    const rules = await getActiveRules(storeId);
    let message = '📋 現在の制限ルール:\n\n';
    
    if (rules.length === 0) {
      message += '現在、制限ルールは設定されていません。';
    } else {
      rules.forEach((rule, index) => {
        message += `${index + 1}. ${rule.description}\n`;
        message += `   ID: #${rule.id} 🟢\n\n`;
      });
    }
    
    message += '\n利用可能なコマンド:\n';
    message += '/limit today 20 ... 今日の予約を20件まで制限\n';
    message += '/limit sat,sun lunch 5/h ... 週末ランチを1時間5件まで\n';
    message += '/stop today 18:00- ... 今日18時以降予約停止';
    
    return { success: true, message };
  }
  
  if (text.startsWith('/limit ') || text.startsWith('/stop ')) {
    // TODO: 実際のコマンドパーサーを使用
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