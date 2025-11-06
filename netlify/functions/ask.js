// Brother G EV - V32.0 API (純 Gemini API + CSV RAG)
// 文件位置: netlify/functions/ask.js (扁平化路徑)

import { GoogleGenerativeAI } from '@google/generative-ai';
import { OAuth2Client } from 'google-auth-library';
import { parse } from 'csv-parse/sync';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('[V32.0] 🚀 Brother G EV API 啟動 - 純 Gemini 模式');

// ==================== Google OAuth ====================
const CLIENT_ID = "234402937661-fq9fi4m3f0ak4salr8gvpg309v291kbl.apps.googleusercontent.com";
const authClient = new OAuth2Client(CLIENT_ID);

async function verifyToken(authHeader) {
    if (!authHeader) {
        throw new Error("缺少 Authorization 標頭");
    }
    
    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        throw new Error("Authorization 格式錯誤");
    }
    
    try {
        const ticket = await authClient.verifyIdToken({
            idToken: parts[1],
            audience: CLIENT_ID,
        });
        const payload = ticket.getPayload();
        console.log(`[V32.0] ✅ 用戶: ${payload.email}`);
        return { userid: payload.sub, email: payload.email };
    } catch (error) {
        throw new Error(`身份驗證失敗: ${error.message}`);
    }
}

// ==================== Gemini API 初始化 ====================
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
    console.error('[V32.0] ❌ 缺少 GEMINI_API_KEY 環境變量');
}

let genAI, model;
try {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    model = genAI.getGenerativeModel({ 
        model: 'gemini-1.5-flash',
        generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 1024,
        }
    });
    console.log('[V32.0] ✅ Gemini API 初始化成功');
} catch (error) {
    console.error('[V32.0] ❌ Gemini 初始化失敗:', error);
}

// ==================== 載入 RAG 知識庫 (snippets.csv) ====================
let ragKnowledge = [];

function loadCSV() {
    try {
        // 嘗試多個可能的路徑
        const possiblePaths = [
            path.join(__dirname, 'snippets.csv'),
            path.join(__dirname, '..', 'snippets.csv'),
            path.join(process.cwd(), 'snippets.csv'),
            path.join(process.cwd(), 'netlify', 'functions', 'snippets.csv'),
        ];

        let csvContent = null;
        let usedPath = null;

        for (const testPath of possiblePaths) {
            try {
                if (fs.existsSync(testPath)) {
                    csvContent = fs.readFileSync(testPath, 'utf-8');
                    usedPath = testPath;
                    break;
                }
            } catch (e) {
                continue;
            }
        }

        if (csvContent) {
            ragKnowledge = parse(csvContent, {
                columns: true,
                skip_empty_lines: true,
                trim: true,
            });
            console.log(`[V32.0] ✅ RAG 載入成功: ${ragKnowledge.length} 條知識`);
            console.log(`[V32.0] 📁 CSV 路徑: ${usedPath}`);
        } else {
            console.log('[V32.0] ⚠️ 未找到 snippets.csv');
        }
    } catch (error) {
        console.error('[V32.0] ❌ RAG 載入失敗:', error);
    }
}

loadCSV();

// ==================== RAG 搜尋引擎 ====================
function searchRAG(query) {
    if (!ragKnowledge || ragKnowledge.length === 0) {
        console.log('[V32.0] ⚠️ RAG 知識庫為空');
        return null;
    }

    const lowerQuery = query.toLowerCase().trim();
    console.log(`[V32.0] 🔍 搜尋: "${lowerQuery}"`);

    // 搜尋匹配
    for (const item of ragKnowledge) {
        const question = (item.q || '').toLowerCase();
        
        // 完全匹配或部分匹配
        if (question.includes(lowerQuery) || lowerQuery.includes(question)) {
            console.log(`[V32.0] ✅ RAG 命中: "${item.q}"`);
            return item.answer;
        }

        // 關鍵字匹配
        const keywords = question.split(/[\s,，、]+/);
        for (const keyword of keywords) {
            if (keyword.length >= 2 && lowerQuery.includes(keyword)) {
                console.log(`[V32.0] ✅ RAG 命中 (關鍵字: "${keyword}")`);
                return item.answer;
            }
        }
    }

    console.log('[V32.0] ❌ RAG 未命中');
    return null;
}

// ==================== Prompt 構建 (全中文四段式) ====================
function buildPrompt(query, ragAnswer, history = []) {
    // 判斷是否為中文查詢
    const hasChinese = /[\u4e00-\u9fa5]/.test(query);
    
    // 構建歷史記錄
    const historyText = history.length > 0 
        ? `\n[對話歷史]：\n${history.slice(-3).map(h => `${h.role}: ${h.content}`).join('\n')}\n`
        : '';

    if (ragAnswer) {
        // 情境 A: RAG 命中 - 決策閉環
        console.log('[V32.0] 📋 使用「決策閉環」Prompt');
        
        return `你是 BrotherG（藍教主），專業的 Tesla 電動車決策顧問。你的回答風格：自信、有同理心、像朋友聊天。

【用戶問題】：「${query}」

【專家知識】：
${ragAnswer}

【對話脈絡】：${historyText}

【你的任務】：
1. **用中文四段式回答**（必須嚴格遵守）：
   • 【結論】：直接給出明確建議（1-2 句話）
   • 【依據】：說明為什麼這樣建議（2-3 個關鍵點）
   • 【風險】：誠實告知可能的問題或注意事項
   • 【行動】：給出具體的下一步建議

2. **語氣要求**：
   • 像朋友聊天，不要太正式
   • 保持自信但不傲慢
   • 用「你」而不是「您」
   • 可以用表情符號（✅ ❌ 💡 等）

3. **禁止事項**：
   • ❌ 不要直接照抄專家知識
   • ❌ 不要用英文回答
   • ❌ 不要用「客服口吻」
   • ❌ 不要說「Thank you」之類的英文

4. **結尾**：自然引導用戶繼續提問

【你的回答】：`;
    } else {
        // 情境 B: RAG 未命中 - 情感上癮 + 反問卡
        console.log('[V32.0] 💫 使用「情感上癮」Prompt');

        // 檢查是否為無效問題（短字、測試）
        if (query.length < 3 || /^[0-9?？!！.。\s]+$/.test(query)) {
            return `用戶輸入了一個無效或測試性的問題：「${query}」

你是 BrotherG，專業的 Tesla 決策顧問。請用**中文四段式**回應，並引導用戶提供更多信息：

【結論】：我需要更了解你的情況才能給出精準建議！

【依據】：Tesla 購車決策需要考慮：
• 預算範圍（全款還是貸款？）
• 使用場景（通勤、家用、商務？）
• 充電條件（有無固定車位？）

【風險】：不了解你的需求就盲目推薦，可能讓你買錯車型或後悔。

【行動】：請告訴我這三件事：
1. 你的預算大概多少？
2. 主要用在什麼場景？
3. 有固定停車位可以裝充電樁嗎？

【你的回答】：`;
        }

        return `你是 BrotherG（藍教主），專業的 Tesla 決策顧問。

【用戶問題】：「${query}」

【對話脈絡】：${historyText}

【當前情況】：這個問題不在你的專業知識庫中，但你仍要展現專業。

【你的任務】：
1. **用中文四段式回答**：
   • 【結論】：基於 Tesla 和電動車的通用知識給建議
   • 【依據】：說明你的判斷邏輯
   • 【風險】：誠實指出你可能不夠專業的地方
   • 【行動】：給出實際可操作的建議

2. **語氣要求**：
   • 保持自信但誠實
   • 承認不確定，但給出方向
   • 像朋友聊天，不要太客套
   • 必須用中文，絕對不要英文

3. **結尾策略**：
   • 引導用戶問你更熟悉的問題
   • 或建議他們尋求其他資源

【你的回答】：`;
    }
}

// ==================== Netlify Function Handler ====================
export default async (req, context) => {
    console.log('\n========== [V32.0] 新請求 ==========');
    
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // CORS 預檢
    if (req.method === 'OPTIONS') {
        return new Response('OK', { status: 200, headers: corsHeaders });
    }

    const headers = { 'Content-Type': 'application/json', ...corsHeaders };

    try {
        // ==================== GET: 健康檢查 ====================
        if (req.method === 'GET') {
            return new Response(JSON.stringify({
                status: 'healthy',
                version: 'V32.0',
                mode: 'Pure Gemini API (No Vertex AI)',
                timestamp: new Date().toISOString(),
                rag_loaded: ragKnowledge.length,
                gemini_ready: !!model,
            }), { status: 200, headers });
        }

        // ==================== POST: 處理問題 ====================
        if (req.method !== 'POST') {
            throw new Error('只支援 POST 請求');
        }

        // 驗證用戶
        console.log('[V32.0] 🔐 驗證用戶...');
        let userData;
        try {
            userData = await verifyToken(req.headers.get('authorization'));
        } catch (authError) {
            console.error('[V32.0] ❌ 認證失敗:', authError.message);
            return new Response(JSON.stringify({
                status: 'error',
                message: `身份驗證失敗: ${authError.message}`,
            }), { status: 401, headers });
        }

        // 解析請求
        const body = await req.json();
        const { q: query, history = [] } = body;

        if (!query) {
            return new Response(JSON.stringify({
                status: 'error',
                message: '缺少問題參數 (q)',
            }), { status: 400, headers });
        }

        console.log(`[V32.0] ❓ 問題: "${query}"`);
        console.log(`[V32.0] 💬 歷史: ${history.length} 條`);

        // RAG 搜尋
        const ragAnswer = searchRAG(query);
        const ragHit = !!ragAnswer;

        // 構建 Prompt
        const prompt = buildPrompt(query, ragAnswer, history);

        // 調用 Gemini
        console.log('[V32.0] 🤖 調用 Gemini...');
        const startTime = Date.now();
        
        if (!model) {
            throw new Error('Gemini API 未初始化');
        }

        const result = await model.generateContent(prompt);
        const answer = result.response.text();
        
        const latency = Date.now() - startTime;
        console.log(`[V32.0] ✅ Gemini 回應成功 (${latency}ms)`);

        // 返回結果
        return new Response(JSON.stringify({
            status: 'success',
            answer: answer,
            rag_hit: ragHit,
            version: 'V32.0',
            latency_ms: latency,
            user: userData.email,
        }), { status: 200, headers });

    } catch (error) {
        console.error('\n========== [V32.0] 錯誤 ==========');
        console.error('[V32.0] 類型:', error.constructor.name);
        console.error('[V32.0] 訊息:', error.message);
        console.error('[V32.0] 堆疊:', error.stack);
        console.error('====================================\n');

        return new Response(JSON.stringify({
            status: 'error',
            message: error.message || '服務器錯誤',
            version: 'V32.0',
        }), { status: 500, headers });
    }
};
