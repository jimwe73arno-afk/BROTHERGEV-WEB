// Brother G EV - V30.0 API (修復 undefined 錯誤)
// 文件位置: netlify/functions/ask.js

import { VertexAI } from '@google-cloud/vertexai';
import { OAuth2Client } from 'google-auth-library';

// ==================== V28.0 Google OAuth 門禁 ====================
const CLIENT_ID = "234402937661-fq9fi4m3f0ak4salr8gvpg309v291kbl.apps.googleusercontent.com";
const authClient = new OAuth2Client(CLIENT_ID);

async function verifyToken(authHeader) {
    console.log('[V30.0] 開始驗證 Token...');
    
    if (!authHeader) {
        throw new Error("[V30.0] 缺少 Authorization 標頭");
    }
    
    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        throw new Error("[V30.0] Authorization 標頭格式錯誤");
    }
    
    const token = parts[1];
    if (!token) {
        throw new Error("[V30.0] Token 為空");
    }

    try {
        const ticket = await authClient.verifyIdToken({
            idToken: token,
            audience: CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const userid = payload['sub'];
        const email = payload['email'];
        console.log(`[V30.0] ✓ 用戶驗證成功: ${email} (ID: ${userid})`);
        return { userid, email };
    } catch (error) {
        console.error('[V30.0] Token 驗證失敗:', error);
        throw new Error(`Token 驗證失敗: ${error.message}`);
    }
}

// ==================== V27.0 RAG 知識庫 ====================
const RAG_KNOWLEDGE_BASE = [
    {
        question: "保險",
        keywords: ["保險", "費用", "保費", "insurance"],
        answer: "Tesla 的保險費用確實比傳統汽車略高，主要原因是維修成本較高（因為很多零件需要從美國進口）。不過，Tesla 車主通常能享受較低的事故率折扣，因為車輛配備先進的主動安全系統。建議您先向保險公司詢價，通常 Model 3 的年保費在 2-3 萬台幣左右，Model Y 則在 2.5-3.5 萬台幣。"
    },
    {
        question: "Model 3 vs Model Y",
        keywords: ["model 3", "model y", "選擇", "比較", "哪一台"],
        answer: "這是最常見的問題！簡單來說：如果你需要更大的載貨空間、更高的視野、或者家裡有小孩需要安全座椅，那 Model Y 是更好的選擇。如果你主要是通勤使用、追求更運動的駕駛感、或預算有限，Model 3 會更適合。兩者在性能和續航上差異不大，主要是空間和舒適性的取捨。"
    },
    {
        question: "充電",
        keywords: ["充電", "充電樁", "超充", "charging", "supercharger"],
        answer: "充電比你想像的方便！台灣目前有超過 50 個 Tesla 超級充電站，涵蓋主要城市和高速公路。一般來說，從 20% 充到 80% 只需要 20-30 分鐘。如果你有自己的停車位，強烈建議安裝家用充電樁（壁掛式充電器），這樣每天晚上充電，白天出門永遠都是滿電狀態。"
    },
    {
        question: "冬天續航",
        keywords: ["冬天", "續航", "掉電", "寒冷", "winter", "range"],
        answer: "這是真實存在的問題。在台灣冬天（15-20度），續航大約會下降 10-15%。如果去更冷的地方（如日本、韓國），續航可能會下降 20-30%。主要原因是電池在低溫下效率降低，加上需要使用暖氣。不過台灣冬天不算太冷，影響相對較小。建議冬天時預留更多充電緩衝時間。"
    },
    {
        question: "保養",
        keywords: ["保養", "維護", "maintenance", "service"],
        answer: "電動車的保養成本遠低於燃油車！Tesla 沒有引擎、變速箱、機油等複雜零件，所以基本上只需要定期更換煞車油、冷卻液、雨刷和輪胎。官方建議每年或每 2 萬公里檢查一次，費用大約 3000-5000 台幣。相比燃油車動輒上萬的保養費，電動車真的省很多。"
    },
    {
        question: "家用充電樁",
        keywords: ["家充", "充電樁安裝", "wall connector", "home charger"],
        answer: "如果有固定停車位，安裝家用充電樁是最划算的選擇！Tesla 的壁掛式充電器（Wall Connector）售價約 2 萬台幣，安裝費用則視你的電力系統而定（通常 1-3 萬台幣）。安裝後，每晚充電成本超低，一度電約 2-3 元，充滿 Model 3 大約只需 100-150 元。相比去外面充電站，長期下來能省下不少錢。"
    },
    {
        question: "FSD 自動駕駛",
        keywords: ["fsd", "自動駕駛", "autopilot", "完全自動駕駛"],
        answer: "FSD（完全自動駕駛能力）目前在台灣售價約 12 萬台幣。老實說，如果你主要在台灣使用，基本版的 Autopilot 已經很夠用了（包含車道維持、自動跟車等）。FSD 的進階功能（如自動變換車道、自動停車等）在台灣的道路環境下，使用頻率不算高。除非你是科技愛好者、或者經常需要長途駕駛，否則建議先不要購買，之後有需要再加購也可以。"
    },
    {
        question: "二手轉手",
        keywords: ["二手", "轉手", "保值", "resale", "二手車"],
        answer: "Tesla 的保值率在電動車中算是很不錯的！由於品牌知名度高、充電網絡完善、軟體持續更新，二手 Tesla 的需求一直很穩定。一般來說，3 年後的 Tesla 大約能保留 60-70% 的價值，這在電動車市場中算是很好的表現。不過要注意的是，電池保固是關鍵因素，買二手車時一定要確認電池健康度和剩餘保固期。"
    }
];

// RAG 搜尋函數
function findBestAnswer(query) {
    console.log(`[V30.0 RAG] 搜尋問題: "${query}"`);
    
    const lowerQuery = query.toLowerCase().trim();
    
    // 完全匹配
    for (const item of RAG_KNOWLEDGE_BASE) {
        for (const keyword of item.keywords) {
            if (lowerQuery.includes(keyword.toLowerCase())) {
                console.log(`[V30.0 RAG] ✓ 命中關鍵字: "${keyword}"`);
                return item.answer;
            }
        }
    }
    
    console.log('[V30.0 RAG] ✗ 未命中，將使用通用 Prompt');
    return null;
}

// ==================== V27.0 Prompt 引擎 ====================
function buildPrompt(query, expertAnswer, history) {
    const historyText = history && history.length > 0 
        ? `\n[對話歷史]：\n${JSON.stringify(history, null, 2)}\n` 
        : '';
    
    if (expertAnswer) {
        // 情境 A: RAG 命中 - 決策閉環
        console.log('[V30.0] 使用「決策閉環」Prompt');
        return `[任務]：你現在扮演 BrotherG（藍教主），一個專業、高情商、懂銷售心理學的 Tesla 決策顧問。

[用戶問題]：「${query}」

[專家答案]：「${expertAnswer}」
${historyText}
[你的要求]：
1. **禁止**直接照抄「專家答案」
2. 你必須用「BrotherG 決策腔」（自信、有同理心、像朋友聊天）重新包裝這個答案
3. 你的目標是幫用戶「消除焦慮」、「下定決心」
4. 回答結尾要自然地引導用戶繼續提問
5. 保持輕鬆友善的語氣，就像朋友在聊天

[你的回答]：`;
    } else {
        // 情境 B: RAG 未命中 - 情感上癮
        console.log('[V30.0] 使用「情感上癮」Prompt');
        return `[任務]：你現在扮演 BrotherG（藍教主），一個「聰明、理解、懂用戶」的 Tesla 決策夥伴。

[用戶狀態]：他問了一個 RAG 知識庫沒有的「延伸問題」。
${historyText}
[用戶問題]：「${query}」

[你的任務]：
1. **分析上下文**：理解完整的對話歷史，找出用戶真正關心的點
2. **理解潛台詞**：這個問題背後的真正焦慮或決策卡點是什麼？
3. **高情商回覆**：展現「聰明、理解、懂他」的特質，給予情緒價值
4. **上癮鉤子**：回覆結尾用「開放式問題」，讓他想繼續問下去
5. 保持輕鬆友善的語氣，就像朋友在聊天

[你的回答]：`;
    }
}

// ==================== Vertex AI 初始化 ====================
let vertexAI = null;
let generativeModel = null;

function initializeVertexAI() {
    try {
        console.log('[V30.0] 初始化 Vertex AI...');
        
        // 從環境變量獲取憑證
        const credentials = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
        if (!credentials) {
            throw new Error('缺少 GOOGLE_APPLICATION_CREDENTIALS_JSON 環境變量');
        }
        
        // 解析憑證
        const credentialsObj = JSON.parse(credentials);
        
        vertexAI = new VertexAI({
            project: 'brothergev-mvp-477006',
            location: 'us-central1',
            googleAuthOptions: {
                credentials: credentialsObj
            }
        });
        
        generativeModel = vertexAI.preview.getGenerativeModel({
            model: 'gemini-1.5-flash'
        });
        
        console.log('[V30.0] ✓ Vertex AI 初始化成功');
        return true;
    } catch (error) {
        console.error('[V30.0] ✗ Vertex AI 初始化失敗:', error);
        return false;
    }
}

// ==================== Netlify Function Handler ====================
export default async (req, context) => {
    // CORS 標頭
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    };
    
    // 處理 OPTIONS 請求
    if (req.method === 'OPTIONS') {
        return new Response('OK', { 
            status: 200, 
            headers: corsHeaders 
        });
    }
    
    const headers = {
        'Content-Type': 'application/json',
        ...corsHeaders
    };
    
    console.log('\n========== [V30.0] 新請求開始 ==========');
    console.log('[V30.0] 請求方法:', req.method);
    console.log('[V30.0] 請求 URL:', req.url);
    
    try {
        // ==================== 步驟 1: 驗證用戶身份 ====================
        console.log('\n--- 步驟 1: 驗證用戶 ---');
        let userData;
        try {
            userData = await verifyToken(req.headers.authorization);
        } catch (authError) {
            console.error('[V30.0] ✗ 身份驗證失敗:', authError.message);
            return new Response(JSON.stringify({
                status: 'error',
                message: `身份驗證失敗: ${authError.message}`
            }), {
                status: 401,
                headers
            });
        }
        
        // ==================== 步驟 2: 解析請求 ====================
        console.log('\n--- 步驟 2: 解析請求 ---');
        let body;
        try {
            body = await req.json();
            console.log('[V30.0] 請求 Body:', JSON.stringify(body, null, 2));
        } catch (parseError) {
            console.error('[V30.0] ✗ JSON 解析失敗:', parseError);
            return new Response(JSON.stringify({
                status: 'error',
                message: 'Invalid JSON in request body'
            }), {
                status: 400,
                headers
            });
        }
        
        const query = body.q;
        const history = body.history || [];
        
        if (!query || typeof query !== 'string') {
            return new Response(JSON.stringify({
                status: 'error',
                message: 'Missing or invalid "q" parameter'
            }), {
                status: 400,
                headers
            });
        }
        
        console.log(`[V30.0] Query: "${query}"`);
        console.log(`[V30.0] History 長度: ${history.length}`);
        
        // ==================== 步驟 3: RAG 搜尋 ====================
        console.log('\n--- 步驟 3: RAG 搜尋 ---');
        const expertAnswer = findBestAnswer(query);
        
        // ==================== 步驟 4: 構建 Prompt ====================
        console.log('\n--- 步驟 4: 構建 Prompt ---');
        const finalPrompt = buildPrompt(query, expertAnswer, history);
        console.log('[V30.0] Prompt 長度:', finalPrompt.length);
        
        // ==================== 步驟 5: 調用 Vertex AI ====================
        console.log('\n--- 步驟 5: 調用 Vertex AI ---');
        
        // 初始化 Vertex AI（如果還沒初始化）
        if (!vertexAI || !generativeModel) {
            const initialized = initializeVertexAI();
            if (!initialized) {
                throw new Error('Vertex AI 初始化失敗');
            }
        }
        
        let answer;
        try {
            console.log('[V30.0] 發送請求到 Gemini...');
            const result = await generativeModel.generateContent(finalPrompt);
            
            // 檢查回應
            if (!result || !result.response) {
                throw new Error('Gemini 返回空回應');
            }
            
            const candidates = result.response.candidates;
            if (!candidates || candidates.length === 0) {
                throw new Error('Gemini 未返回任何候選回應');
            }
            
            const content = candidates[0].content;
            if (!content || !content.parts || content.parts.length === 0) {
                throw new Error('Gemini 回應缺少內容');
            }
            
            answer = content.parts[0].text;
            
            if (!answer) {
                throw new Error('Gemini 回應文本為空');
            }
            
            console.log('[V30.0] ✓ Gemini 回應成功');
            console.log('[V30.0] 回應長度:', answer.length);
            
        } catch (geminiError) {
            console.error('[V30.0] ✗ Gemini 調用失敗:', geminiError);
            
            // 降級方案：返回友善的錯誤訊息
            answer = `抱歉，我現在遇到了一些技術問題 😅\n\n` +
                     `不過別擔心！你可以：\n` +
                     `1. 稍等一下再試一次\n` +
                     `2. 換個方式問同樣的問題\n` +
                     `3. 或者先看看「五大熱門疑問」\n\n` +
                     `如果問題持續，請聯繫我們的技術團隊。謝謝你的耐心！`;
        }
        
        // ==================== 步驟 6: 返回結果 ====================
        console.log('\n--- 步驟 6: 返回結果 ---');
        const response = {
            status: 'success',
            answer: answer,
            rag_hit: !!expertAnswer,
            user: userData.email,
            timestamp: new Date().toISOString()
        };
        
        console.log('[V30.0] ✓ 請求處理成功');
        console.log('========== [V30.0] 請求結束 ==========\n');
        
        return new Response(JSON.stringify(response), {
            status: 200,
            headers
        });
        
    } catch (error) {
        // ==================== 最終錯誤處理 ====================
        console.error('\n========== [V30.0] 嚴重錯誤 ==========');
        console.error('[V30.0] 錯誤類型:', error.constructor.name);
        console.error('[V30.0] 錯誤訊息:', error.message);
        console.error('[V30.0] 錯誤堆疊:', error.stack);
        console.error('=========================================\n');
        
        // 確保總是返回有效的錯誤訊息（修復 undefined 問題）
        const errorMessage = error.message || '發生未知錯誤';
        const errorStack = error.stack || 'No stack trace available';
        
        return new Response(JSON.stringify({
            status: 'error',
            message: errorMessage,
            error_type: error.constructor.name,
            stack: process.env.NODE_ENV === 'development' ? errorStack : undefined,
            timestamp: new Date().toISOString()
        }), {
            status: 500,
            headers
        });
    }
};
