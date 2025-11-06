#!/bin/bash

# Netlify Function 完整測試腳本
# 測試所有功能是否正常

# 顏色定義
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# API URL
API_URL="https://boisterous-duckanoo-52af4a.netlify.app/.netlify/functions/ask"

echo -e "${BLUE}"
cat << "EOF"
╔═══════════════════════════════════════╗
║   Brother G EV API 測試工具           ║
║   測試所有功能                        ║
╚═══════════════════════════════════════╝
EOF
echo -e "${NC}"
echo ""

# 測試計數器
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# 測試函數
run_test() {
    local test_name=$1
    local method=$2
    local data=$3
    local expected_status=$4
    local expected_content=$5
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${BLUE}測試 $TOTAL_TESTS: $test_name${NC}"
    echo ""
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$API_URL")
    else
        response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL" \
            -H "Content-Type: application/json" \
            -d "$data")
    fi
    
    # 分離響應體和狀態碼
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    # 顯示響應
    echo "HTTP Status: $http_code"
    echo "Response:"
    echo "$body" | python3 -m json.tool 2>/dev/null || echo "$body"
    echo ""
    
    # 檢查狀態碼
    if [ "$http_code" = "$expected_status" ]; then
        echo -e "${GREEN}✅ 狀態碼正確: $http_code${NC}"
    else
        echo -e "${RED}❌ 狀態碼錯誤: 期望 $expected_status, 實際 $http_code${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        echo ""
        return
    fi
    
    # 檢查內容
    if [ -n "$expected_content" ]; then
        if echo "$body" | grep -q "$expected_content"; then
            echo -e "${GREEN}✅ 內容驗證通過: 包含 '$expected_content'${NC}"
            PASSED_TESTS=$((PASSED_TESTS + 1))
        else
            echo -e "${RED}❌ 內容驗證失敗: 未找到 '$expected_content'${NC}"
            FAILED_TESTS=$((FAILED_TESTS + 1))
        fi
    else
        PASSED_TESTS=$((PASSED_TESTS + 1))
    fi
    
    echo ""
    sleep 1
}

# 開始測試
echo "🚀 開始測試 API..."
echo ""

# 測試 1: 健康檢查 (GET)
run_test "健康檢查 (GET)" "GET" "" "200" "healthy"

# 測試 2: Model 3 vs Model Y
run_test "Model 3 vs Model Y 比較" "POST" '{"q":"Model 3 vs Model Y"}' "200" "Model 3 for enjoyment"

# 測試 3: Tesla 保險費用
run_test "Tesla 保險費用" "POST" '{"q":"Tesla insurance cost"}' "200" "15-30% higher"

# 測試 4: 冬季續航
run_test "冬季續航損失" "POST" '{"q":"Winter range loss"}' "200" "20-40% reduction"

# 測試 5: 家用充電設置
run_test "家用充電設置" "POST" '{"q":"Home charging setup"}' "200" "Level 2 charger"

# 測試 6: 維護成本
run_test "維護成本" "POST" '{"q":"maintenance cost"}' "200" "50% less"

# 測試 7: Autopilot 值得嗎
run_test "Autopilot 功能" "POST" '{"q":"Is autopilot worth it"}' "200" "Autopilot"

# 測試 8: Supercharger 費用
run_test "Supercharger 充電費用" "POST" '{"q":"supercharging cost"}' "200" "0.25"

# 測試 9: 二手車指南
run_test "二手 Tesla 購買指南" "POST" '{"q":"used Tesla guide"}' "200" "battery health"

# 測試 10: 長途旅行可行性
run_test "長途旅行可行性" "POST" '{"q":"road trip"}' "200" "planning"

# 測試 11: 總擁有成本
run_test "總擁有成本" "POST" '{"q":"total ownership cost"}' "200" "luxury gas cars"

# 測試 12: 模糊匹配測試
run_test "模糊匹配 (range)" "POST" '{"q":"how much range"}' "200" "Range varies"

# 測試 13: 模糊匹配測試 2
run_test "模糊匹配 (price)" "POST" '{"q":"how much does it cost"}' "200" "Costs vary"

# 測試 14: 錯誤處理 - 缺少參數
run_test "錯誤處理 - 缺少問題" "POST" '{}' "400" "Missing"

# 測試 15: 錯誤處理 - 無效 JSON
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}測試 $((TOTAL_TESTS + 1)): 錯誤處理 - 無效 JSON${NC}"
echo ""
response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL" \
    -H "Content-Type: application/json" \
    -d "invalid json")
http_code=$(echo "$response" | tail -n1)
if [ "$http_code" = "400" ]; then
    echo -e "${GREEN}✅ 正確處理無效 JSON (400)${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}❌ 未正確處理無效 JSON${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo ""

# 測試 16: OPTIONS 請求 (CORS)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}測試 $((TOTAL_TESTS + 1)): CORS 預檢 (OPTIONS)${NC}"
echo ""
response=$(curl -s -w "\n%{http_code}" -X OPTIONS "$API_URL" \
    -H "Origin: https://example.com" \
    -H "Access-Control-Request-Method: POST")
http_code=$(echo "$response" | tail -n1)
if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✅ CORS 預檢通過 (200)${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}❌ CORS 預檢失敗${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo ""

# 測試結果摘要
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}測試結果摘要${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "總測試數: $TOTAL_TESTS"
echo -e "${GREEN}通過: $PASSED_TESTS${NC}"
if [ $FAILED_TESTS -gt 0 ]; then
    echo -e "${RED}失敗: $FAILED_TESTS${NC}"
else
    echo -e "${GREEN}失敗: $FAILED_TESTS${NC}"
fi
echo ""

# 計算通過率
pass_rate=$(echo "scale=2; $PASSED_TESTS * 100 / $TOTAL_TESTS" | bc)
echo "通過率: ${pass_rate}%"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}   🎉 所有測試通過！API 運行正常${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "✅ 你的 API 已準備就緒"
    echo "✅ 所有功能正常工作"
    echo "✅ 錯誤處理正確"
    echo "✅ CORS 配置正確"
    echo ""
    exit 0
else
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}   ⚠️  部分測試失敗${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "建議："
    echo "1. 檢查 Netlify 部署日誌"
    echo "2. 查看函數執行日誌"
    echo "3. 確認函數代碼正確"
    echo ""
    echo "查看日誌："
    echo "  netlify functions:log ask"
    echo ""
    echo "或訪問："
    echo "  https://app.netlify.com/projects/boisterous-duckanoo-52af4a/logs/functions"
    echo ""
    exit 1
fi
