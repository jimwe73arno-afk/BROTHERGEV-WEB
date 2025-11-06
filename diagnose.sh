#!/bin/bash
# 診斷當前狀態

echo "🔍 Brother G EV - 系統診斷"
echo "=================================="
echo ""

API_URL="https://boisterous-duckanoo-52af4a.netlify.app/.netlify/functions/ask"
WEBSITE_DIR="/Users/jimwearno/Desktop/網站智能大腦brothergev-cloudrun-vertex-sop/brothergev-website"

# 1. 檢查目錄
echo "1️⃣ 檢查工作目錄..."
if [ -d "$WEBSITE_DIR" ]; then
    echo "✓ 目錄存在: $WEBSITE_DIR"
    cd "$WEBSITE_DIR" || exit 1
else
    echo "✗ 目錄不存在"
    exit 1
fi
echo ""

# 2. 檢查函數文件
echo "2️⃣ 檢查函數文件..."
if [ -f "netlify/functions/ask.js" ]; then
    echo "✓ 函數文件存在"
    echo ""
    echo "文件開頭："
    head -3 netlify/functions/ask.js
    echo ""
    
    # 檢查版本
    if grep -q "Brother G EV API - Netlify Edition" netlify/functions/ask.js; then
        echo "✓ 使用新版本函數"
    else
        echo "⚠ 可能還在使用舊版本函數"
    fi
else
    echo "✗ 函數文件不存在"
fi
echo ""

# 3. 檢查必需文件
echo "3️⃣ 檢查必需文件..."
FILES=("ask-simple.js" "index.html" "netlify/functions/ask.js")
for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✓ $file"
    else
        echo "✗ $file (缺失)"
    fi
done
echo ""

# 4. 測試 API 健康檢查
echo "4️⃣ 測試 API 健康檢查..."
response=$(curl -s -w "\n%{http_code}" "$API_URL" 2>/dev/null)
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "200" ]; then
    echo "✓ API 響應正常 (200)"
    echo ""
    echo "響應內容："
    echo "$body" | python3 -m json.tool 2>/dev/null || echo "$body"
    echo ""
    
    # 檢查版本
    if echo "$body" | grep -q "Netlify Edition"; then
        echo "✓ 使用新版本 API"
    elif echo "$body" | grep -q "knowledge_entries.*:.*44"; then
        echo "⚠ 還在使用舊版本 API (44 entries)"
    elif echo "$body" | grep -q "knowledge_entries.*:.*15"; then
        echo "✓ 使用新版本 API (15 entries)"
    fi
else
    echo "✗ API 響應錯誤 ($http_code)"
    echo "響應內容: $body"
fi
echo ""

# 5. 測試問答功能
echo "5️⃣ 測試問答功能..."
test_response=$(curl -s -X POST "$API_URL" \
    -H "Content-Type: application/json" \
    -d '{"q":"test"}' 2>/dev/null)

if echo "$test_response" | grep -q "answer"; then
    echo "✓ 問答功能正常"
    echo ""
    echo "測試回答："
    echo "$test_response" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('answer', '')[:100] + '...')" 2>/dev/null || echo "$test_response"
    echo ""
    
    # 檢查語言
    if echo "$test_response" | grep -q "【結論】\|【依據】"; then
        echo "⚠ 回答是中文格式"
    elif echo "$test_response" | grep -q "Conclusion\|Basis"; then
        echo "✓ 回答是英文格式"
    fi
else
    echo "✗ 問答功能異常"
    echo "$test_response"
fi
echo ""

# 6. Netlify 狀態
echo "6️⃣ 檢查 Netlify 狀態..."
netlify status 2>/dev/null || echo "⚠ Netlify CLI 未配置或未登錄"
echo ""

# 總結
echo "=================================="
echo "📊 診斷總結"
echo "=================================="
echo ""
echo "下一步建議："
echo ""

# 根據診斷結果給建議
if grep -q "Brother G EV API - Netlify Edition" netlify/functions/ask.js 2>/dev/null; then
    if echo "$body" | grep -q "Netlify Edition"; then
        echo "✓ 後端已是最新版本"
        echo ""
        echo "如果網站還顯示舊內容："
        echo "1. 清除瀏覽器緩存"
        echo "2. 使用無痕模式測試"
        echo "3. 強制刷新: Cmd+Shift+R"
        echo "4. 等待 5-10 分鐘讓 CDN 更新"
    else
        echo "⚠ 本地文件已更新，但 API 還是舊版"
        echo ""
        echo "解決方案："
        echo "1. 重新部署: netlify deploy --prod"
        echo "2. 等待部署完成"
        echo "3. 清除瀏覽器緩存"
    fi
else
    echo "⚠ 後端函數還是舊版本"
    echo ""
    echo "解決方案："
    echo "1. cp ask-simple.js netlify/functions/ask.js"
    echo "2. netlify deploy --prod"
    echo "3. 等待部署完成並清除緩存"
fi
echo ""
