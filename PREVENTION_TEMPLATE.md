# 🛡️ Vercel プロジェクト再発防止テンプレート

## 新規プロジェクト作成スクリプト

### create-safe-vercel-project.sh
```bash
#!/bin/bash
PROJECT_NAME=$1

if [ -z "$PROJECT_NAME" ]; then
  echo "Usage: ./create-safe-vercel-project.sh <project-name>"
  exit 1
fi

echo "🚀 Creating safe Vercel project: $PROJECT_NAME"

# 1. ディレクトリ作成
mkdir $PROJECT_NAME
cd $PROJECT_NAME

# 2. 最小限のpackage.json（罠回避）
cat > package.json << 'EOF'
{
  "name": "PROJECT_NAME",
  "version": "1.0.0",
  "private": true
}
EOF
sed -i "s/PROJECT_NAME/$PROJECT_NAME/g" package.json

# 3. 最小限のvercel.json（重要：空オブジェクト）
echo '{}' > vercel.json

# 4. API検証用エンドポイント（必須）
mkdir api
cat > api/ping.js << 'EOF'
export default function handler(req, res) {
  res.status(200).json({ 
    ok: true, 
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV
  });
}
EOF

# 5. ヘルスチェック用エンドポイント
cat > api/health.js << 'EOF'
export default function handler(req, res) {
  const checks = {
    api: true,
    timestamp: new Date().toISOString(),
    envVars: {
      hasToken: !!process.env.LINE_CHANNEL_ACCESS_TOKEN,
      hasLiffId: !!process.env.LIFF_ID
    }
  };
  res.status(200).json(checks);
}
EOF

# 6. Webhook テンプレート（エラー防止付き）
cat > api/webhook.js << 'EOF'
export default async function handler(req, res) {
  // 常に200を返す（LINE要件）
  try {
    // GET: ブラウザアクセス
    if (req.method === 'GET') {
      return res.status(200).json({ 
        ok: true, 
        message: 'Webhook is active',
        timestamp: new Date().toISOString()
      });
    }
    
    // OPTIONS: CORS preflight
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    // POST: LINE webhook
    const body = req.body || {};
    
    // 空イベント（LINE検証）
    if (body.events && body.events.length === 0) {
      console.log('LINE webhook verification');
      return res.status(200).json({ ok: true });
    }
    
    // イベント処理
    const event = body.events?.[0];
    if (!event) {
      return res.status(200).json({ ok: true, skip: true });
    }
    
    // トークンチェック
    const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    if (!token) {
      console.warn('LINE_CHANNEL_ACCESS_TOKEN not configured');
      return res.status(200).json({ 
        ok: true, 
        warning: 'No token configured'
      });
    }
    
    // ここに実際の処理を追加
    console.log('Event received:', event.type);
    
    // 必ず200を返す
    return res.status(200).json({ ok: true });
    
  } catch (error) {
    console.error('Webhook error:', error);
    // エラーでも200を返す（重要）
    return res.status(200).json({ 
      ok: true, 
      error: 'Internal error handled'
    });
  }
}
EOF

# 7. デプロイ前チェックリスト
cat > DEPLOYMENT_CHECKLIST.md << 'EOF'
# デプロイ前チェックリスト

## 初回デプロイ
- [ ] `npx vercel dev` でローカル動作確認
- [ ] http://localhost:3000/api/ping が200を返す
- [ ] http://localhost:3000/api/health が正常
- [ ] Vercel Dashboard で Framework Preset: Other を選択
- [ ] Build Command: 空欄
- [ ] Output Directory: 空欄

## 毎回のデプロイ前
- [ ] デプロイ回数確認（90回超えたら注意）
- [ ] 複数の変更をまとめてコミット
- [ ] console.logを適切に配置（デバッグ用）
- [ ] 環境変数の確認

## デプロイ後
- [ ] /api/ping の動作確認
- [ ] Functions タブで関数が表示されているか
- [ ] ログでエラーがないか確認
EOF

# 8. 環境変数テンプレート
cat > .env.example << 'EOF'
# LINE Bot
LINE_CHANNEL_ACCESS_TOKEN=your_token_here
LINE_CHANNEL_SECRET=your_secret_here

# LIFF
LIFF_ID=your_liff_id_here

# Database (optional)
DATABASE_URL=your_database_url_here
EOF

# 9. gitignore
cat > .gitignore << 'EOF'
# Dependencies
node_modules/

# Environment
.env
.env.local
.env.production
.env*.local

# Vercel
.vercel

# Tokens
token.txt
*.token

# Logs
*.log
EOF

# 10. README
cat > README.md << 'EOF'
# $PROJECT_NAME

## 🚀 Quick Start

### Local Development
```bash
npx vercel dev
# Visit http://localhost:3000/api/ping
```

### Deployment
```bash
vercel --prod
```

## 📋 Verification Endpoints

- `/api/ping` - Basic health check
- `/api/health` - Detailed status
- `/api/webhook` - LINE webhook endpoint

## ⚠️ Important Notes

1. **Framework Preset**: Must be set to "Other" in Vercel
2. **vercel.json**: Keep it minimal (empty object is fine)
3. **Environment Variables**: Set in Vercel Dashboard after first deploy

## 🔍 Troubleshooting

### API returns 404
1. Check Vercel Dashboard → Functions tab
2. Verify Framework Preset is "Other"
3. Ensure no build command is set

### Webhook not responding
1. Check environment variables are set
2. Verify webhook URL in LINE Developers
3. Check Vercel function logs
EOF
sed -i "s/\$PROJECT_NAME/$PROJECT_NAME/g" README.md

# 11. Git初期化
git init
git add .
git commit -m "Initial safe Vercel project setup"

echo "✅ Safe Vercel project created: $PROJECT_NAME"
echo ""
echo "Next steps:"
echo "1. cd $PROJECT_NAME"
echo "2. npx vercel dev  # Test locally"
echo "3. gh repo create --public --push"
echo "4. vercel --yes  # Deploy"
echo "5. Check /api/ping works"
echo "6. Set environment variables in Vercel Dashboard"
```

## 使い方

```bash
# スクリプトを実行可能にする
chmod +x create-safe-vercel-project.sh

# 新規プロジェクト作成
./create-safe-vercel-project.sh my-new-project
```

## バッチファイル版（Windows）

### create-safe-vercel-project.bat
```batch
@echo off
set PROJECT_NAME=%1

if "%PROJECT_NAME%"=="" (
  echo Usage: create-safe-vercel-project.bat project-name
  exit /b 1
)

echo Creating safe Vercel project: %PROJECT_NAME%

rem ディレクトリ作成
mkdir %PROJECT_NAME%
cd %PROJECT_NAME%

rem package.json
echo { > package.json
echo   "name": "%PROJECT_NAME%", >> package.json
echo   "version": "1.0.0" >> package.json
echo } >> package.json

rem vercel.json (空オブジェクト)
echo {} > vercel.json

rem API directory
mkdir api

rem ping.js
echo export default function handler(req, res) { > api\ping.js
echo   res.status(200).json({ ok: true }); >> api\ping.js
echo } >> api\ping.js

echo Project created successfully!
echo Next: cd %PROJECT_NAME% && npx vercel dev
```

## チェックポイント自動化スクリプト

### verify-vercel-setup.js
```javascript
const https = require('https');

async function checkEndpoint(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      resolve(res.statusCode === 200);
    }).on('error', () => resolve(false));
  });
}

async function verifyProject(projectUrl) {
  console.log('🔍 Verifying Vercel project:', projectUrl);
  
  const checks = {
    ping: await checkEndpoint(`${projectUrl}/api/ping`),
    health: await checkEndpoint(`${projectUrl}/api/health`),
    webhook: await checkEndpoint(`${projectUrl}/api/webhook`),
    root: await checkEndpoint(projectUrl)
  };
  
  console.log('\n📊 Results:');
  Object.entries(checks).forEach(([endpoint, status]) => {
    console.log(`${status ? '✅' : '❌'} /${endpoint === 'root' ? '' : 'api/'}${endpoint === 'root' ? '' : endpoint}`);
  });
  
  if (Object.values(checks).every(v => v)) {
    console.log('\n✅ All checks passed!');
  } else {
    console.log('\n⚠️ Some checks failed. Review your configuration.');
  }
}

// Usage
const projectUrl = process.argv[2];
if (!projectUrl) {
  console.log('Usage: node verify-vercel-setup.js https://your-project.vercel.app');
  process.exit(1);
}

verifyProject(projectUrl);
```

## 再発防止の鉄則

### 🔴 絶対にやってはいけないこと
1. ❌ 複雑なvercel.json設定から始める
2. ❌ Framework Presetを後から変更
3. ❌ /api/ping なしでデプロイ
4. ❌ ローカルテストなしで本番デプロイ

### 🟢 必ずやること
1. ✅ 空のvercel.json `{}` から始める
2. ✅ Framework Preset: Other を最初に設定
3. ✅ /api/ping で疎通確認
4. ✅ npx vercel dev でローカル確認

### デプロイ回数を節約する技
```javascript
// api/debug.js - デバッグ情報をまとめて取得
export default function handler(req, res) {
  res.status(200).json({
    env: {
      hasToken: !!process.env.LINE_CHANNEL_ACCESS_TOKEN,
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV
    },
    request: {
      method: req.method,
      headers: req.headers,
      query: req.query
    },
    timestamp: new Date().toISOString()
  });
}
```

これで1回のデプロイで多くの情報を取得できます！