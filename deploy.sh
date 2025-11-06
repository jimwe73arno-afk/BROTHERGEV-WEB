#!/bin/bash

# Brother G EV - V27.0 快速部署腳本

echo "========================================="
echo "Brother G EV - V27.0 部署腳本"
echo "========================================="
echo ""

# 檢查是否在正確的目錄
if [ ! -f "package.json" ]; then
    echo "❌ 錯誤：請在項目根目錄執行此腳本"
    exit 1
fi

# 檢查 Netlify CLI
if ! command -v netlify &> /dev/null; then
    echo "⚠️  Netlify CLI 未安裝"
    echo "正在安裝 Netlify CLI..."
    npm install -g netlify-cli
fi

echo "✅ Netlify CLI 已安裝"
echo ""

# 安裝依賴
echo "📦 安裝項目依賴..."
npm install
echo "✅ 依賴安裝完成"
echo ""

# 檢查環境變量
echo "🔍 檢查環境變量..."
echo "請確認已在 Netlify 控制台設置："
echo "https://app.netlify.com/sites/boisterous-duckanoo-52af4a/configuration/env"
echo ""
echo "需要的環境變量："
echo "- GOOGLE_APPLICATION_CREDENTIALS_JSON"
echo ""
read -p "已設置環境變量？(y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ 請先設置環境變量，然後重新運行此腳本"
    exit 1
fi

# 部署到 Netlify
echo ""
echo "🚀 開始部署到 Netlify..."
netlify deploy --prod

echo ""
echo "========================================="
echo "✅ 部署完成！"
echo "========================================="
echo ""
echo "測試 API："
echo "curl https://boisterous-duckanoo-52af4a.netlify.app/.netlify/functions/ask"
echo ""
echo "訪問網站："
echo "https://boisterous-duckanoo-52af4a.netlify.app"
echo ""
