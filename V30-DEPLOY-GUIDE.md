# Brother G EV - V30.0 一鍵部署指南

## 🎯 V30.0 修復內容

### ✅ 已修復的問題
1. **API undefined 錯誤** - 完整的錯誤處理，永遠不會返回 undefined
2. **UI 不專業** - 全新設計，參考 anyvoice.net 的專業水準
3. **登入流程混亂** - 強制登入優先，流程清晰
4. **前端 API 調用** - 正確傳送 Token 和歷史記錄

---

## 📦 V30.0 文件清單

```
brothergev-website/
├── public/
│   └── index.html          ← 需要替換為 index-V30.html
├── netlify/
│   └── functions/
│       └── ask.js          ← 需要替換為 ask-V30.js
├── package.json
├── netlify.toml
└── .gitignore
```

---

## 🚀 一鍵部署步驟

### 步驟 1: 下載 V30.0 文件（已完成）

Claude 已經創建了以下文件：
- `index-V30.html` → 新的前端（專業 UI）
- `ask-V30.js` → 新的 API（修復 undefined）

---

### 步驟 2: 複製文件到正確位置

在終端機執行以下命令：

```bash
cd /Users/jimwearno/Desktop/網站智能大腦brothergev-cloudrun-vertex-sop/brothergev-website

# 備份舊文件
cp public/index.html public/index.html.V29.backup
cp netlify/functions/ask.js netlify/functions/ask.js.V29.backup

# 複製 V30.0 文件（假設 Claude 的文件在 Downloads）
cp ~/Downloads/index-V30.html public/index.html
cp ~/Downloads/ask-V30.js netlify/functions/ask.js

# 確認文件已更新
ls -lh public/index.html
ls -lh netlify/functions/ask.js
```

---

### 步驟 3: 提交到 GitHub

```bash
cd /Users/jimwearno/Desktop/網站智能大腦brothergev-cloudrun-vertex-sop/brothergev-website

# 查看變更
git status

# 添加所有變更
git add .

# 提交
git commit -m "V30.0 - 修復 undefined 錯誤 + 專業 UI 設計"

# 推送到 GitHub
git push origin main
```

---

### 步驟 4: Netlify 自動部署

由於你的 Netlify 已經連接到 GitHub，推送後會自動部署。

#### 檢查部署狀態

1. 訪問：https://app.netlify.com/sites/boisterous-duckanoo-52af4a/deploys
2. 等待部署完成（通常 1-2 分鐘）
3. 看到綠色的「Published」就表示成功

---

### 步驟 5: 設置環境變量（如果還沒設置）

1. 進入 Netlify 項目設置
2. Site configuration → Environment variables
3. 添加以下變量：

```
變量名: GOOGLE_APPLICATION_CREDENTIALS_JSON
值: [你的 Google Cloud 服務帳號 JSON，完整內容]

變量名: GOOGLE_OAUTH_CLIENT_ID
值: 234402937661-fq9fi4m3f0ak4salr8gvpg309v291kbl.apps.googleusercontent.com
```

4. 保存後，點擊「Trigger deploy」重新部署

---

### 步驟 6: 測試

#### 測試 1: API 健康檢查

訪問：
```
https://boisterous-duckanoo-52af4a.netlify.app/.netlify/functions/ask
```

應該看到：
```json
{
  "status": "error",
  "message": "身份驗證失敗: 缺少 Authorization 標頭"
}
```

（這是正常的，因為沒有提供 Token）

#### 測試 2: 前端登入

1. 訪問：https://boisterous-duckanoo-52af4a.netlify.app
2. 應該看到全新的專業登入頁面
3. 點擊「使用 Google 帳號登入」
4. 登入後應該看到主應用界面
5. 嘗試問一個問題（例如：「Model 3 和 Model Y 該選哪一台？」）
6. 應該看到 Brother G 的回答，**不會是 undefined**

---

## ✅ 成功標準

完成後，你應該看到：

1. ✅ **登入頁面**：專業、美觀、有「五大疑問」
2. ✅ **對話界面**：像 anyvoice.net 一樣專業
3. ✅ **API 回應**：自然的對話內容，**不是** CSV 格式
4. ✅ **無錯誤**：不會看到「抱歉，發生錯誤：undefined」

---

## 🐛 故障排除

### 問題 1: 仍然看到 undefined

**檢查**：
1. 確認 `ask-V30.js` 已經正確複製到 `netlify/functions/ask.js`
2. 確認 Git 推送成功
3. 確認 Netlify 已重新部署（檢查部署時間）
4. 查看 Netlify 函數日誌：https://app.netlify.com/sites/boisterous-duckanoo-52af4a/functions

### 問題 2: Google 登入失敗

**檢查**：
1. 確認客戶端 ID 正確
2. 確認 Netlify 域名在 Google Cloud Console 的授權來源中
3. 清除瀏覽器緩存和 Cookie

### 問題 3: Vertex AI 錯誤

**檢查**：
1. 確認環境變量 `GOOGLE_APPLICATION_CREDENTIALS_JSON` 已設置
2. 確認服務帳號有 Vertex AI 權限
3. 查看 Netlify 函數日誌

---

## 📞 需要幫助？

如果遇到問題：
1. 截圖錯誤訊息
2. 複製 Netlify 函數日誌
3. 上傳這個文檔給 Claude，說明問題

---

**V30.0 必勝！** 🚀
