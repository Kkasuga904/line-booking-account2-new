# Vercel API検出問題の解決と再発防止

## 問題の概要
Vercelが`/api`ディレクトリをServerless Functionsとして認識しない問題が発生しました。
この問題により、すべてのAPIエンドポイントが404エラーを返していました。

## 根本原因
1. **Framework Presetの誤設定**: VercelがプロジェクトをNext.jsとして誤認識
2. **ビルド設定の競合**: Output Directoryが設定されていると静的サイトとして扱われる
3. **package.json設定**: `"type": "module"`の有無による影響

## 解決方法

### 1. 最小構成から始める
```json
// package.json
{
  "name": "project-name",
  "version": "1.0.0"
}

// vercel.json
{}
```

### 2. 最小限のAPIファイル作成
```javascript
// api/ping.js
export default function handler(req, res) {
  res.status(200).json({ ok: true });
}
```

### 3. Vercelダッシュボードで設定確認
- Framework Preset: **Other**（必須）
- Build Command: **空欄**
- Output Directory: **空欄**
- Root Directory: **リポジトリルート**

## 再発防止チェックリスト

### デプロイ前の確認
- [ ] `vercel.json`は最小限の設定か？
- [ ] 不要なビルド設定がないか？
- [ ] `.vercelignore`に`api/`が含まれていないか？

### ローカルテスト
```bash
# 必ずローカルで動作確認
npx vercel dev
curl http://localhost:3000/api/ping
```

### デプロイ後の確認
```bash
# 本番環境でテスト
curl https://your-project.vercel.app/api/ping
```

## トラブルシューティング

### 症状: /api/* が404を返す

#### 確認手順
1. Vercel Dashboardで`Functions`タブを確認
2. 関数が表示されていない場合、Framework Presetを確認
3. `Other`以外が選択されている場合は変更

#### 最終手段（核オプション）
既存プロジェクトの修復が困難な場合：

1. **新規プロジェクト作成**
```bash
mkdir project-new
cd project-new
git init
```

2. **最小構成でセットアップ**
```bash
echo '{}' > vercel.json
echo '{"name":"project","version":"1.0.0"}' > package.json
mkdir api
echo 'export default (req,res)=>res.json({ok:true})' > api/ping.js
```

3. **新規デプロイ**
```bash
git add -A
git commit -m "Initial"
gh repo create --public --push
vercel --yes
```

## 予防的措置

### 1. プロジェクトテンプレート
```javascript
// .github/templates/vercel-api-project/vercel.json
{}  // 空のオブジェクトから始める

// .github/templates/vercel-api-project/package.json
{
  "name": "template",
  "version": "1.0.0"
}
```

### 2. CI/CDパイプライン
```yaml
# .github/workflows/vercel-check.yml
name: Vercel API Check
on: [push]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: |
          # APIディレクトリが存在することを確認
          test -d api || exit 1
          # vercel.jsonが複雑すぎないことを確認
          test $(wc -l < vercel.json) -lt 20 || exit 1
```

### 3. 環境変数チェックリスト
```bash
# 必要な環境変数
LINE_CHANNEL_ACCESS_TOKEN  # LINE Bot token
LIFF_ID                     # LIFF application ID
```

## ベストプラクティス

1. **段階的な機能追加**
   - まず`/api/ping`が動作することを確認
   - その後、他のAPIを追加

2. **vercel.jsonは最小限に**
   - rewritesのみ必要に応じて追加
   - functionsの設定は避ける（自動検出に任せる）

3. **定期的な動作確認**
   - デプロイごとに`/api/ping`をテスト
   - Vercel Functions tabで関数が表示されることを確認

## 関連ドキュメント
- [Vercel Serverless Functions](https://vercel.com/docs/functions)
- [Project Configuration](https://vercel.com/docs/projects/project-configuration)
- [Troubleshooting Functions](https://vercel.com/docs/functions/troubleshooting)

## まとめ
Vercelの自動検出機能は便利ですが、時に誤認識することがあります。
問題が発生した場合は、最小構成から始めることが最も確実な解決方法です。
「Less is more」の精神で、シンプルな設定を心がけましょう。