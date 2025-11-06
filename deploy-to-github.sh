#!/bin/bash

# Brother G EV - V29.0 GitHub 部署腳本
# 使用方法: chmod +x deploy-to-github.sh && ./deploy-to-github.sh

echo "🚀 Brother G EV - V29.0 GitHub 部署腳本"
echo "========================================"
echo ""

# 顏色定義
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 步驟 1: 檢查是否在正確的目錄
echo "📁 檢查項目目錄..."
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ 錯誤: 未找到 package.json，請確認在項目根目錄執行此腳本${NC}"
    exit 1
fi
echo -e "${GREEN}✅ 項目目錄正確${NC}"
echo ""

# 步驟 2: 檢查 Git 狀態
echo "🔍 檢查 Git 狀態..."
if [ ! -d ".git" ]; then
    echo -e "${YELLOW}⚠️  未找到 Git 倉庫，正在初始化...${NC}"
    git init
    echo -e "${GREEN}✅ Git 初始化完成${NC}"
else
    echo -e "${GREEN}✅ Git 倉庫已存在${NC}"
fi
echo ""

# 步驟 3: 複製必要文件
echo "📋 複製必要的配置文件..."

# 複製 .gitignore
if [ ! -f ".gitignore" ]; then
    echo "創建 .gitignore..."
    cat > .gitignore << 'EOF'
# Dependencies
node_modules/
.npm/

# Production
.netlify/
build/
dist/

# Environment Variables
.env
.env.local
.env.production

# Sensitive Files
*.json
!package.json
!package-lock.json

# Logs
*.log

# OS Files
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
EOF
    echo -e "${GREEN}✅ .gitignore 創建完成${NC}"
else
    echo -e "${GREEN}✅ .gitignore 已存在${NC}"
fi
echo ""

# 步驟 4: 檢查遠端倉庫
echo "🔗 檢查 GitHub 遠端倉庫..."
REMOTE_URL=$(git remote get-url origin 2>/dev/null)

if [ -z "$REMOTE_URL" ]; then
    echo -e "${YELLOW}⚠️  未設置遠端倉庫${NC}"
    echo ""
    echo "請輸入你的 GitHub 倉庫 URL (例如: https://github.com/username/repo.git):"
    read -r REPO_URL
    
    if [ -z "$REPO_URL" ]; then
        echo -e "${RED}❌ 未輸入倉庫 URL，退出${NC}"
        exit 1
    fi
    
    git remote add origin "$REPO_URL"
    echo -e "${GREEN}✅ 遠端倉庫設置完成: $REPO_URL${NC}"
else
    echo -e "${GREEN}✅ 遠端倉庫已設置: $REMOTE_URL${NC}"
fi
echo ""

# 步驟 5: 檢查未提交的更改
echo "📝 檢查未提交的更改..."
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}⚠️  發現未提交的更改${NC}"
    echo ""
    git status --short
    echo ""
    echo "是否要提交這些更改? (y/n)"
    read -r COMMIT_CHOICE
    
    if [ "$COMMIT_CHOICE" = "y" ] || [ "$COMMIT_CHOICE" = "Y" ]; then
        # 添加所有更改
        echo "📦 添加文件到 Git..."
        git add .
        echo -e "${GREEN}✅ 文件添加完成${NC}"
        echo ""
        
        # 提交更改
        echo "請輸入提交訊息 (留空則使用默認訊息):"
        read -r COMMIT_MSG
        
        if [ -z "$COMMIT_MSG" ]; then
            COMMIT_MSG="Deploy V29.0 - 修復 API + Google OAuth"
        fi
        
        git commit -m "$COMMIT_MSG"
        echo -e "${GREEN}✅ 提交完成: $COMMIT_MSG${NC}"
    else
        echo -e "${YELLOW}⚠️  跳過提交${NC}"
    fi
else
    echo -e "${GREEN}✅ 沒有未提交的更改${NC}"
fi
echo ""

# 步驟 6: 推送到 GitHub
echo "🚀 推送到 GitHub..."
echo "確定要推送嗎? (y/n)"
read -r PUSH_CHOICE

if [ "$PUSH_CHOICE" = "y" ] || [ "$PUSH_CHOICE" = "Y" ]; then
    # 檢查當前分支
    CURRENT_BRANCH=$(git branch --show-current)
    
    if [ -z "$CURRENT_BRANCH" ]; then
        echo "創建並切換到 main 分支..."
        git checkout -b main
        CURRENT_BRANCH="main"
    fi
    
    echo "正在推送到 $CURRENT_BRANCH 分支..."
    
    # 首次推送需要設置 upstream
    if ! git push -u origin "$CURRENT_BRANCH" 2>/dev/null; then
        echo -e "${YELLOW}⚠️  首次推送，設置 upstream...${NC}"
        git push -u origin "$CURRENT_BRANCH"
    fi
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ 推送成功！${NC}"
    else
        echo -e "${RED}❌ 推送失敗${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️  取消推送${NC}"
    exit 0
fi
echo ""

# 步驟 7: 完成
echo "========================================"
echo -e "${GREEN}🎉 部署完成！${NC}"
echo ""
echo "下一步:"
echo "1. 訪問你的 GitHub 倉庫檢查文件"
echo "2. 在 Netlify 中連接此 GitHub 倉庫"
echo "3. 設置環境變量："
echo "   - GOOGLE_APPLICATION_CREDENTIALS_JSON"
echo "   - GOOGLE_OAUTH_CLIENT_ID"
echo "4. Netlify 會自動部署"
echo ""
echo "Netlify 環境變量設置："
echo "https://app.netlify.com/sites/YOUR-SITE/configuration/env"
echo ""
echo -e "${GREEN}✨ 祝部署順利！${NC}"
