// Netlify Function - 直接調用 Vertex AI
// 不需要 Cloud Run，避免所有認證問題

const { GoogleAuth } = require('google-auth-library');

// Tesla EV 知識庫
const KNOWLEDGE_BASE = {
    "Model 3 vs Model Y": {
        answer: "【Conclusion】Model 3 for enjoyment, Model Y for family 【Basis】Model 3 sportier, Model Y more spacious 【Risk】Wrong choice affects satisfaction 【Action】Test drive both",
        confidence: 0.95
    },
    "Tesla insurance cost": {
        answer: "【Conclusion】15-30% higher than gas cars 【Basis】Higher repair costs for aluminum body and sensors 【Risk】First year premiums highest 【Action】Get multiple quotes",
        confidence: 0.9
    },
    "Winter range loss": {
        answer: "【Conclusion】Expect 20-40% reduction in freezing temps 【Basis】Battery less efficient, heating consumes power 【Risk】More frequent charging needed 【Action】Precondition battery while plugged in",
        confidence: 0.9
    },
    "Home charging setup": {
        answer: "【Conclusion】Level 2 charger recommended 【Basis】Adds 30-40 miles per hour 【Risk】Installation costs $500-2000 【Action】Check electrical panel capacity first",
        confidence: 0.85
    },
    "Tesla maintenance cost": {
        answer: "【Conclusion】50% less than gas cars 【Basis】No oil changes, fewer moving parts 【Risk】Tire wear faster due to weight 【Action】Rotate tires every 6250 miles",
        confidence: 0.9
    },
    "Autopilot worth it": {
        answer: "【Conclusion】Basic Autopilot included, FSD optional 【Basis】Basic good for highways, FSD adds city features 【Risk】FSD expensive at $12k 【Action】Try basic first",
        confidence: 0.85
    },
    "Supercharging cost": {
        answer: "【Conclusion】$0.25-0.50 per kWh, varies by location 【Basis】More expensive than home charging 【Risk】Frequent use degrades battery faster 【Action】Charge at home when possible",
        confidence: 0.85
    },
    "Used Tesla guide": {
        answer: "【Conclusion】Check battery health and warranty 【Basis】Battery warranty 8yr/120k miles 【Risk】Hidden damage not obvious 【Action】Get pre-purchase inspection",
        confidence: 0.8
    },
    "Road trip feasible": {
        answer: "【Conclusion】Yes with planning 【Basis】Supercharger network extensive 【Risk】Need to plan charging stops 【Action】Use Tesla trip planner",
        confidence: 0.85
    },
    "Total ownership cost": {
        answer: "【Conclusion】Lower than luxury gas cars 【Basis】Cheaper fuel and maintenance 【Risk】Higher insurance and depreciation 【Action】Calculate 5-year TCO",
        confidence: 0.85
    }
};

// 模糊匹配函數
function findBestMatch(question) {
    const q = question.toLowerCase();
    let bestMatch = null;
    let bestScore = 0;

    for (const [key, value] of Object.entries(KNOWLEDGE_BASE)) {
        const keyLower = key.toLowerCase();
        const keyWords = keyLower.split(' ');
        const questionWords = q.split(' ');
        
        // 計算重疊詞數
        let score = 0;
        keyWords.forEach(kw => {
            if (questionWords.some(qw => qw.includes(kw) || kw.includes(qw))) {
                score += 1;
            }
        });
        
        // 完全匹配加分
        if (q.includes(keyLower) || keyLower.includes(q)) {
            score += 5;
        }
        
        if (score > bestScore) {
            bestScore = score;
            bestMatch = { key, ...value };
        }
    }
    
    return bestScore > 1 ? bestMatch : null;
}

// 主函數
exports.handler = async (event, context) => {
    // CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
        'Content-Type': 'application/json'
    };

    // 處理 OPTIONS 請求
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    // 處理 GET 請求（健康檢查）
    if (event.httpMethod === 'GET') {
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                status: 'healthy',
                message: 'Brother G EV API is running on Netlify',
                knowledge_entries: Object.keys(KNOWLEDGE_BASE).length,
                timestamp: new Date().toISOString()
            })
        };
    }

    // 只接受 POST 請求
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        // 解析請求
        const { q } = JSON.parse(event.body || '{}');
        
        if (!q) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Missing question parameter' })
            };
        }

        console.log('📩 Question received:', q);

        // 首先嘗試從知識庫匹配
        const match = findBestMatch(q);
        
        if (match && match.confidence > 0.7) {
            console.log('✅ Found match in knowledge base:', match.key);
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    answer: match.answer,
                    matched: match.key,
                    confidence: match.confidence,
                    source: 'knowledge_base',
                    timestamp: new Date().toISOString()
                })
            };
        }

        // 如果沒有好的匹配，使用 Vertex AI（可選）
        // 注意：這需要設置 Google Cloud 憑證
        const useVertexAI = process.env.USE_VERTEX_AI === 'true' && process.env.GOOGLE_APPLICATION_CREDENTIALS;
        
        if (useVertexAI) {
            try {
                const answer = await callVertexAI(q);
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({
                        answer: answer,
                        source: 'vertex_ai',
                        timestamp: new Date().toISOString()
                    })
                };
            } catch (aiError) {
                console.error('Vertex AI error:', aiError);
                // 降級到通用答案
            }
        }

        // 如果都沒有，返回通用答案
        console.log('⚠️ No good match found, returning generic answer');
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                answer: `Thank you for your question about "${q}". For detailed information about Tesla vehicles, please contact our experts at support@brothergev.com or visit brothergev.com`,
                source: 'generic',
                timestamp: new Date().toISOString()
            })
        };

    } catch (error) {
        console.error('💥 Error:', error);
        
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Internal server error',
                message: error.message,
                timestamp: new Date().toISOString()
            })
        };
    }
};

// Vertex AI 調用函數（可選）
async function callVertexAI(question) {
    // 這個函數需要設置 Google Cloud 認證
    // 如果不使用，可以完全依賴知識庫
    const auth = new GoogleAuth({
        scopes: 'https://www.googleapis.com/auth/cloud-platform'
    });
    
    const client = await auth.getClient();
    const projectId = process.env.GOOGLE_CLOUD_PROJECT || 'brothergev-mvp-477006';
    const location = 'us-central1';
    const model = 'gemini-1.5-flash-002';
    
    const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:generateContent`;
    
    const prompt = `You are a Tesla electric vehicle expert. Answer this question concisely in the format:
【Conclusion】brief conclusion
【Basis】key facts
【Risk】potential concerns
【Action】recommended action

Question: ${question}`;
    
    const response = await client.request({
        url: endpoint,
        method: 'POST',
        data: {
            contents: [{
                role: 'user',
                parts: [{ text: prompt }]
            }],
            generation_config: {
                temperature: 0.2,
                maxOutputTokens: 256
            }
        }
    });
    
    return response.data.candidates[0].content.parts[0].text;
}
