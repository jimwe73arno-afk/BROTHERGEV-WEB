# ⚡ Brother G EV - 快速 GitHub 部署命令

## 🚀 一鍵複製粘貼（5 分鐘完成）

### 第一次部署（完整流程）

```bash
# 1. 進入項目目錄
cd /Users/jimwearno/Desktop/網站智能大腦brothergev-cloudrun-vertex-sop/brothergev-website

# 2. 複製最新文件
cp /mnt/user-data/outputs/ask-V29-FINAL.js netlify/functions/ask.js
cp /mnt/user-data/outputs/index-READY.html public/index.html
cp /mnt/user-data/outputs/README.md .
cp /mnt/user-data/outputs/.gitignore .

# 3. 檢查文件
ls -la netlify/functions/
ls -la public/

# 4. 初始化 Git（如果還沒有）
git init

# 5. 添加所有文件
git add .

# 6. 查看狀態（確認沒有敏感文件）
git status

# 7. 提交
git commit -m "Deploy V29.0 - 修復 API + Google OAuth"

# 8. 添加遠端倉庫（替換成你的 GitHub URL）
git remote add origin https://github.com/YOUR-USERNAME/brothergev-website.git

# 9. 推送
git branch -M main
git push -u origin main
```

---

### 後續更新（快速流程）

```bash
# 1. 進入目錄
cd /Users/jimwearno/Desktop/網站智能大腦brothergev-cloudrun-vertex-sop/brothergev-website

# 2. 添加更改
git add .

# 3. 提交
git commit -m "Update V29.0"

# 4. 推送
git push origin main
```

---

## 📋 創建 GitHub 倉庫（如果還沒有）

### 選項 A: 網頁創建

1. 訪問：https://github.com/new
2. 倉庫名稱：`brothergev-website`
3. 設為 Private
4. **不要**勾選 "Initialize with README"
5. 創建

### 選項 B: 命令行創建（需要 GitHub CLI）

```bash
# 安裝 GitHub CLI（如果還沒有）
brew install gh

# 登入
gh auth login

# 創建倉庫
gh repo create brothergev-website --private --source=. --remote=origin
```

---

## ✅ 驗證部署

### 1. 檢查 GitHub

訪問：`https://github.com/YOUR-USERNAME/brothergev-website`

**應該看到：**
- ✅ netlify/functions/ask.js
- ✅ public/index.html
- ✅ package.json
- ✅ README.md

**不應該看到：**
- ❌ .env 文件
- ❌ credentials.json
- ❌ node_modules/

### 2. 連接 Netlify

1. 訪問：https://app.netlify.com
2. "Add new site" → "Import from Git"
3. 選擇 GitHub
4. 選擇 `brothergev-website` 倉庫
5. 部署設置：
   - Build command: `echo "No build"`
   - Publish directory: `public`
   - Functions directory: `netlify/functions`

### 3. 設置環境變量

**必須設置：**

```
GOOGLE_APPLICATION_CREDENTIALS_JSON = {完整的JSON}
GOOGLE_OAUTH_CLIENT_ID = 234402937661-fq9fi4m3f0ak4salr8gvpg309v291kbl.apps.googleusercontent.com
```

### 4. 測試 API

```bash
curl https://YOUR-SITE.netlify.app/.netlify/functions/ask
```

**期望輸出：**
```json
{
  "status": "healthy",
  "version": "V29.0"
}
```

---

## 🐛 快速故障排除

### 問題：git push 失敗

```bash
# 解決方案
git pull origin main --rebase
git push origin main
```

### 問題：找不到遠端倉庫

```bash
# 檢查遠端
git remote -v

# 重新添加
git remote remove origin
git remote add origin https://github.com/YOUR-USERNAME/brothergev-website.git
```

### 問題：認證失敗

使用 GitHub Personal Access Token：
1. https://github.com/settings/tokens
2. 生成新 token
3. 複製 token
4. 使用 token 作為密碼

---

## 🔄 自動部署流程

設置完成後，每次更新：

```bash
git add .
git commit -m "你的更新訊息"
git push
```

Netlify 會自動：
1. 檢測 GitHub 更新
2. 拉取最新代碼
3. 重新部署
4. 完成！（2-3 分鐘）

---

## 📞 需要幫助？

詳細指南：[GITHUB-DEPLOY-GUIDE.md](./GITHUB-DEPLOY-GUIDE.md)

---

**版本**: V29.0  
**總時間**: ~5 分鐘  
**難度**: ⭐⭐☆☆☆
