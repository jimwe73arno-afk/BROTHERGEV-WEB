import { VertexAI } from '@google-cloud/vertexai';
import { parse } from 'csv-parse/sync';
import fs from 'fs';
import path from 'path';

// ==================== 1. Vertex AI 初始化 ====================
const projectId = 'brothergev-mvp-477006';
const location = 'us-central1';
const modelName = 'gemini-1.5-flash';

// 從環境變量獲取憑證
const credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);

const vertexAI = new VertexAI({
  project: projectId,
  location: location,
  credentials: credentials
});

const generativeModel = vertexAI.preview.getGenerativeModel({
  model: modelName,
  generationConfig: {
    maxOutputTokens: 1024,
    temperature: 0.8,
  },
});

// ==================== 2. RAG 知識庫加載 ====================
let knowledgeBase = [];
try {
  const csvPath = path.resolve(process.cwd(), 'snippets.csv');
  const csvData = fs.readFileSync(csvPath, 'utf8');
  knowledgeBase = parse(csvData, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });
  console.log(`✅ RAG 知識庫加載成功，共 ${knowledgeBase.length} 條`);
} catch (error) {
  console.error('❌ RAG 知識庫加載失敗:', error);
}

// ==================== 3. RAG 查詢函數 ====================
function findBestSnippet(query) {
  const lowerQuery = query.toLowerCase().trim();
  
  // 放寬匹配條件：TOP_K = 6, MIN_SCORE = 0.23
  const matches = [];
  
  for (const item of knowledgeBase) {
    if (!item.Questions || !item.Answers) continue;
    
    const questionLower = item.Questions.toLowerCase();
    let score = 0;
    
    // 關鍵詞匹配評分
    const keywords = lowerQuery.split(/\s+/);
    keywords.forEach(keyword => {
      if (keyword.length > 2 && questionLower.includes(keyword)) {
        score += 1;
      }
    });
    
    // 完全匹配加分
    if (questionLower.includes(lowerQuery)) {
      score += 3;
    }
    
    if (score > 0) {
      matches.push({
        score,
        answer: item.Answers,
        question: item.Questions
      });
    }
  }
  
  // 按分數排序，取前6個
  matches.sort((a, b) => b.score - a.score);
  const topMatches = matches.slice(0, 6);
  
  // 最低分數門檻 0.23
  const bestMatch = topMatches.find(match => match.score >= 0.23);
  
  console.log(`RAG 查詢: "${query}" → 匹配數: ${matches.length}, 最佳分數: ${bestMatch?.score || 0}`);
  
  return bestMatch ? bestMatch.answer : null;
}

// ==================== 4. 決策引擎 Prompt 構建 ====================
function buildPrompt(query, expertAnswer, history = []) {
  const isChinese = /[\u4e00-\u9fff]/.test(query);
  
  if (expertAnswer) {
    // RAG 命中：V12 決策閉環
    if (isChinese) {
      return `[任務]：你現在扮演 BrotherG (藍教主)，一個專業、高情商、懂銷售心理學的電動車決策顧問。

[用戶問題]：「${query}」
[專家答案]：「${expertAnswer}」

[你的要求]：
1. **禁止**直接照抄「專家答案」的格式和用詞。
2. 用「BrotherG 決策腔」重新包裝：自信、有同理心、像朋友聊天。
3. 回答必須包含四個層次：
   - 結論（直接給答案）
   - 依據（數據或理由）
   - 風險（要注意什麼）
   - 行動（具體下一步）
4. 語氣要口語化，像在跟朋友講話。
5. 結尾要自然地引導用戶繼續提問。

[你的回答]：`;
    } else {
      return `[Role]: You are BrotherG, a professional, empathetic EV decision consultant.

[User Question]: "${query}"
[Expert Answer]: "${expertAnswer}"

[Requirements]:
1. NEVER copy the expert answer directly.
2. Repackage using "BrotherG Decision Style": confident, empathetic, like chatting with a friend.
3. Include four layers:
   - Conclusion (direct answer)
   - Basis (data/reasons)
   - Risk (what to watch for)
   - Action (specific next steps)
4. Use conversational tone.
5. End by naturally guiding to continue the conversation.

[Your Response]:`;
    }
  } else {
    // RAG 未命中：V27 情感上癮
    const historyContext = history.length > 0 
      ? `[對話歷史]:\n${history.slice(-3).map(msg => `${msg.role}: ${msg.parts}`).join('\n')}`
      : '[無對話歷史]';

    if (isChinese) {
      return `[任務]：你現在扮演 BrotherG (藍教主)，一個聰明、理解、懂你的電動車決策夥伴。

${historyContext}
[用戶最新問題]：「${query}」

[你的要求]：
1. 先分析對話上下文，理解用戶的潛台詞和焦慮點。
2. 用高情商方式回覆，提供情緒價值。
3. 如果問題模糊，用「反向提問」獲取更多資訊。
4. 回答結構：
   - 結論：我需要更多資訊才能給準確建議
   - 依據：你的描述過於簡短/缺少關鍵資訊
   - 風險：直接下結論可能導致錯誤決策
   - 行動：請告訴我三件事【預算｜主要用途｜家充條件】或使用快捷問題
5. 結尾用開放式問題引導繼續對話。

[你的回答]：`;
    } else {
      return `[Role]: You are BrotherG, a smart, understanding EV decision partner.

${historyContext}
[Latest Question]: "${query}"

[Requirements]:
1. Analyze conversation context, understand user's underlying concerns.
2. Respond with high emotional intelligence.
3. If question is vague, use "reverse questioning" to get more info.
4. Structure:
   - Conclusion: I need more info for accurate advice
   - Basis: Your description is too brief/missing key details
   - Risk: Direct conclusion may lead to wrong decision
   - Action: Tell me three things [Budget | Primary Use | Home Charging] or use quick questions
5. End with open-ended question to continue dialogue.

[Your Response]:`;
    }
  }
}

// ==================== 5. Netlify 函數主體 ====================
export default async (req, context) => {
  // CORS 設置
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
          version: 'V27.1',
          message: 'Brother G EV API - RAG + 決策引擎',
          features: ['vertex_ai', 'rag_v12', 'emotional_v27']
        }),
        { headers }
      );
    }

    // 處理問題
    const body = await req.json();
    const query = body.q;
    const history = body.history || [];

    if (!query || query.trim().length === 0) {
      return new Response(
        JSON.stringify({ 
          error: '問題不能為空',
          version: 'V27.1'
        }),
        { status: 400, headers }
      );
    }

    console.log(`📥 收到問題: "${query}"`);

    // 階段 1: RAG 查詢
    const expertAnswer = findBestSnippet(query);
    const ragHit = !!expertAnswer;
    
    console.log(`🎯 RAG 結果: ${ragHit ? '命中' : '未命中'}`);

    // 階段 2: 構建 Prompt
    const prompt = buildPrompt(query, expertAnswer, history);
    const promptType = ragHit ? 'V12_決策閉環' : 'V27_情感上癮';

    // 階段 3: 調用 Gemini API
    console.log(`🤖 調用 Gemini (${promptType})...`);
    
    const result = await generativeModel.generateContent(prompt);
    const answer = result.response.candidates[0].content.parts[0].text;

    console.log(`✅ Gemini 回應完成`);

    // 返回自然對話
    return new Response(
      JSON.stringify({
        answer: answer,
        rag_hit: ragHit,
        prompt_type: promptType,
        source: 'gemini_processed',
        version: 'V27.1',
        debug: {
          query_length: query.length,
          has_history: history.length > 0,
          is_chinese: /[\u4e00-\u9fff]/.test(query)
        }
      }),
      { headers }
    );

  } catch (error) {
    console.error('❌ API 錯誤:', error);
    
    // 錯誤時返回友好訊息
    return new Response(
      JSON.stringify({ 
        error: '暫時無法處理您的問題，請稍後再試',
        details: error.message,
        version: 'V27.1'
      }),
      { status: 500, headers }
    );
  }
};