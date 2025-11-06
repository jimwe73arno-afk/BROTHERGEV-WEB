import { VertexAI } from '@google-cloud/vertexai';
import { parse } from 'csv-parse/sync';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ==================== V29.0 深度調試初始化 ====================
console.log('[V29.0] 🔧 開始初始化 API 函數...');

// 解決 __dirname 在 ES modules 中的問題
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==================== 1. Google 認證初始化 ====================
const CLIENT_ID = "234402937661-fq9fi4m3f0ak4salr8gvpg309v291kbl.apps.googleusercontent.com";
console.log('[V29.0] 🔑 初始化 Google OAuth 客戶端...');

import { OAuth2Client } from 'google-auth-library';
const authClient = new OAuth2Client(CLIENT_ID);

async function verifyToken(authHeader) {
    console.log('[V29.0] 🔐 開始驗證令牌...');
    if (!authHeader) {
        throw new Error("缺少 Authorization 標頭");
    }
    
    const token = authHeader.split(" ")[1];
    if (!token) {
        throw new Error("Authorization 標頭格式錯誤");
    }

    console.log('[V29.0] 🔑 驗證 ID Token...');
    const ticket = await authClient.verifyIdToken({
        idToken: token,
        audience: CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    const userid = payload['sub'];
    const email = payload['email'];
    console.log(`[V29.0] ✅ 用戶 ${email} (ID: ${userid}) 驗證成功`);
    return { userid, email };
}

// ==================== 2. Vertex AI 初始化 ====================
console.log('[V29.0] 🤖 初始化 Vertex AI...');

let vertexAI;
let generativeModel;

try {
    // 從環境變量獲取憑證
    const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
    if (!credentialsJson) {
        throw new Error('GOOGLE_APPLICATION_CREDENTIALS_JSON 環境變量未設置');
    }

    const credentials = JSON.parse(credentialsJson);
    console.log('[V29.0] ✅ 成功解析 Google 憑證');

    vertexAI = new VertexAI({
        project: 'brothergev-mvp-477006',
        location: 'us-central1',
        credentials: credentials
    });

    generativeModel = vertexAI.preview.getGenerativeModel({
        model: 'gemini-1.5-flash',
        generationConfig: {
            maxOutputTokens: 1024,
            temperature: 0.8,
        },
    });

    console.log('[V29.0] ✅ Vertex AI 初始化成功');
} catch (vertexError) {
    console.error('[V29.0] ❌ Vertex AI 初始化失敗:', vertexError);
    throw vertexError;
}

// ==================== 3. RAG 知識庫（內嵌版本）====================
console.log('[V29.0] 📚 加載 RAG 知識庫...');

const knowledgeBase = [
    {
        Questions: "insurance cost,保險費用,insurance",
        Answers: "Tesla insurance costs 15-30% higher than gas cars. Basis: Higher repair costs for aluminum body and advanced sensors. Risk: First year premiums highest. Action: Get multiple quotes, consider Tesla Insurance."
    },
    {
        Questions: "model 3 vs model y,model y vs model 3,modelx,modely,選哪一台",
        Answers: "Model 3 for enjoyment, Model Y for family. Basis: Model 3 sportier and more affordable, Model Y offers more cargo space. Risk: Wrong choice affects daily satisfaction. Action: Test drive both models."
    },
    {
        Questions: "charging,充電,home charging,充電費用",
        Answers: "Home charging (Level 2) costs $7-12 per full charge, takes 8-10 hours. Supercharging costs more but faster. Action: Install home charger first, use Supercharger for road trips."
    },
    {
        Questions: "winter,冬天,cold,range loss,續航",
        Answers: "Expect 20-40% range loss in extreme cold due to battery chemistry and heating. Risk: Range anxiety in winter. Action: Plan charging stops more frequently, precondition battery."
    },
    {
        Questions: "maintenance,保養,service,維修",
        Answers: "EVs need minimal maintenance: tire rotation every 10k miles, cabin air filter yearly, brake fluid every 2 years. No oil changes. Annual cost: $300-500 vs $1200+ for gas cars."
    },
    {
        Questions: "home charger,wall connector,安裝,充電樁",
        Answers: "Wall Connector costs $500 + $500-1500 installation. Requires 240V outlet and 60-amp breaker. Takes 1-2 days. Action: Get electrician quotes, check local rebates."
    },
    {
        Questions: "autopilot,fsd,自動駕駛",
        Answers: "Autopilot (free): Basic cruise control and lane keeping. FSD ($8k-12k): Navigate on Autopilot, auto lane change, summon. Action: Try Autopilot first, subscribe to FSD monthly ($99) to test."
    },
    {
        Questions: "resale,二手,depreciation,轉手,resale value",
        Answers: "Teslas hold value better than most EVs but worse than gas luxury cars. 3-year retention: 55-65%. Action: Buy for long-term ownership (5+ years) or lease."
    }
];

console.log(`[V29.0] ✅ RAG 知識庫加載成功，共 ${knowledgeBase.length} 條記錄`);

// ==================== 4. RAG 查詢函數 ====================
function findBestMatch(query) {
    console.log(`[V29.0] 🔎 RAG 查詢: "${query}"`);
    
    if (!knowledgeBase || knowledgeBase.length === 0) {
        console.log('[V29.0] ⚠️ RAG 知識庫為空');
        return null;
    }

    const lowerQuery = query.toLowerCase().trim();

    // 精確匹配
    for (const item of knowledgeBase) {
        if (!item.Questions || !item.Answers) continue;
        
        const keywords = item.Questions.toLowerCase().split(',').map(k => k.trim());
        
        for (const keyword of keywords) {
            if (lowerQuery.includes(keyword) || keyword.includes(lowerQuery)) {
                console.log(`[V29.0] ✅ RAG 命中: "${keyword}"`);
                return item.Answers;
            }
        }
    }

    console.log(`[V26.0 RAG-MISS]: "${query}"`);
    return null;
}

// ==================== 5. 決策引擎 Prompt 構建 ====================
function buildPrompt(query, expertAnswer, history = []) {
    console.log(`[V29.0] 🧠 構建 Prompt`);
    
    const isChinese = /[\u4e00-\u9fff]/.test(query);

    if (expertAnswer) {
        // V12 決策閉環
        console.log('[V29.0] 🎯 使用 V12 決策閉環 Prompt');
        
        return `[角色]：你是 BrotherG（藍教主），專業、高情商的 Tesla 決策顧問。

[用戶問題]：「${query}」
[專家答案]：「${expertAnswer}」

[要求]：
1. 絕對禁止直接複製專家答案的原文
2. 用「BrotherG 決策腔」重新包裝：自信、有同理心、像朋友聊天
3. 用簡潔的2-3句話回答（最多80字）
4. 結尾自然引導用戶繼續提問
5. 必須使用繁體中文

[你的回答]：`;
    } else {
        // V27 情感上癮
        console.log('[V29.0] 💫 使用 V27 情感上癮 Prompt');
        
        const historyContext = history.length > 0 
            ? `\n[對話歷史]:\n${history.slice(-3).map(msg => `${msg.role}: ${msg.parts}`).join('\n')}\n`
            : '\n[這是第一個問題]\n';

        return `[角色]：你是 BrotherG（藍教主），聰明、理解、懂你的 Tesla 決策夥伴。
${historyContext}
[用戶最新問題]：「${query}」

[要求]：
1. 分析對話上下文，理解用戶的潛台詞和焦慮點
2. 用高情商方式回覆，提供情緒價值
3. 用簡潔的2-3句話回答（最多80字）
4. 用開放性問題結尾，引導繼續對話
5. 必須使用繁體中文

[你的回答]：`;
    }
}

// ==================== 6. Netlify 函數主處理器 ====================
export default async (req, context) => {
    console.log('[V29.0] 🚀 API 函數開始執行');
    
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    };

    if (req.method === 'OPTIONS') {
        return new Response('OK', { headers: corsHeaders });
    }

    const headers = {
        'Content-Type': 'application/json',
        ...corsHeaders
    };

    try {
        // 健康檢查
        if (req.method === 'GET') {
            return new Response(
                JSON.stringify({
                    status: 'healthy',
                    version: 'V29.0',
                    message: 'Brother G EV API - 最終修復版',
                    timestamp: new Date().toISOString(),
                    rag_loaded: knowledgeBase.length,
                    vertex_ai_ready: !!generativeModel
                }),
                { headers }
            );
        }

        // 認證驗證
        console.log('[V29.0] 🔐 開始用戶認證...');
        let userData;
        try {
            userData = await verifyToken(req.headers.get('authorization'));
        } catch (authError) {
            console.error('[V29.0] ❌ 認證失敗:', authError.message);
            return new Response(
                JSON.stringify({ 
                    status: 'error', 
                    message: '認證失敗: ' + authError.message,
                    needLogin: true
                }),
                { status: 401, headers }
            );
        }

        // 解析請求
        let body;
        try {
            body = await req.json();
        } catch (parseError) {
            return new Response(
                JSON.stringify({ 
                    status: 'error', 
                    message: '無效的 JSON 請求'
                }),
                { status: 400, headers }
            );
        }

        const { q: query, history = [] } = body;
        
        if (!query || query.trim().length === 0) {
            return new Response(
                JSON.stringify({ 
                    status: 'error', 
                    message: '問題不能為空'
                }),
                { status: 400, headers }
            );
        }

        console.log(`[V29.0] ❓ 用戶 ${userData.email} 提問: "${query}"`);

        // RAG 查詢
        const expertAnswer = findBestMatch(query);
        const ragHit = !!expertAnswer;

        // 構建 Prompt
        const prompt = buildPrompt(query, expertAnswer, history);

        // 調用 Gemini
        console.log('[V29.0] 🤖 調用 Vertex AI Gemini...');
        
        if (!generativeModel) {
            throw new Error('Vertex AI 未初始化');
        }

        const result = await generativeModel.generateContent(prompt);
        
        if (!result.response || !result.response.candidates || result.response.candidates.length === 0) {
            throw new Error('Gemini 返回空響應');
        }

        const answer = result.response.candidates[0].content.parts[0].text;
        console.log(`[V29.0] ✅ 成功生成回答: ${answer.substring(0, 50)}...`);

        // 返回成功
        return new Response(
            JSON.stringify({
                status: 'success',
                answer: answer.trim(),
                rag_hit: ragHit,
                prompt_type: ragHit ? 'V12_決策閉環' : 'V27_情感上癮',
                version: 'V29.0',
                user: userData.email
            }),
            { headers }
        );

    } catch (error) {
        console.error('[V29.0] 💥 全局錯誤:', error.message);
        console.error('[V29.0] 錯誤堆棧:', error.stack);

        return new Response(
            JSON.stringify({ 
                status: 'error', 
                message: error.message || '服務器內部錯誤',
                version: 'V29.0',
                timestamp: new Date().toISOString()
            }),
            { status: 500, headers }
        );
    }
};
