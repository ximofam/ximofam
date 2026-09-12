// api/top-tracks.js
import { getTopTracks } from './lib/spotify.js';
import { renderTopTracks } from './lib/renderTopTracks.js';
import { parseQueryParams, setCacheHeaders, setNoCacheHeaders } from './lib/utils.js';

/**
 * Serverless function to get top tracks and render an SVG card
 */
export default async function handler(req, res) {
  try {
    const query = parseQueryParams(req);
    const range = query.range || 'short_term';
    const limit = parseInt(query.limit, 10) || 10;
    const theme = query.theme || 'dark';

    const data = await getTopTracks(range, limit);

    // Return JSON if requested
    if (query.format === 'json') {
      setNoCacheHeaders(res, 'application/json; charset=utf-8');
      res.end(JSON.stringify(data, null, 2));
      return;
    }

    // Render SVG
    const svg = renderTopTracks(data, { theme });

    // Cache for 1 hour since top tracks do not change by the second
    setCacheHeaders(res, 'image/svg+xml; charset=utf-8', 3600, 7200);
    res.end(svg);
  } catch (error) {
    console.error('Spotify Top Tracks API Error:', error);

    const fallbackSvg = renderTopTracks({
      status: 'error',
      error: error.message || 'Failed to fetch top tracks',
      tracks: [],
    });

    setNoCacheHeaders(res, 'image/svg+xml; charset=utf-8');
    res.end(fallbackSvg);
  }
}
