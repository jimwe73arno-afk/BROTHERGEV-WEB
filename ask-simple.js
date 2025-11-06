// Netlify Function - 純 JavaScript 版本
// 完全獨立運行，不需要 Cloud Run 或外部 API

// Tesla EV 完整知識庫
const KNOWLEDGE_BASE = {
    "model 3 vs model y": {
        answer: "【Conclusion】Model 3 for enjoyment, Model Y for family 【Basis】Model 3 sportier and more affordable, Model Y offers more cargo space 【Risk】Wrong choice affects daily satisfaction 【Action】Test drive both models",
        tags: ["comparison", "model 3", "model y", "choice"]
    },
    "tesla insurance cost": {
        answer: "【Conclusion】15-30% higher than gas cars 【Basis】Higher repair costs for aluminum body and advanced sensors 【Risk】First year premiums highest 【Action】Get multiple quotes, consider Tesla Insurance",
        tags: ["insurance", "cost", "price"]
    },
    "winter range loss": {
        answer: "【Conclusion】Expect 20-40% reduction in freezing temps 【Basis】Battery less efficient in cold, heating system uses power 【Risk】More frequent charging needed 【Action】Precondition battery while plugged in",
        tags: ["winter", "range", "cold", "battery"]
    },
    "home charging setup": {
        answer: "【Conclusion】Level 2 charger (240V) recommended 【Basis】Adds 30-40 miles per hour of charging 【Risk】Installation costs $500-2000 【Action】Check electrical panel capacity, hire licensed electrician",
        tags: ["charging", "home", "installation"]
    },
    "maintenance cost": {
        answer: "【Conclusion】50% less than gas cars 【Basis】No oil changes, fewer moving parts, regenerative braking saves brake pads 【Risk】Tire wear faster due to instant torque 【Action】Rotate tires every 6,250 miles",
        tags: ["maintenance", "cost", "service"]
    },
    "autopilot worth it": {
        answer: "【Conclusion】Basic Autopilot included, FSD optional 【Basis】Basic excellent for highway, FSD adds city driving features 【Risk】FSD costs $12,000 extra 【Action】Try basic Autopilot first before upgrading",
        tags: ["autopilot", "fsd", "features"]
    },
    "supercharging cost": {
        answer: "【Conclusion】$0.25-0.50 per kWh varies by location 【Basis】More expensive than home charging (3-4x) 【Risk】Frequent supercharging may degrade battery faster 【Action】Use home charging when possible",
        tags: ["supercharger", "charging", "cost"]
    },
    "used tesla guide": {
        answer: "【Conclusion】Check battery health and warranty carefully 【Basis】Battery warranty 8 years/120k miles 【Risk】Hidden damage not always obvious 【Action】Get pre-purchase inspection, check service history",
        tags: ["used", "buying", "guide"]
    },
    "road trip feasible": {
        answer: "【Conclusion】Yes, with proper planning 【Basis】Supercharger network covers major routes 【Risk】Need to plan charging stops 【Action】Use Tesla navigation trip planner",
        tags: ["road trip", "travel", "supercharger"]
    },
    "total ownership cost": {
        answer: "【Conclusion】Lower than comparable luxury gas cars 【Basis】Cheaper fuel and maintenance offset higher purchase price 【Risk】Higher insurance and initial depreciation 【Action】Calculate 5-year total cost of ownership",
        tags: ["cost", "ownership", "tco"]
    },
    "charging time": {
        answer: "【Conclusion】Home overnight, Supercharger 15-30 min 【Basis】Home Level 2 adds 30 miles/hour, Supercharger 200+ miles/hour 【Risk】Battery charges slower when cold or near full 【Action】Charge to 80% daily, 100% only for trips",
        tags: ["charging", "time", "speed"]
    },
    "battery degradation": {
        answer: "【Conclusion】5-10% loss in first 100k miles 【Basis】Modern batteries very durable 【Risk】Frequent supercharging accelerates degradation 【Action】Charge to 80% daily, avoid letting battery sit at 0% or 100%",
        tags: ["battery", "degradation", "lifespan"]
    },
    "warranty coverage": {
        answer: "【Conclusion】4yr/50k basic, 8yr/120k battery 【Basis】Battery warranty covers 70% capacity retention 【Risk】Cosmetic issues not covered 【Action】Review warranty terms before purchase",
        tags: ["warranty", "coverage"]
    },
    "resale value": {
        answer: "【Conclusion】Better than most EVs, varies by model 【Basis】Strong brand and charging network 【Risk】Frequent price cuts affect used values 【Action】Consider leasing if concerned about depreciation",
        tags: ["resale", "value", "depreciation"]
    },
    "tax incentives": {
        answer: "【Conclusion】Up to $7,500 federal credit available 【Basis】Depends on income and vehicle price 【Risk】Rules change frequently 【Action】Check current IRS guidelines before purchase",
        tags: ["tax", "incentive", "credit"]
    }
};

// 智能匹配函數
function findBestMatch(question) {
    const q = question.toLowerCase().trim();
    
    // 直接匹配
    if (KNOWLEDGE_BASE[q]) {
        return { key: q, ...KNOWLEDGE_BASE[q], confidence: 1.0 };
    }
    
    let bestMatch = null;
    let bestScore = 0;
    
    // 計算每個知識條目的匹配分數
    for (const [key, value] of Object.entries(KNOWLEDGE_BASE)) {
        let score = 0;
        
        // 關鍵詞匹配
        const keyWords = key.split(' ');
        const questionWords = q.split(' ');
        
        keyWords.forEach(kw => {
            questionWords.forEach(qw => {
                if (qw.length > 2 && (qw.includes(kw) || kw.includes(qw))) {
                    score += 2;
                }
            });
        });
        
        // 標籤匹配
        value.tags.forEach(tag => {
            if (q.includes(tag)) {
                score += 3;
            }
        });
        
        // 部分匹配
        if (q.includes(key) || key.includes(q)) {
            score += 5;
        }
        
        if (score > bestScore) {
            bestScore = score;
            bestMatch = { key, ...value, confidence: Math.min(score / 10, 1.0) };
        }
    }
    
    return bestScore > 2 ? bestMatch : null;
}

// 生成通用答案
function generateGenericAnswer(question) {
    const q = question.toLowerCase();
    
    // 根據問題類型給出不同的通用答案
    if (q.includes('cost') || q.includes('price') || q.includes('expensive')) {
        return "【Conclusion】Costs vary by model and location 【Basis】Tesla offers different trim levels and options 【Risk】Total cost includes purchase, insurance, and charging 【Action】Use Tesla's online calculator for accurate estimates";
    }
    
    if (q.includes('range') || q.includes('mile') || q.includes('distance')) {
        return "【Conclusion】Range varies by model: 250-400+ miles 【Basis】Model 3/Y Long Range offer best range 【Risk】Real-world range affected by weather and driving style 【Action】Check EPA ratings for specific model";
    }
    
    if (q.includes('charge') || q.includes('charging')) {
        return "【Conclusion】Multiple charging options available 【Basis】Home charging most convenient, Superchargers for trips 【Risk】Charging infrastructure varies by region 【Action】Plan charging strategy based on your daily needs";
    }
    
    if (q.includes('safe') || q.includes('safety')) {
        return "【Conclusion】Highest safety ratings available 【Basis】5-star NHTSA ratings across all models 【Risk】Advanced features require driver attention 【Action】Review safety features and test drive";
    }
    
    // 默認答案
    return `Thank you for your question about "${question}". For detailed information about Tesla electric vehicles, please contact our experts at support@brothergev.com or visit brothergev.com to learn more.`;
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

    // OPTIONS 請求（CORS 預檢）
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    // GET 請求（健康檢查）
    if (event.httpMethod === 'GET') {
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                status: 'healthy',
                message: 'Brother G EV API - Netlify Edition',
                knowledge_entries: Object.keys(KNOWLEDGE_BASE).length,
                version: '2.0',
                platform: 'Netlify Functions',
                timestamp: new Date().toISOString()
            })
        };
    }

    // 只接受 POST 請求
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ 
                error: 'Method not allowed',
                allowed_methods: ['GET', 'POST', 'OPTIONS']
            })
        };
    }

    try {
        // 解析請求體
        let body = {};
        try {
            body = JSON.parse(event.body || '{}');
        } catch (parseError) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ 
                    error: 'Invalid JSON in request body',
                    details: parseError.message 
                })
            };
        }

        const { q } = body;
        
        // 驗證問題參數
        if (!q || typeof q !== 'string' || q.trim().length === 0) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ 
                    error: 'Missing or invalid question parameter',
                    example: { q: "Model 3 vs Model Y" }
                })
            };
        }

        console.log('📩 Question received:', q);

        // 嘗試從知識庫匹配
        const match = findBestMatch(q);
        
        if (match && match.confidence >= 0.3) {
            console.log(`✅ Match found: "${match.key}" (confidence: ${match.confidence})`);
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

        // 沒有好的匹配，生成通用答案
        console.log('⚠️ No good match, using generic answer');
        const genericAnswer = generateGenericAnswer(q);
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                answer: genericAnswer,
                source: 'generic',
                note: 'For specific questions, please contact support@brothergev.com',
                timestamp: new Date().toISOString()
            })
        };

    } catch (error) {
        console.error('💥 Error processing request:', error);
        
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Internal server error',
                message: 'An unexpected error occurred',
                timestamp: new Date().toISOString()
            })
        };
    }
};
