// api/lib/cardCanvas.js
import { getThemeColors, getSpotifyLogoSvg, escapeXml, truncate } from './utils.js';

/**
 * Deep Module: Encapsulates SVG document framing, gradient definitions,
 * theme resolution, typography, and Spotify branding.
 *
 * @param {Object} options
 * @param {number} [options.width=420] - Card width in pixels
 * @param {number} options.height - Card height in pixels
 * @param {string} [options.theme='dark'] - Theme name ('dark' | 'light')
 * @param {string} options.content - Inner Widget Content SVG markup
 * @param {string} [options.defs=''] - Custom clipPaths, gradients or filters
 * @param {string} [options.extraStyles=''] - Custom keyframe animations or widget CSS
 * @param {boolean} [options.showLogo=true] - Whether to render Spotify brand logo
 * @param {Object} [options.logoCoords={ x: 380, y: 18, scale: 0.8 }] - Custom logo placement
 * @returns {string} Complete SVG string
 */
export function renderCardCanvas({
  width = 420,
  height,
  theme = 'dark',
  content = '',
  defs = '',
  extraStyles = '',
  showLogo = true,
  logoCoords = { x: 380, y: 18, scale: 0.8 },
} = {}) {
  const colors = getThemeColors(theme);
  const cardHeight = height || 120;

  const logoSvg = showLogo
    ? getSpotifyLogoSvg(
        logoCoords.x ?? 380,
        logoCoords.y ?? 18,
        logoCoords.scale ?? 0.8,
        colors.brand
      )
    : '';

  return `<svg width="${width}" height="${cardHeight}" viewBox="0 0 ${width} ${cardHeight}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="card-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${colors.bgStart}" />
      <stop offset="100%" stop-color="${colors.bgEnd}" />
    </linearGradient>
    ${defs}
  </defs>

  <style>
    text {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }
    .header-status {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 1.5px;
      text-transform: uppercase;
    }
    .header-title {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      fill: ${colors.brand};
    }
    .song-title {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      font-size: 15px;
      font-weight: 700;
    }
    .artist-name {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      font-size: 13px;
      font-weight: 400;
    }
    .time-text {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      font-size: 10px;
      font-weight: 500;
    }
    ${extraStyles}
  </style>

  <!-- Card Background -->
  <rect width="${width}" height="${cardHeight}" rx="12" fill="url(#card-grad)" stroke="${colors.border}" stroke-width="1" />

  <!-- Inner Widget Content -->
  ${content}

  <!-- Spotify Brand Logo -->
  ${logoSvg}
</svg>`;
}

/**
 * Renders a consistent error/fallback card using the Card Canvas
 *
 * @param {Object} options
 * @param {string} [options.title='Spotify Widget'] - Header title
 * @param {string} [options.message='Failed to load'] - Error description
 * @param {string} [options.theme='dark'] - Theme name
 * @param {number} [options.width=420] - Card width
 * @param {number} [options.height=120] - Card height
 * @returns {string} Error SVG string
 */
export function renderErrorCard({
  title = 'Spotify Widget',
  message = 'Failed to load status',
  theme = 'dark',
  width = 420,
  height = 120,
} = {}) {
  const colors = getThemeColors(theme);
  const safeTitle = escapeXml(truncate(title, 34));
  const safeMsg = escapeXml(truncate(message, 45));

  const content = `
    <!-- Status Indicator -->
    <circle cx="28" cy="32" r="4" fill="#E3B341" />
    <text x="40" y="36" class="header-status" fill="#E3B341">SETUP / ERROR</text>

    <!-- Error Title & Detail -->
    <text x="28" y="66" class="song-title" fill="${colors.title}">${safeTitle}</text>
    <text x="28" y="88" class="artist-name" fill="${colors.artist}">${safeMsg}</text>
  `;

  return renderCardCanvas({
    width,
    height,
    theme,
    content,
    showLogo: true,
    logoCoords: { x: width - 38, y: 18, scale: 0.8 },
  });
}
