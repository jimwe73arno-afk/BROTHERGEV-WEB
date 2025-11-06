#!/bin/bash

# Brother G EV - 一鍵部署和測試
# 最簡單的方式完成所有工作

set -e

# 顏色
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

clear

echo -e "${BLUE}"
cat << "EOF"
╔════════════════════════════════════════════════════╗
║                                                    ║
║        Brother G EV - 一鍵部署工具                 ║
║                                                    ║
║        捨棄 Cloud Run，全面 Netlify               ║
║        無需 Token | 零維護 | 秒級響應             ║
║                                                    ║
╚════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"
echo ""

# 設置變量
WEBSITE_DIR="/Users/jimwearno/Desktop/網站智能大腦brothergev-cloudrun-vertex-sop/brothergev-website"
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# 步驟 1: 進入目錄
echo -e "${BLUE}📂 進入網站目錄...${NC}"
cd "$WEBSITE_DIR"
echo ""

# 步驟 2: 創建備份
echo -e "${BLUE}💾 備份現有函數...${NC}"
if [ -f "netlify/functions/ask.js" ]; then
    cp netlify/functions/ask.js "netlify/functions/ask.js.backup.$(date +%Y%m%d_%H%M%S)"
    echo -e "${GREEN}✅ 已備份${NC}"
else
    echo -e "${YELLOW}⚠️  未找到現有函數${NC}"
fi
echo ""

# 步驟 3: 複製新函數
echo -e "${BLUE}📝 更新函數代碼...${NC}"
if [ -f "$SCRIPT_DIR/ask-simple.js" ]; then
    cp "$SCRIPT_DIR/ask-simple.js" "netlify/functions/ask.js"
    echo -e "${GREEN}✅ 函數已更新${NC}"
else
    echo -e "${YELLOW}⚠️  請確保 ask-simple.js 在當前目錄${NC}"
    echo "請從下載文件中手動複製 ask-simple.js 到："
    echo "  $WEBSITE_DIR/netlify/functions/ask.js"
    echo ""
    read -p "複製完成後按 Enter 繼續..."
fi
echo ""

# 步驟 4: 簡化 package.json
echo -e "${BLUE}🧹 清理配置...${NC}"
cat > package.json << 'EOF'
{
  "name": "brothergev-website",
  "version": "2.0.0",
  "description": "Brother G EV - Netlify Edition"
}
EOF
echo -e "${GREEN}✅ package.json 已簡化${NC}"

# 刪除不需要的文件
[ -d "node_modules" ] && rm -rf node_modules && echo "✅ 已刪除 node_modules"
[ -f "package-lock.json" ] && rm package-lock.json && echo "✅ 已刪除 package-lock.json"
echo ""

# 步驟 5: 檢查 Netlify CLI
echo -e "${BLUE}🔧 檢查 Netlify CLI...${NC}"
if ! command -v netlify &> /dev/null; then
    echo "正在安裝 Netlify CLI..."
    npm install -g netlify-cli
fi
echo -e "${GREEN}✅ Netlify CLI 就緒${NC}"
echo ""

# 步驟 6: 檢查登錄
echo -e "${BLUE}🔐 檢查登錄狀態...${NC}"
if ! netlify status &> /dev/null; then
    echo "請登錄 Netlify..."
    netlify login
fi
echo -e "${GREEN}✅ 已登錄${NC}"
echo ""

# 步驟 7: 部署
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🚀 開始部署到 Netlify...${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

netlify deploy --prod

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}   ✅ 部署成功！${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    
    # 等待部署生效
    echo "⏳ 等待 5 秒讓部署生效..."
    sleep 5
    
    # 步驟 8: 快速測試
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}🧪 快速測試 API...${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    
    API_URL="https://boisterous-duckanoo-52af4a.netlify.app/.netlify/functions/ask"
    
    # 測試 1: 健康檢查
    echo "測試 1: 健康檢查..."
    response=$(curl -s "$API_URL")
    if echo "$response" | grep -q "healthy"; then
        echo -e "${GREEN}✅ 健康檢查通過${NC}"
    else
        echo -e "${YELLOW}⚠️  健康檢查異常${NC}"
    fi
    echo ""
    
    # 測試 2: 問答測試
    echo "測試 2: Model 3 vs Model Y..."
    response=$(curl -s -X POST "$API_URL" \
        -H "Content-Type: application/json" \
        -d '{"q":"Model 3 vs Model Y"}')
    
    if echo "$response" | grep -q "Model 3 for enjoyment"; then
        echo -e "${GREEN}✅ 問答功能正常${NC}"
        echo ""
        echo "回答預覽:"
        echo "$response" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('answer', '')[:150] + '...')"
    else
        echo -e "${YELLOW}⚠️  問答功能異常${NC}"
        echo "$response"
    fi
    echo ""
    
    # 顯示摘要
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}   🎉 全部完成！${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "🔗 你的網站:"
    echo "   https://boisterous-duckanoo-52af4a.netlify.app"
    echo ""
    echo "📝 API 端點:"
    echo "   $API_URL"
    echo ""
    echo "🧪 完整測試（可選）:"
    echo "   bash test-complete.sh"
    echo ""
    echo "📖 詳細文檔:"
    echo "   NETLIFY-ONLY-GUIDE.md"
    echo ""
    echo -e "${BLUE}💡 系統特點:${NC}"
    echo "   ✅ 無需 Cloud Run（避免認證問題）"
    echo "   ✅ 無需 Token 管理（零維護）"
    echo "   ✅ 完全免費（Netlify 免費額度）"
    echo "   ✅ 全球加速（Netlify CDN）"
    echo "   ✅ 自動擴展（按需求自動調整）"
    echo "   ✅ 英文回答（知識庫預設英文）"
    echo ""
    
else
    echo ""
    echo -e "${RED}❌ 部署失敗${NC}"
    echo "請檢查錯誤消息並重試"
    exit 1
fi
