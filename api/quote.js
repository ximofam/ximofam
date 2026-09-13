// api/quote.js
import { generateQuote } from './lib/llmQuote.js';
import { parseQueryParams, setNoCacheHeaders } from './lib/utils.js';

export default async function handler(req, res) {
  try {
    const query = parseQueryParams(req);

    const status = query.status || null;
    const topic = query.topic || query.category || (status ? 'auto' : 'coding');
    const isVietnamese = status && /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(status);
    const lang = query.lang || (isVietnamese ? 'vi' : 'en');
    const tone = query.tone || (status ? 'auto' : 'inspirational');
    const provider = query.provider || undefined;

    const result = await generateQuote({
      topic,
      status,
      lang,
      tone,
      provider,
    });

    setNoCacheHeaders(res, 'application/json; charset=utf-8');
    res.end(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Quote API Error:', error);

    setNoCacheHeaders(res, 'application/json; charset=utf-8');
    res.statusCode = 500;
    res.end(
      JSON.stringify({
        error: 'Failed to generate quote',
        message: error.message,
      })
    );
  }
}
