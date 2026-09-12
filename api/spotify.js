// api/spotify.js
import { getSpotifyPresence } from './lib/spotify.js';
import { renderCard } from './lib/renderCard.js';

/**
 * Serverless Function handler for Vercel and local dev server
 */
export default async function handler(req, res) {
  try {
    // Parse query parameters
    let query = {};
    if (req.query) {
      query = req.query;
    } else if (req.url) {
      const parsedUrl = new URL(req.url, `http://${req.headers?.host || 'localhost'}`);
      query = Object.fromEntries(parsedUrl.searchParams.entries());
    }

    const presence = await getSpotifyPresence();

    // 1. If redirect=true, redirect to song on Spotify
    if (query.redirect === 'true' || query.redirect === '1') {
      res.writeHead(302, {
        Location: presence.songUrl || 'https://open.spotify.com',
      });
      res.end();
      return;
    }

    // 2. If format=json, return raw JSON
    if (query.format === 'json') {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Cache-Control', 'max-age=0, s-maxage=0, no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.end(JSON.stringify(presence, null, 2));
      return;
    }

    // 3. Default: Render SVG card for GitHub Profile
    const svg = renderCard(presence, {
      theme: query.theme || 'dark',
    });

    // Disable caching completely so GitHub Camo proxy always fetches fresh data
    res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
    res.setHeader(
      'Cache-Control',
      'max-age=0, s-maxage=0, no-cache, no-store, must-revalidate'
    );
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.end(svg);
  } catch (error) {
    console.error('Spotify API Error:', error);

    // Fallback error SVG so GitHub doesn't show a broken image icon
    const fallbackSvg = renderCard({
      status: 'error',
      isPlaying: false,
      title: 'Spotify Presence',
      artist: error.message || 'Failed to fetch status',
    });

    res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
    res.setHeader('Cache-Control', 'max-age=0, s-maxage=0, no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.end(fallbackSvg);
  }
}
