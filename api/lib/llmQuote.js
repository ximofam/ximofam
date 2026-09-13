// api/lib/llmQuote.js

import OFFLINE_QUOTES from '../../docs/offline_quotes.json' with { type: 'json' };

const DEFAULT_MODELS = {
  gemini: 'gemini-3.6-flash',
  groq: 'openai/gpt-oss-20b',
  claude: 'claude-3-5-haiku-20241022',
  openai: 'gpt-4o-mini',
};

const DEFAULT_BASE_URLS = {
  groq: 'https://api.groq.com/openai/v1',
  openai: 'https://api.openai.com/v1',
  claude: 'https://api.anthropic.com/v1',
  gemini: 'https://generativelanguage.googleapis.com/v1beta',
};

/**
 * Automatically infers topic from status text when not specified
 */
export function inferFallbackTopic(status) {
  if (!status || typeof status !== 'string') return 'coding';
  const lower = status.toLowerCase();
  if (/buồn|sad|mệt|tired|stress|khóc|down|áp lực|chán|bế tắc|nản|pain|hurt/.test(lower)) {
    return 'motivation';
  }
  if (/bug|code|dev|git|deploy|build|server|lỗi|syntax|database|api|backend|frontend|fix|leak|memory|program|software|script/.test(lower)) {
    return 'coding';
  }
  return 'life';
}

/**
 * Returns a random fallback quote for given topic and language
 */
export function getOfflineFallbackQuote({ topic = 'coding', lang = 'en', status = null } = {}) {
  let safeTopic = topic;
  if (!safeTopic || safeTopic === 'auto' || !OFFLINE_QUOTES[safeTopic]) {
    safeTopic = inferFallbackTopic(status);
  }
  const safeLang = OFFLINE_QUOTES[safeTopic]?.[lang] ? lang : 'en';
  const list = OFFLINE_QUOTES[safeTopic]?.[safeLang] || OFFLINE_QUOTES.coding.en;
  const picked = list[Math.floor(Math.random() * list.length)];
  return { ...picked, topic: safeTopic, language: safeLang };
}

/**
 * Builds standard quote prompt directly in JavaScript
 */
export function buildQuotePrompt({
  topic = null,
  status = null,
  lang = 'en',
  tone = null,
} = {}) {
  const languagePrompt = lang === 'vi' ? 'Tiếng Việt (Vietnamese)' : 'English';

  const systemMessage = {
    role: 'system',
    content: `You are an empathetic, insightful, and witty quote curator for developers and creators.
Your mission is to generate ONE single impactful quote in ${languagePrompt}.

Rules:
1. If the user provides a status/mood (e.g. "Hôm nay tôi buồn", "fixing bugs", "feeling tired"), deeply analyze their state of mind.
2. If topic or tone is not explicitly specified (or is "auto"), AUTOMATICALLY deduce the most fitting topic (e.g. "life", "healing", "perseverance", "coding", "humor") and tone (e.g. "empathetic", "soothing", "inspiring", "humorous").
3. If it is a known quotation from a famous figure, provide their real name in "author". If it is an original quote created for this specific moment, set "author" to "AI Inspiration".
4. Respond STRICTLY with a valid raw JSON object. Do not include markdown fences, backticks, or any commentary.

JSON Schema:
{
  "quote": "The quote content",
  "author": "Author name or AI Inspiration",
  "topic": "Deduced or specified topic",
  "tone": "Deduced or specified tone"
}`,
  };

  let userPrompt = '';
  if (status) {
    userPrompt += `User Status/Mood: "${status}".`;
    if (!topic || topic === 'auto') {
      userPrompt += ` Please analyze this status and automatically determine the most fitting topic and tone.`;
    }
  }

  if (topic && topic !== 'auto') {
    userPrompt += ` Topic: "${topic}".`;
  }
  if (tone && tone !== 'auto') {
    userPrompt += ` Tone: "${tone}".`;
  }

  if (!userPrompt.trim()) {
    userPrompt = `Generate an inspiring quote about coding or life.`;
  }

  return [systemMessage, { role: 'user', content: userPrompt.trim() }];
}

/**
 * Safely parses the LLM output into { quote, author, topic, tone }
 */
export function parseQuoteResponse(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    throw new Error('Empty or non-string LLM response');
  }

  let cleaned = rawText.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  }

  const cleanField = (val) => {
    if (typeof val !== 'string' || !val.trim()) return undefined;
    const firstLine = val.trim().split(/[\n\r]/)[0].trim();
    return firstLine.replace(/^["']|["']$/g, '').slice(0, 60).trim();
  };

  try {
    const data = JSON.parse(cleaned);
    const item = Array.isArray(data) ? data[0] : data;
    if (item && typeof item.quote === 'string' && item.quote.trim().length > 0) {
      return {
        quote: item.quote.trim(),
        author: typeof item.author === 'string' && item.author.trim() ? cleanField(item.author) : 'AI Inspiration',
        topic: cleanField(item.topic),
        tone: cleanField(item.tone),
      };
    }
  } catch {
    // If missing outer braces: {"quote": ...}
    if (!cleaned.startsWith('{') && cleaned.includes('"quote"')) {
      try {
        const wrapped = JSON.parse(`{${cleaned}}`);
        if (wrapped?.quote) {
          return {
            quote: wrapped.quote.trim(),
            author: cleanField(wrapped.author) || 'AI Inspiration',
            topic: cleanField(wrapped.topic),
            tone: cleanField(wrapped.tone),
          };
        }
      } catch {
        // Fall through
      }
    }

    const match = cleaned.match(/\{[\s\S]*"quote"\s*:\s*"([^"]+)"[\s\S]*\}/);
    if (match) {
      try {
        const extracted = JSON.parse(match[0]);
        const item = Array.isArray(extracted) ? extracted[0] : extracted;
        if (item?.quote) {
          return {
            quote: item.quote.trim(),
            author: item.author || 'AI Inspiration',
            topic: item.topic || undefined,
            tone: item.tone || undefined,
          };
        }
      } catch {
        // Continue to text fallback
      }
    }
  }

  // Fallback: extract quote/author from field or bullet formats
  const quoteFieldMatch = cleaned.match(/["']?quote["']?\s*[:=]\s*["“](.+?)["”]/i)
    || cleaned.match(/["']?quote["']?\s*[:=]\s*([^\n\r,]+)/i);
  if (quoteFieldMatch && quoteFieldMatch[1].trim()) {
    const authorMatch = cleaned.match(/["']?author["']?\s*[:=]\s*["“](.+?)["”]/i)
      || cleaned.match(/["']?author["']?\s*[:=]\s*([^\n\r,}]+)/i);
    return {
      quote: quoteFieldMatch[1].trim(),
      author: authorMatch ? authorMatch[1].trim() : 'AI Inspiration',
    };
  }

  // Fallback: raw quotation in quotes: * "Quote text" - Author or "Quote text"
  const textQuoteMatch = cleaned.match(/["“](.+?)["”](?:\s*[-–—]\s*(.+))?/);
  if (textQuoteMatch && textQuoteMatch[1].trim() && textQuoteMatch[1].trim().length > 3) {
    return {
      quote: textQuoteMatch[1].trim(),
      author: textQuoteMatch[2]?.trim() || 'AI Inspiration',
    };
  }

  throw new Error(`Failed to parse valid quote JSON from response: "${rawText.slice(0, 100)}"`);
}

/**
 * Resolves active provider, API key, base URL, and model based on config & environment
 */
export function resolveProviderConfig({
  provider,
  apiKey,
  baseUrl,
  model,
  env = process.env,
} = {}) {
  let activeProvider = provider?.toLowerCase();

  if (!activeProvider) {
    if (env.LLM_PROVIDER) {
      activeProvider = env.LLM_PROVIDER.toLowerCase();
    } else if (env.GEMINI_API_KEY) {
      activeProvider = 'gemini';
    } else if (env.GROQ_API_KEY) {
      activeProvider = 'groq';
    } else if (env.ANTHROPIC_API_KEY || env.CLAUDE_API_KEY) {
      activeProvider = 'claude';
    } else if (env.OPENAI_API_KEY) {
      activeProvider = 'openai';
    } else if (env.LLM_API_KEY) {
      const hint = (env.LLM_MODEL || env.LLM_BASE_URL || '').toLowerCase();
      if (hint.includes('gemini') || hint.includes('generativelanguage')) {
        activeProvider = 'gemini';
      } else if (hint.includes('claude') || hint.includes('anthropic')) {
        activeProvider = 'claude';
      } else if (hint.includes('llama') || hint.includes('groq')) {
        activeProvider = 'groq';
      } else {
        activeProvider = 'openai';
      }
    } else {
      activeProvider = 'openai';
    }
  }

  let resolvedKey = apiKey;
  if (!resolvedKey) {
    switch (activeProvider) {
      case 'gemini':
        resolvedKey = env.GEMINI_API_KEY || env.LLM_API_KEY;
        break;
      case 'groq':
        resolvedKey = env.GROQ_API_KEY || env.LLM_API_KEY;
        break;
      case 'claude':
        resolvedKey = env.ANTHROPIC_API_KEY || env.CLAUDE_API_KEY || env.LLM_API_KEY;
        break;
      case 'openai':
      default:
        resolvedKey = env.OPENAI_API_KEY || env.LLM_API_KEY;
        break;
    }
  }

  const resolvedModel = model || env.LLM_MODEL || DEFAULT_MODELS[activeProvider] || 'gpt-4o-mini';
  const resolvedBaseUrl = baseUrl || env.LLM_BASE_URL || DEFAULT_BASE_URLS[activeProvider] || 'https://api.openai.com/v1';

  return {
    provider: activeProvider,
    apiKey: resolvedKey,
    baseUrl: resolvedBaseUrl.replace(/\/+$/, ''),
    model: resolvedModel,
  };
}

/**
 * Calls Google Gemini REST API (native v1beta generateContent)
 */
async function callGemini({ apiKey, baseUrl, model, messages, signal, fetchFn }) {
  const systemText = messages[0]?.content || '';
  const userText = messages[1]?.content || '';

  const requestBody = {
    contents: [{ role: 'user', parts: [{ text: userText }] }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1500,
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'OBJECT',
        properties: {
          quote: { type: 'STRING' },
          author: { type: 'STRING' },
          topic: { type: 'STRING' },
          tone: { type: 'STRING' },
        },
        required: ['quote'],
      },
    },
  };

  if (systemText) {
    requestBody.system_instruction = { parts: [{ text: systemText }] };
  }

  const url = `${baseUrl}/models/${model}:generateContent?key=${apiKey}`;
  const res = await fetchFn(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
    signal,
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Gemini API error (HTTP ${res.status}): ${errText.slice(0, 150)}`);
  }

  const data = await res.json();
  const rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
  return {
    content: rawContent,
    model: data.modelVersion || model,
  };
}

/**
 * Calls Anthropic Claude Messages API (/v1/messages)
 */
async function callClaude({ apiKey, baseUrl, model, messages, signal, fetchFn }) {
  const systemPrompt = messages[0]?.content || '';
  const userPrompt = messages[1]?.content || '';

  const url = `${baseUrl}/messages`;
  const res = await fetchFn(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 200,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
      temperature: 0.8,
    }),
    signal,
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Claude API error (HTTP ${res.status}): ${errText.slice(0, 150)}`);
  }

  const data = await res.json();
  const rawContent = data.content?.[0]?.text;
  return {
    content: rawContent,
    model: data.model || model,
  };
}

/**
 * Calls OpenAI, Groq, or any OpenAI-compatible /chat/completions endpoint
 */
async function callOpenAiCompatible({ apiKey, baseUrl, model, messages, signal, fetchFn }) {
  const url = `${baseUrl}/chat/completions`;
  const res = await fetchFn(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 1000,
      response_format: { type: 'json_object' },
    }),
    signal,
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`OpenAI-compatible API error (HTTP ${res.status}): ${errText.slice(0, 150)}`);
  }

  const data = await res.json();
  const rawContent = data.choices?.[0]?.message?.content;
  return {
    content: rawContent,
    model: data.model || model,
  };
}

/**
 * Generates a quote supporting Gemini, Claude, Groq, and OpenAI with auto-topic/tone deduction
 */
export async function generateQuote({
  topic = null,
  status = null,
  lang = 'en',
  tone = null,
  provider,
  apiKey,
  baseUrl,
  model,
  timeoutMs = 8000,
  fetchFn = fetch,
  env = process.env,
} = {}) {
  const safeLang = lang === 'vi' ? 'vi' : 'en';
  const config = resolveProviderConfig({ provider, apiKey, baseUrl, model, env });

  // If no API key configured for the resolved provider, use offline fallback with auto-topic
  if (!config.apiKey) {
    const fallback = getOfflineFallbackQuote({ topic, lang: safeLang, status });
    return {
      quote: fallback.quote,
      author: fallback.author,
      topic: fallback.topic,
      status: status || null,
      model: 'offline-fallback',
      language: safeLang,
      timestamp: Date.now(),
    };
  }

  try {
    const messages = buildQuotePrompt({ topic, status, lang: safeLang, tone });

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    let llmResult;
    switch (config.provider) {
      case 'gemini':
        llmResult = await callGemini({
          apiKey: config.apiKey,
          baseUrl: config.baseUrl,
          model: config.model,
          messages,
          signal: controller.signal,
          fetchFn,
        });
        break;

      case 'claude':
        llmResult = await callClaude({
          apiKey: config.apiKey,
          baseUrl: config.baseUrl,
          model: config.model,
          messages,
          signal: controller.signal,
          fetchFn,
        });
        break;

      case 'groq':
      case 'openai':
      default:
        llmResult = await callOpenAiCompatible({
          apiKey: config.apiKey,
          baseUrl: config.baseUrl,
          model: config.model,
          messages,
          signal: controller.signal,
          fetchFn,
        });
        break;
    }

    clearTimeout(timer);

    const parsed = parseQuoteResponse(llmResult.content);
    const finalTopic = parsed.topic || (topic && topic !== 'auto' ? topic : inferFallbackTopic(status));

    return {
      quote: parsed.quote,
      author: parsed.author,
      topic: finalTopic,
      status: status || null,
      model: llmResult.model || config.model,
      language: safeLang,
      timestamp: Date.now(),
    };
  } catch (error) {
    console.warn(`[LLM Quote] Generation via ${config.provider} failed (${error.message}). Falling back to offline quote.`);
    const fallback = getOfflineFallbackQuote({ topic, lang: safeLang, status });
    return {
      quote: fallback.quote,
      author: fallback.author,
      topic: fallback.topic,
      status: status || null,
      model: 'offline-fallback',
      language: safeLang,
      timestamp: Date.now(),
    };
  }
}
