// api/lib/utils.js

/**
 * Escapes characters for XML/SVG safety
 */
export function escapeXml(unsafe) {
  return (unsafe || '')
    .toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Truncates string to a max character count
 */
export function truncate(str, maxLen) {
  if (!str) return '';
  return str.length > maxLen ? str.slice(0, maxLen - 1) + '…' : str;
}

/**
 * Formats milliseconds into M:SS string
 */
export function formatTime(ms) {
  if (!ms || ms <= 0) return '0:00';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

/**
 * Calculates human-readable relative time (e.g. "3m ago", "1h ago")
 */
export function getRelativeTime(dateString) {
  if (!dateString) return '';
  const now = new Date();
  const played = new Date(dateString);
  const diffMs = now - played;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffDay > 0) return `${diffDay}d ago`;
  if (diffHour > 0) return `${diffHour}h ago`;
  if (diffMin > 0) return `${diffMin}m ago`;
  return 'Just now';
}

/**
 * Common color palettes for Dark and Light themes
 */
export function getThemeColors(theme = 'dark') {
  const isLight = theme === 'light';
  return isLight
    ? {
        isLight: true,
        bgStart: '#F6F8FA',
        bgEnd: '#FFFFFF',
        headerBg: '#F6F8FA',
        border: '#D0D7DE',
        title: '#1F2328',
        artist: '#59636E',
        time: '#656D76',
        barBg: '#EAEBEF',
        divider: '#EAEBEF',
        badgeBg: '#EAEBEF',
        badgeText: '#57606A',
        rankOther: '#8C959F',
        brand: '#1DB954',
        statusRecent: '#6E7681',
      }
    : {
        isLight: false,
        bgStart: '#0D1117',
        bgEnd: '#161B22',
        headerBg: '#0D1117',
        border: '#30363D',
        title: '#F0F6FC',
        artist: '#8B949E',
        time: '#7D8590',
        barBg: '#21262D',
        divider: '#21262D',
        badgeBg: '#21262D',
        badgeText: '#8B949E',
        rankOther: '#6E7681',
        brand: '#1DB954',
        statusRecent: '#8B949E',
      };
}

/**
 * Reusable Spotify brand logo SVG element
 */
export function getSpotifyLogoSvg(x = 380, y = 18, scale = 0.8, fill = '#1DB954') {
  return `
  <g transform="translate(${x}, ${y}) scale(${scale})">
    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.497 17.305c-.215.352-.676.463-1.028.248-2.813-1.718-6.353-2.107-10.525-1.154-.403.092-.807-.16-.9-.562-.091-.403.16-.807.563-.9 4.568-1.044 8.483-.604 11.642 1.339.352.215.463.677.248 1.029zm1.467-3.26c-.27.44-.849.577-1.288.307-3.22-1.979-8.13-2.551-11.939-1.394-.496.15-1.023-.134-1.174-.63-.151-.496.134-1.024.63-1.175 4.356-1.322 9.776-.682 13.464 1.583.44.27.577.849.307 1.309zm.126-3.398C15.234 8.358 8.874 8.148 5.163 9.274c-.59.18-1.218-.16-1.398-.75-.18-.59.16-1.218.75-1.398 4.254-1.291 11.278-1.045 15.748 1.61.53.315.703 1.002.388 1.533-.314.53-1.002.703-1.56.378z" fill="${fill}"/>
  </g>`;
}

/**
 * Reusable helper to parse query parameters from Vercel req or standard Node http req
 */
export function parseQueryParams(req) {
  if (req && req.query) {
    return req.query;
  }
  if (req && req.url) {
    const parsedUrl = new URL(req.url, `http://${req.headers?.host || 'localhost'}`);
    return Object.fromEntries(parsedUrl.searchParams.entries());
  }
  return {};
}

/**
 * Sets strict no-cache headers (for real-time Spotify Presence)
 */
export function setNoCacheHeaders(res, contentType = 'image/svg+xml; charset=utf-8') {
  res.setHeader('Content-Type', contentType);
  res.setHeader('Cache-Control', 'max-age=0, s-maxage=0, no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
}

/**
 * Sets cache headers for static or slowly-changing endpoints (for Top Tracks)
 */
export function setCacheHeaders(
  res,
  contentType = 'image/svg+xml; charset=utf-8',
  sMaxAge = 3600,
  staleWhileRevalidate = 7200
) {
  res.setHeader('Content-Type', contentType);
  res.setHeader(
    'Cache-Control',
    `public, max-age=0, s-maxage=${sMaxAge}, stale-while-revalidate=${staleWhileRevalidate}, must-revalidate`
  );
}
