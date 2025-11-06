#!/bin/bash

# Brother G EV - V27.0 測試腳本

API_URL="https://boisterous-duckanoo-52af4a.netlify.app/.netlify/functions/ask"

echo "========================================="
echo "Brother G EV - V27.0 測試套件"
echo "========================================="
echo ""

# 測試 1: 健康檢查
echo "測試 1: API 健康檢查"
echo "-------------------"
curl -s $API_URL | jq
echo ""
echo ""

# 測試 2: RAG 命中 (V12 決策閉環)
echo "測試 2: RAG 命中 - V12 決策閉環"
echo "-------------------"
echo "問題: Tesla insurance cost"
curl -s -X POST $API_URL \
  -H "Content-Type: application/json" \
  -d '{"q":"Tesla insurance cost"}' | jq
echo ""
echo ""

# 測試 3: RAG 命中 (繁體中文)
echo "測試 3: RAG 命中 - 繁體中文"
echo "-------------------"
echo "問題: Model 3 vs Model Y"
curl -s -X POST $API_URL \
  -H "Content-Type: application/json" \
  -d '{"q":"Model 3 vs Model Y"}' | jq
echo ""
echo ""

# 測試 4: RAG 未命中 - 無對話歷史
echo "測試 4: RAG 未命中 - 無對話歷史"
echo "-------------------"
echo "問題: 黑色好看還是白色好看？"
curl -s -X POST $API_URL \
  -H "Content-Type: application/json" \
  -d '{"q":"黑色好看還是白色好看？"}' | jq
echo ""
echo ""

# 測試 5: RAG 未命中 - V27 情感上癮（含對話歷史）
echo "測試 5: RAG 未命中 - V27 情感上癮"
echo "-------------------"
echo "問題: 那 P 版的懸吊真的不行嗎？"
echo "對話歷史: 3 條"
curl -s -X POST $API_URL \
  -H "Content-Type: application/json" \
  -d '{
    "q": "那 P 版的懸吊真的不行嗎？",
    "history": [
      {"role": "user", "parts": "Model Y 和 3 怎麼選？"},
      {"role": "model", "parts": "我建議直上 Model Y。因為你提到要載全家出遊，Model Y 的空間真的差很多。"},
      {"role": "user", "parts": "可是 P 版加速很快..."}
    ]
  }' | jq
echo ""
echo ""

echo "========================================="
echo "✅ 測試完成"
echo "========================================="
echo ""
echo "驗證清單："
echo "□ 測試 1: API 版本應為 V27.0"
echo "□ 測試 2-3: rag_hit 應為 true，回答是自然對話（非 CSV 格式）"
echo "□ 測試 4-5: rag_hit 應為 false，回答展現高情商和上下文理解"
echo ""
