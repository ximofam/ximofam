import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getOfflineFallbackQuote,
  inferFallbackTopic,
  buildQuotePrompt,
  parseQuoteResponse,
  resolveProviderConfig,
  generateQuote,
} from '../api/lib/llmQuote.js';

describe('LLM Quote Generator', () => {
  describe('inferFallbackTopic', () => {
    it('infers motivation for sadness/stress status', () => {
      assert.equal(inferFallbackTopic('Hôm nay tôi buồn'), 'motivation');
      assert.equal(inferFallbackTopic('Feeling stressed and tired'), 'motivation');
    });

    it('infers coding for tech/bug status', () => {
      assert.equal(inferFallbackTopic('fixing memory leak'), 'coding');
      assert.equal(inferFallbackTopic('deploying api server'), 'coding');
    });

    it('infers life for general status', () => {
      assert.equal(inferFallbackTopic('walking in the park'), 'life');
    });
  });

  describe('getOfflineFallbackQuote', () => {
    it('returns a valid quote for coding in English by default', () => {
      const q = getOfflineFallbackQuote({ topic: 'coding', lang: 'en' });
      assert.ok(q.quote && q.quote.length > 0);
      assert.ok(q.author && q.author.length > 0);
      assert.equal(q.topic, 'coding');
      assert.equal(q.language, 'en');
    });

    it('returns Vietnamese quote when requested', () => {
      const q = getOfflineFallbackQuote({ topic: 'coding', lang: 'vi' });
      assert.ok(q.quote && q.quote.length > 0);
      assert.equal(q.language, 'vi');
    });

    it('auto-deduces fallback topic from status if topic is auto', () => {
      const q = getOfflineFallbackQuote({ topic: 'auto', status: 'Hôm nay tôi buồn', lang: 'vi' });
      assert.equal(q.topic, 'motivation');
      assert.equal(q.language, 'vi');
    });
  });

  describe('resolveProviderConfig', () => {
    it('auto-detects Gemini from GEMINI_API_KEY', () => {
      const config = resolveProviderConfig({ env: { GEMINI_API_KEY: 'gem-123' } });
      assert.equal(config.provider, 'gemini');
      assert.equal(config.apiKey, 'gem-123');
      assert.equal(config.model, 'gemini-3.6-flash');
    });

    it('auto-detects Groq from GROQ_API_KEY', () => {
      const config = resolveProviderConfig({ env: { GROQ_API_KEY: 'gsk-123' } });
      assert.equal(config.provider, 'groq');
      assert.equal(config.apiKey, 'gsk-123');
      assert.equal(config.model, 'llama-3.3-70b-versatile');
    });

    it('auto-detects Claude from ANTHROPIC_API_KEY', () => {
      const config = resolveProviderConfig({ env: { ANTHROPIC_API_KEY: 'sk-ant-123' } });
      assert.equal(config.provider, 'claude');
      assert.equal(config.apiKey, 'sk-ant-123');
      assert.equal(config.model, 'claude-3-5-haiku-20241022');
    });

    it('respects explicit provider parameter override', () => {
      const config = resolveProviderConfig({
        provider: 'claude',
        apiKey: 'custom-key',
        env: { OPENAI_API_KEY: 'sk-openai' },
      });
      assert.equal(config.provider, 'claude');
      assert.equal(config.apiKey, 'custom-key');
    });
  });

  describe('buildQuotePrompt', () => {
    it('constructs prompt instructing auto-deduction when topic is auto', () => {
      const messages = buildQuotePrompt({
        topic: 'auto',
        status: 'Hôm nay tôi buồn',
        lang: 'vi',
      });

      assert.equal(messages.length, 2);
      assert.equal(messages[0].role, 'system');
      assert.match(messages[0].content, /JSON/);
      assert.equal(messages[1].role, 'user');
      assert.match(messages[1].content, /Hôm nay tôi buồn/);
      assert.match(messages[1].content, /automatically determine/);
    });
  });

  describe('parseQuoteResponse', () => {
    it('parses pure JSON string with topic and tone', () => {
      const json = JSON.stringify({
        quote: 'Every storm runs out of rain.',
        author: 'Maya Angelou',
        topic: 'healing',
        tone: 'empathetic',
      });
      const res = parseQuoteResponse(json);
      assert.deepEqual(res, {
        quote: 'Every storm runs out of rain.',
        author: 'Maya Angelou',
        topic: 'healing',
        tone: 'empathetic',
      });
    });

    it('parses markdown-fenced JSON string', () => {
      const md = '```json\n{"quote": "Talk is cheap.", "author": "Linus Torvalds"}\n```';
      const res = parseQuoteResponse(md);
      assert.equal(res.quote, 'Talk is cheap.');
      assert.equal(res.author, 'Linus Torvalds');
    });

    it('extracts JSON when surrounded by commentary', () => {
      const text = 'Here is your quote:\n{"quote": "Stay hungry, stay foolish.", "author": "Steve Jobs"}\nHope you like it!';
      const res = parseQuoteResponse(text);
      assert.equal(res.quote, 'Stay hungry, stay foolish.');
    });

    it('extracts quote from array formatted responses', () => {
      const arr = '[{"quote": "Simplicity is prerequisite for reliability.", "author": "Dijkstra"}]';
      const res = parseQuoteResponse(arr);
      assert.equal(res.quote, 'Simplicity is prerequisite for reliability.');
      assert.equal(res.author, 'Dijkstra');
    });

    it('recovers quote from bullet point text e.g. *: "The best error message"', () => {
      const text = '*: "The best error message is the one that never shows up."';
      const res = parseQuoteResponse(text);
      assert.equal(res.quote, 'The best error message is the one that never shows up.');
      assert.equal(res.author, 'AI Inspiration');
    });

    it('throws error when string has no quote pattern at all', () => {
      assert.throws(() => parseQuoteResponse('No quote here at all.'), /Failed to parse/);
    });
  });

  describe('generateQuote across providers', () => {
    it('returns offline quote with model "offline-fallback" when no apiKey is given', async () => {
      const res = await generateQuote({ apiKey: '', env: {} });
      assert.ok(res.quote);
      assert.ok(res.author);
      assert.equal(res.model, 'offline-fallback');
      assert.equal(res.language, 'en');
      assert.ok(typeof res.timestamp === 'number');
    });

    it('generates quote successfully via Google Gemini with auto-deduced topic', async () => {
      const mockGeminiFetch = async (url, opts) => {
        assert.match(url, /generativelanguage\.googleapis\.com/);
        assert.equal(opts.method, 'POST');
        return {
          ok: true,
          status: 200,
          json: async () => ({
            modelVersion: 'gemini-2.0-flash',
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: JSON.stringify({
                        quote: 'Sau cơn mưa trời lại sáng.',
                        author: 'Tục ngữ',
                        topic: 'healing',
                        tone: 'soothing',
                      }),
                    },
                  ],
                },
              },
            ],
          }),
        };
      };

      const res = await generateQuote({
        provider: 'gemini',
        status: 'Hôm nay tôi buồn',
        lang: 'vi',
        apiKey: 'gemini-test-key',
        fetchFn: mockGeminiFetch,
      });

      assert.equal(res.quote, 'Sau cơn mưa trời lại sáng.');
      assert.equal(res.topic, 'healing');
      assert.equal(res.model, 'gemini-2.0-flash');
    });

    it('generates quote successfully via Anthropic Claude', async () => {
      const mockClaudeFetch = async (url, opts) => {
        assert.match(url, /api\.anthropic\.com/);
        assert.equal(opts.headers['x-api-key'], 'claude-test-key');
        return {
          ok: true,
          status: 200,
          json: async () => ({
            model: 'claude-3-5-haiku-20241022',
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  quote: 'Before software can be reusable it first has to be usable.',
                  author: 'Ralph Johnson',
                }),
              },
            ],
          }),
        };
      };

      const res = await generateQuote({
        provider: 'claude',
        apiKey: 'claude-test-key',
        fetchFn: mockClaudeFetch,
      });

      assert.equal(res.quote, 'Before software can be reusable it first has to be usable.');
      assert.equal(res.model, 'claude-3-5-haiku-20241022');
    });

    it('generates quote successfully via Groq / OpenAI', async () => {
      const mockGroqFetch = async (url, opts) => {
        assert.match(url, /chat\/completions/);
        assert.equal(opts.headers.Authorization, 'Bearer groq-key');
        return {
          ok: true,
          status: 200,
          json: async () => ({
            model: 'llama-3.3-70b-versatile',
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    quote: 'Simplicity is the soul of efficiency.',
                    author: 'Austin Freeman',
                  }),
                },
              },
            ],
          }),
        };
      };

      const res = await generateQuote({
        provider: 'groq',
        apiKey: 'groq-key',
        fetchFn: mockGroqFetch,
      });

      assert.equal(res.quote, 'Simplicity is the soul of efficiency.');
      assert.equal(res.author, 'Austin Freeman');
      assert.equal(res.model, 'llama-3.3-70b-versatile');
    });

    it('gracefully falls back to offline quote when LLM call rejects', async () => {
      const failingFetch = async () => {
        throw new Error('Connection refused');
      };

      const res = await generateQuote({
        provider: 'openai',
        status: 'Hôm nay tôi buồn',
        apiKey: 'test-key',
        fetchFn: failingFetch,
      });

      assert.ok(res.quote);
      assert.equal(res.model, 'offline-fallback');
      assert.equal(res.topic, 'motivation');
    });
  });
});
