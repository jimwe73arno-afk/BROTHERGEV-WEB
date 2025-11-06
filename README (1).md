# Brother G EV - V29.0 最終版

## 🚀 項目概述

Brother G EV 是一個專業的 Tesla 決策顧問平台，使用 Google OAuth + Vertex AI (Gemini) + RAG 知識庫。

**版本**: V29.0 最終修復版  
**部署**: Netlify Functions  
**認證**: Google OAuth 2.0  
**AI**: Google Vertex AI (Gemini 1.5 Flash)

---

## 📦 項目結構

```
brothergev-website/
├── netlify/
│   └── functions/
│       └── ask.js              # V29.0 修復版 API
├── public/
│   └── index.html              # 前端（已配置 Google OAuth）
├── package.json                # 依賴配置
├── netlify.toml               # Netlify 配置
├── .gitignore                 # Git 忽略文件
└── README.md                  # 本文件
```

---

## 🔑 環境變量設置

### Netlify 環境變量（必須設置）

訪問：https://app.netlify.com/sites/YOUR-SITE-NAME/configuration/env

**必須添加以下變量：**

1. **GOOGLE_APPLICATION_CREDENTIALS_JSON**
   - 用途：Vertex AI (Gemini) 認證
   - 格式：完整的 Google Cloud 服務帳號 JSON
   - 範例：
   ```json
   {
     "type": "service_account",
     "project_id": "brothergev-mvp-477006",
     "private_key_id": "...",
     "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
     "client_email": "...@brothergev-mvp-477006.iam.gserviceaccount.com"
   }
   ```

2. **GOOGLE_OAUTH_CLIENT_ID**
   - 用途：Google OAuth 登入驗證
   - 值：`234402937661-fq9fi4m3f0ak4salr8gvpg309v291kbl.apps.googleusercontent.com`

---

## 🚀 部署步驟

### 步驟 1: 克隆項目（如果是新機器）

```bash
git clone https://github.com/YOUR-USERNAME/brothergev-website.git
cd brothergev-website
```

### 步驟 2: 安裝依賴

```bash
npm install
```

**必需依賴：**
- `@google-cloud/vertexai`
- `google-auth-library`
- `csv-parse`

### 步驟 3: 本地測試（可選）

```bash
netlify dev
```

訪問：http://localhost:8888

### 步驟 4: 部署到 Netlify

```bash
netlify deploy --prod
```

或者通過 Git 推送自動部署：

```bash
git add .
git commit -m "Deploy V29.0"
git push origin main
```

---

## ✅ 驗證部署

### 1. API 健康檢查

```bash
curl https://YOUR-SITE.netlify.app/.netlify/functions/ask
```

**期望輸出：**
```json
{
  "status": "healthy",
  "version": "V29.0",
  "message": "Brother G EV API - 最終修復版",
  "rag_loaded": 8,
  "vertex_ai_ready": true
}
```

### 2. 網站訪問測試

訪問：https://YOUR-SITE.netlify.app

**檢查清單：**
- ✅ 看到 Google 登入畫面
- ✅ 可以成功登入
- ✅ 登入後顯示對話界面
- ✅ 可以發送問題並收到回答
- ✅ 回答是自然對話（不是 CSV 格式）

---

## 🐛 故障排除

### 問題 1: API 返回 undefined

**症狀：** API 調用失敗，返回 undefined

**解決方案：**
1. 檢查 Netlify 函數日誌
2. 確認環境變量已正確設置
3. 確認 `GOOGLE_APPLICATION_CREDENTIALS_JSON` 格式正確

### 問題 2: Google 登入失敗

**症狀：** 點擊登入按鈕無反應

**解決方案：**
1. 檢查 `public/index.html` 中的 `GOOGLE_CLIENT_ID`
2. 確認 Google Console 中的授權來源設置正確
3. 清除瀏覽器緩存

### 問題 3: Vertex AI 調用失敗

**症狀：** API 返回 "Vertex AI 未初始化"

**解決方案：**
1. 確認 `GOOGLE_APPLICATION_CREDENTIALS_JSON` 已設置
2. 確認服務帳號有 Vertex AI 權限
3. 檢查 Google Cloud 項目配額

---

## 📊 功能特性

### V29.0 核心功能

1. **Google OAuth 強制登入** (V28.0)
   - 用戶必須登入才能使用
   - 為未來額度控制做準備

2. **RAG 知識庫** (V26.0)
   - 8 條核心 Tesla 決策 SOP
   - 關鍵詞匹配查詢
   - RAG-MISS 學習迴圈

3. **雙 Prompt 系統** (V12.0 + V27.0)
   - RAG 命中：V12 決策閉環
   - RAG 未命中：V27 情感上癮

4. **對話歷史** (V27.0)
   - 保存最近 3 輪對話
   - 上下文理解
   - 情感連續性

5. **完整錯誤處理** (V29.0)
   - 層層檢查
   - 詳細日誌
   - 友好降級

---

## 📞 聯繫方式

- **客戶**: 藍教主
- **郵箱**: jimwearno@brotherg.net
- **網站**: https://brothergev.com
- **Netlify**: https://boisterous-duckanoo-52af4a.netlify.app

---

## 📝 更新日誌

### V29.0 (2025-11-06)
- ✅ 修復 API undefined 錯誤
- ✅ 加入完整錯誤處理和日誌
- ✅ 內嵌 RAG 知識庫（不依賴 CSV 文件）
- ✅ 強化 Vertex AI 調用邏輯
- ✅ 修復客戶端 ID 配置

### V28.0 (2025-11-06)
- ✅ 加入 Google OAuth 強制登入
- ✅ 修復 CSV 直接返回 Bug

### V27.0 (2025-11-05)
- ✅ 加入對話歷史功能
- ✅ 實現情感上癮 Prompt

### V26.0 (2025-11-05)
- ✅ RAG-MISS 學習迴圈
- ✅ 知識庫優化

---

**版本**: V29.0  
**狀態**: ✅ 生產就緒  
**最後更新**: 2025-11-06
