// api/top-tracks.js
import { getTopTracks } from './lib/spotify.js';
import { renderTopTracks } from './lib/renderTopTracks.js';

/**
 * Serverless function to get top tracks and render an SVG card
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

    const range = query.range || 'short_term';
    const limit = parseInt(query.limit, 10) || 5;
    const theme = query.theme || 'dark';

    const data = await getTopTracks(range, limit);

    // Return JSON if requested
    if (query.format === 'json') {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.end(JSON.stringify(data, null, 2));
      return;
    }

    // Render SVG
    const svg = renderTopTracks(data, { theme });

    res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
    // Cache for 1 hour since top tracks don't change by the second
    res.setHeader(
      'Cache-Control',
      'public, max-age=0, s-maxage=3600, stale-while-revalidate=7200, must-revalidate'
    );
    res.end(svg);
  } catch (error) {
    console.error('Spotify Top Tracks API Error:', error);

    const fallbackSvg = renderTopTracks({
      status: 'error',
      error: error.message || 'Failed to fetch top tracks',
      tracks: [],
    });

    res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.end(fallbackSvg);
  }
}
