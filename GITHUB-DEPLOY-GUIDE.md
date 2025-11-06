# 🚀 Brother G EV - V29.0 GitHub 部署指南

## 📋 部署前準備清單

- [ ] 已安裝 Git
- [ ] 已有 GitHub 帳號
- [ ] 已創建 GitHub 倉庫（或準備創建）
- [ ] 本地有完整的項目文件

---

## 方法 1: 使用自動化腳本（推薦）⭐

### 步驟 1: 準備腳本

```bash
# 進入項目目錄
cd /Users/jimwearno/Desktop/網站智能大腦brothergev-cloudrun-vertex-sop/brothergev-website

# 複製部署腳本
cp /mnt/user-data/outputs/deploy-to-github.sh .

# 給予執行權限
chmod +x deploy-to-github.sh
```

### 步驟 2: 執行腳本

```bash
./deploy-to-github.sh
```

腳本會自動：
- ✅ 檢查 Git 狀態
- ✅ 創建 .gitignore
- ✅ 添加遠端倉庫
- ✅ 提交更改
- ✅ 推送到 GitHub

---

## 方法 2: 手動部署步驟

### 步驟 1: 初始化 Git（如果還沒有）

```bash
# 進入項目目錄
cd /Users/jimwearno/Desktop/網站智能大腦brothergev-cloudrun-vertex-sop/brothergev-website

# 初始化 Git
git init

# 檢查狀態
git status
```

### 步驟 2: 創建 .gitignore

創建 `.gitignore` 文件：

```bash
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
.npm/

# Production
.netlify/
build/
dist/

# Environment Variables (重要！)
.env
.env.local
.env.production

# Sensitive Files (絕對不要上傳！)
*.json
!package.json
!package-lock.json
credentials.json
serviceAccount.json

# Logs
*.log

# OS Files
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
EOF
```

### 步驟 3: 複製最新的文件

```bash
# 複製 V29.0 API
cp /mnt/user-data/outputs/ask-V29-FINAL.js netlify/functions/ask.js

# 複製前端（如果需要）
cp /mnt/user-data/outputs/index-READY.html public/index.html

# 複製 README
cp /mnt/user-data/outputs/README.md .
```

### 步驟 4: 添加文件到 Git

```bash
# 添加所有文件
git add .

# 查看將要提交的文件
git status
```

**⚠️ 重要：檢查沒有敏感文件！**
- ❌ 不應該有 `.env` 文件
- ❌ 不應該有 `.json` 憑證文件
- ✅ 應該有 `package.json`
- ✅ 應該有 `netlify/functions/ask.js`
- ✅ 應該有 `public/index.html`

### 步驟 5: 提交更改

```bash
# 提交
git commit -m "Deploy V29.0 - 修復 API undefined + Google OAuth"
```

### 步驟 6: 創建 GitHub 倉庫

#### 方法 A: 在 GitHub 網站創建

1. 訪問：https://github.com/new
2. 倉庫名稱：`brothergev-website`
3. 描述：`Brother G EV - Tesla Decision Advisor`
4. 設置為 **Private**（如果包含商業邏輯）
5. **不要**勾選 "Initialize this repository with a README"
6. 點擊 "Create repository"

#### 方法 B: 使用 GitHub CLI

```bash
# 如果已安裝 gh cli
gh repo create brothergev-website --private --source=. --remote=origin
```

### 步驟 7: 連接遠端倉庫

```bash
# 如果在 GitHub 創建了新倉庫，複製倉庫 URL
# 例如: https://github.com/YOUR-USERNAME/brothergev-website.git

# 添加遠端倉庫
git remote add origin https://github.com/YOUR-USERNAME/brothergev-website.git

# 確認遠端倉庫
git remote -v
```

### 步驟 8: 推送到 GitHub

```bash
# 首次推送（設置 upstream）
git branch -M main
git push -u origin main
```

如果遇到錯誤，可能需要先拉取：

```bash
git pull origin main --allow-unrelated-histories
git push -u origin main
```

### 步驟 9: 驗證上傳

訪問你的 GitHub 倉庫：
```
https://github.com/YOUR-USERNAME/brothergev-website
```

**應該看到：**
- ✅ `netlify/functions/ask.js`
- ✅ `public/index.html`
- ✅ `package.json`
- ✅ `netlify.toml`
- ✅ `README.md`
- ✅ `.gitignore`

**不應該看到：**
- ❌ `.env` 文件
- ❌ 任何 `.json` 憑證文件
- ❌ `node_modules/` 文件夾

---

## 📦 Netlify 自動部署設置

### 步驟 1: 連接 GitHub

1. 訪問：https://app.netlify.com
2. 點擊 "Add new site" → "Import an existing project"
3. 選擇 "GitHub"
4. 授權 Netlify 訪問你的 GitHub
5. 選擇 `brothergev-website` 倉庫

### 步驟 2: 配置構建設置

- **Branch to deploy**: `main`
- **Build command**: `echo "No build required"`
- **Publish directory**: `public`
- **Functions directory**: `netlify/functions`

### 步驟 3: 設置環境變量

**非常重要！必須設置這兩個：**

1. **GOOGLE_APPLICATION_CREDENTIALS_JSON**
   - 值：完整的 Google Cloud 服務帳號 JSON（複製整個 JSON）

2. **GOOGLE_OAUTH_CLIENT_ID**
   - 值：`234402937661-fq9fi4m3f0ak4salr8gvpg309v291kbl.apps.googleusercontent.com`

### 步驟 4: 部署

點擊 "Deploy site"，Netlify 會自動：
1. 從 GitHub 拉取代碼
2. 安裝依賴
3. 部署函數
4. 部署網站

### 步驟 5: 測試

部署完成後，測試 API：

```bash
curl https://YOUR-SITE.netlify.app/.netlify/functions/ask
```

應該看到：
```json
{
  "status": "healthy",
  "version": "V29.0"
}
```

---

## 🔄 後續更新流程

當你修改代碼後：

```bash
# 1. 添加更改
git add .

# 2. 提交
git commit -m "描述你的更改"

# 3. 推送
git push origin main
```

Netlify 會自動檢測到 GitHub 的更新並重新部署！

---

## ⚠️ 重要安全提示

### 絕對不要上傳到 GitHub 的文件：

1. **環境變量文件**
   - ❌ `.env`
   - ❌ `.env.local`
   - ❌ `.env.production`

2. **Google 憑證文件**
   - ❌ `credentials.json`
   - ❌ `serviceAccount.json`
   - ❌ 任何包含 `private_key` 的 JSON 文件

3. **API 密鑰**
   - ❌ 任何硬編碼的 API 密鑰
   - ❌ 任何 token 或密碼

### 如果不小心上傳了敏感文件：

1. **立即**從 GitHub 刪除
2. **立即**撤銷該憑證/密鑰
3. 生成新的憑證
4. 使用 `git filter-branch` 清除歷史記錄

```bash
# 從 Git 歷史中移除文件
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch 敏感文件名" \
  --prune-empty --tag-name-filter cat -- --all

# 強制推送
git push origin --force --all
```

---

## 🐛 常見問題

### 問題 1: git push 失敗

**錯誤**：`! [rejected] main -> main (fetch first)`

**解決**：
```bash
git pull origin main --rebase
git push origin main
```

### 問題 2: 找不到遠端倉庫

**錯誤**：`fatal: 'origin' does not appear to be a git repository`

**解決**：
```bash
git remote add origin https://github.com/YOUR-USERNAME/brothergev-website.git
```

### 問題 3: 認證失敗

**錯誤**：`Authentication failed`

**解決**：
使用 Personal Access Token (PAT) 代替密碼：
1. 訪問：https://github.com/settings/tokens
2. 生成新的 token
3. 使用 token 作為密碼

---

## 📚 參考資源

- [Git 官方文檔](https://git-scm.com/doc)
- [GitHub 快速入門](https://docs.github.com/en/get-started/quickstart)
- [Netlify 部署文檔](https://docs.netlify.com/)

---

**版本**: V29.0  
**最後更新**: 2025-11-06  
**狀態**: ✅ 準備部署
