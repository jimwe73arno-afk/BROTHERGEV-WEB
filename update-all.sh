#!/bin/bash
# 完整更新腳本 - 更新後端和前端

echo "=================================="
echo "Brother G EV - 完整更新"
echo "=================================="
echo ""

# 進入目錄
cd /Users/jimwearno/Desktop/網站智能大腦brothergev-cloudrun-vertex-sop/brothergev-website || exit 1

echo "步驟 1: 備份現有文件..."
cp netlify/functions/ask.js netlify/functions/ask.js.backup 2>/dev/null
cp index.html index.html.backup 2>/dev/null
echo "✓ 備份完成"
echo ""

echo "步驟 2: 更新後端 API..."
if [ -f ask-simple.js ]; then
    cp ask-simple.js netlify/functions/ask.js
    echo "✓ 後端已更新"
else
    echo "✗ 找不到 ask-simple.js"
    echo "請先從下載的文件中複製 ask-simple.js 到當前目錄"
    exit 1
fi
echo ""

echo "步驟 3: 更新前端界面..."
if [ -f index-new.html ]; then
    cp index-new.html index.html
    echo "✓ 前端已更新"
else
    echo "⚠ 找不到 index-new.html，跳過前端更新"
fi
echo ""

echo "步驟 4: 部署到 Netlify..."
netlify deploy --prod

echo ""
echo "=================================="
echo "✓ 更新完成！"
echo "=================================="
echo ""
echo "測試命令："
echo "curl https://boisterous-duckanoo-52af4a.netlify.app/.netlify/functions/ask"
echo ""
echo "訪問網站："
echo "https://boisterous-duckanoo-52af4a.netlify.app"
echo ""
echo "⚠ 注意："
echo "1. 清除瀏覽器緩存或使用無痕模式"
echo "2. 等待 2-3 分鐘讓 CDN 更新"
echo "3. 使用 Cmd+Shift+R 強制刷新"
