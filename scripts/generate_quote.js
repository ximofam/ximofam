#!/usr/bin/env node

/**
 * scripts/generate_quote
 * Fetches user custom status from GitHub GraphQL API,
 * calls the quote generation API (with fallback), and updates README.md.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const START_TAG = '<!-- DAILY_QUOTE:START -->';
const END_TAG = '<!-- DAILY_QUOTE:END -->';
const HEADER_START_TAG = '<!-- DAILY_QUOTE_HEADER:START -->';
const HEADER_END_TAG = '<!-- DAILY_QUOTE_HEADER:END -->';

const GITHUB_USERNAME = process.env.GITHUB_USERNAME || 'ximofam';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const QUOTE_API_URL = process.env.QUOTE_API_URL || 'https://my-github-widget.vercel.app/quote';
const README_PATH = process.env.README_PATH || resolve(__dirname, '../README.md');

/**
 * Get formatted current timestamp in GMT+7 (Asia/Ho_Chi_Minh)
 */
function getFormattedTimestamp() {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(new Date());

  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return `${map.year}-${map.month}-${map.day} ${map.hour}:${map.minute}:${map.second} (GMT+7)`;
}

/**
 * Fetches user custom status message via GitHub GraphQL API
 */
async function fetchGitHubStatus(username, token) {
  if (!token) {
    console.log('[Status] No GITHUB_TOKEN provided; skipping GitHub status lookup.');
    return null;
  }

  const query = `
    query($login: String!) {
      user(login: $login) {
        status {
          message
          emoji
        }
      }
    }
  `;

  try {
    const res = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'github-profile-quote-bot',
      },
      body: JSON.stringify({ query, variables: { login: username } }),
    });

    if (!res.ok) {
      console.warn(`[Status] GitHub GraphQL returned HTTP ${res.status}`);
      return null;
    }

    const json = await res.json();
    const statusData = json?.data?.user?.status;
    if (!statusData) {
      console.log(`[Status] User @${username} does not have an active status.`);
      return null;
    }

    const segments = [];
    if (statusData.emoji) segments.push(statusData.emoji);
    if (statusData.message) segments.push(statusData.message);
    const result = segments.join(' ').trim();

    console.log(`[Status] Fetched status for @${username}: "${result}"`);
    return result || null;
  } catch (err) {
    console.warn(`[Status] Failed to query GitHub GraphQL:`, err.message);
    return null;
  }
}

/**
 * Escapes HTML entities for safe rendering in table cells
 */
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Calls the Quote Generator API with smart offline fallback
 */
async function fetchQuote({ status, apiUrl }) {
  const url = new URL(apiUrl);
  if (status) {
    url.searchParams.set('status', status);
    url.searchParams.set('topic', 'auto');
  } else {
    // When no GitHub status is found, default topic to 'coding' and tone to 'inspirational'
    url.searchParams.set('topic', 'coding');
    url.searchParams.set('tone', 'inspirational');
  }

  console.log(`[Quote] Querying API endpoint: ${url.toString()}`);

  try {
    const res = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'github-profile-quote-bot',
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.quote) {
        return {
          quote: data.quote,
          author: data.author || 'Unknown',
          model: data.model || 'llm',
          status: data.status || status,
        };
      }
    }
    console.warn(`[Quote] API returned status ${res.status}. Using fallback catalog.`);
  } catch (err) {
    console.warn(`[Quote] API request failed (${err.message}). Using fallback catalog.`);
  }

  // Resilient fallback quotes (focused on inspirational coding)
  const FALLBACKS = [
    { quote: "Talk is cheap. Show me the code.", author: "Linus Torvalds", model: "offline-fallback" },
    { quote: "First, solve the problem. Then, write the code.", author: "John Johnson", model: "offline-fallback" },
    { quote: "Make it work, make it right, make it fast.", author: "Kent Beck", model: "offline-fallback" },
    { quote: "Simplicity is prerequisite for reliability.", author: "Edsger W. Dijkstra", model: "offline-fallback" },
    { quote: "Any fool can write code that a computer can understand. Good programmers write code that humans can understand.", author: "Martin Fowler", model: "offline-fallback" },
    { quote: "The only way to go fast, is to go well.", author: "Robert C. Martin", model: "offline-fallback" },
  ];

  const picked = FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)];
  return {
    ...picked,
    status: status || null,
  };
}

/**
 * Formats quote header content with title, provider, and timestamp
 */
function formatQuoteHeader(quoteData) {
  const timestamp = getFormattedTimestamp();
  const modelText = quoteData.model || 'offline-fallback';
  const statusLine = quoteData.status ? `💬 Status: <em>${escapeHtml(quoteData.status)}</em> • ` : '';

  return `      💬 Quote of the Day &nbsp; <sub>${statusLine}🤖 Provider: <code>${escapeHtml(modelText)}</code> • 🕒 Updated: <code>${timestamp}</code></sub>`;
}

/**
 * Formats quote body into clean HTML paragraph
 */
function formatQuoteBody(quoteData) {
  const quoteText = quoteData.quote.replace(/^["“”']+|["“”']+$/g, '').trim();
  const authorText = quoteData.author.trim();

  return `      <p align="left">
        <em>“${escapeHtml(quoteText)}”</em>
      </p>
      <p align="right">
        — <strong>${escapeHtml(authorText)}</strong>
      </p>`;
}

/**
 * Updates README content between delimiter tags
 */
function updateReadme(currentContent, quoteData) {
  let content = currentContent;

  const headerBlock = formatQuoteHeader(quoteData);
  const bodyBlock = formatQuoteBody(quoteData);

  const hStart = content.indexOf(HEADER_START_TAG);
  const hEnd = content.indexOf(HEADER_END_TAG);
  if (hStart !== -1 && hEnd !== -1 && hEnd > hStart) {
    const beforeH = content.substring(0, hStart);
    const afterH = content.substring(hEnd + HEADER_END_TAG.length);
    content = `${beforeH}${HEADER_START_TAG}\n${headerBlock}\n      ${HEADER_END_TAG}${afterH}`;
  }

  const bStart = content.indexOf(START_TAG);
  const bEnd = content.indexOf(END_TAG);
  if (bStart !== -1 && bEnd !== -1 && bEnd > bStart) {
    const beforeB = content.substring(0, bStart);
    const afterB = content.substring(bEnd + END_TAG.length);
    content = `${beforeB}${START_TAG}\n${bodyBlock}\n      ${END_TAG}${afterB}`;
  }

  return content;
}

async function main() {
  console.log('--- Starting Daily Quote Generator ---');
  console.log(`Target user: @${GITHUB_USERNAME}`);
  console.log(`README path: ${README_PATH}`);

  const status = await fetchGitHubStatus(GITHUB_USERNAME, GITHUB_TOKEN);
  const quoteData = await fetchQuote({ status, apiUrl: QUOTE_API_URL });

  console.log('[Generated Quote]:', quoteData);

  let currentContent = '';
  try {
    currentContent = readFileSync(README_PATH, 'utf-8');
  } catch (err) {
    console.error(`Failed to read README at ${README_PATH}:`, err.message);
    process.exit(1);
  }

  const updatedContent = updateReadme(currentContent, quoteData);
  writeFileSync(README_PATH, updatedContent, 'utf-8');

  console.log('Successfully updated README.md with the latest quote!');
}

main().catch((err) => {
  console.error('Fatal error in generate_quote:', err);
  process.exit(1);
});
