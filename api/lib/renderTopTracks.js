// api/lib/renderTopTracks.js

/**
 * Escapes characters for XML/SVG safety
 */
function escapeXml(unsafe) {
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
function truncate(str, maxLen) {
  if (!str) return '';
  return str.length > maxLen ? str.slice(0, maxLen - 1) + '…' : str;
}

const RANGE_LABELS = {
  short_term: 'LAST 4 WEEKS',
  medium_term: 'LAST 6 MONTHS',
  long_term: 'ALL TIME',
};

const RANK_COLORS = {
  1: '#F1E05A', // Gold
  2: '#C9D1D9', // Silver
  3: '#D29922', // Bronze
};

/**
 * Renders user's top tracks as an SVG card
 */
export function renderTopTracks(data, options = {}) {
  const isLight = options.theme === 'light';

  const colors = isLight
    ? {
        bgStart: '#F6F8FA',
        bgEnd: '#FFFFFF',
        border: '#D0D7DE',
        title: '#1F2328',
        artist: '#59636E',
        rankOther: '#8C959F',
        divider: '#EAEBEF',
        badgeBg: '#EAEBEF',
        badgeText: '#57606A',
        brand: '#1DB954',
      }
    : {
        bgStart: '#0D1117',
        bgEnd: '#161B22',
        border: '#30363D',
        title: '#F0F6FC',
        artist: '#8B949E',
        rankOther: '#6E7681',
        divider: '#21262D',
        badgeBg: '#21262D',
        badgeText: '#8B949E',
        brand: '#1DB954',
      };

  const {
    status = 'success',
    timeRange = 'short_term',
    tracks = [],
    error = null,
  } = data || {};

  const rangeBadgeText = RANGE_LABELS[timeRange] || 'TOP TRACKS';
  const rowHeight = 48;
  const headerHeight = 52;
  const bottomPadding = 12;

  // Compute card height dynamically based on track count
  const contentTracks = status === 'success' ? tracks : [];
  const cardHeight = Math.max(140, headerHeight + Math.max(1, contentTracks.length) * rowHeight + bottomPadding);

  // If unconfigured or error
  if (status !== 'success' || contentTracks.length === 0) {
    const errorMsg = error || (status === 'unconfigured' ? 'Run `yarn auth` to configure Spotify' : 'No top tracks found');
    return `<svg width="420" height="140" viewBox="0 0 420 140" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="card-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${colors.bgStart}" />
          <stop offset="100%" stop-color="${colors.bgEnd}" />
        </linearGradient>
      </defs>
      <style>
        .title { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; font-weight: 700; fill: ${colors.title}; }
        .msg { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; fill: ${colors.artist}; }
      </style>
      <rect width="420" height="140" rx="12" fill="url(#card-grad)" stroke="${colors.border}" stroke-width="1" />
      <text x="24" y="44" class="title">Top Spotify Tracks</text>
      <text x="24" y="80" class="msg">${escapeXml(errorMsg)}</text>
    </svg>`;
  }

  // Generate SVG definitions for clip paths
  const clipDefs = contentTracks
    .map(
      (_, index) => `
      <clipPath id="track-clip-${index}">
        <rect x="50" y="${headerHeight + index * rowHeight + 6}" width="36" height="36" rx="6" />
      </clipPath>`
    )
    .join('\n');

  // Generate track rows
  const trackRows = contentTracks
    .map((track, index) => {
      const rowY = headerHeight + index * rowHeight;
      const rankColor = RANK_COLORS[track.rank] || colors.rankOther;
      const safeTitle = escapeXml(truncate(track.title, 30));
      const safeArtist = escapeXml(truncate(track.artist, 38));

      const coverImg = track.albumImageBase64
        ? `<image href="${track.albumImageBase64}" x="50" y="${rowY + 6}" width="36" height="36" clip-path="url(#track-clip-${index})" preserveAspectRatio="xMidYMid slice" />`
        : `
          <rect x="50" y="${rowY + 6}" width="36" height="36" rx="6" fill="${colors.badgeBg}" />
          <circle cx="68" cy="${rowY + 24}" r="10" fill="#18181B" />
          <circle cx="68" cy="${rowY + 24}" r="4" fill="${colors.brand}" />
        `;

      const divider =
        index < contentTracks.length - 1
          ? `<line x1="24" y1="${rowY + rowHeight}" x2="396" y2="${rowY + rowHeight}" stroke="${colors.divider}" stroke-width="1" />`
          : '';

      return `
      <!-- Track Row ${track.rank} -->
      <g class="track-row">
        <!-- Rank -->
        <text x="32" y="${rowY + 29}" class="rank-num" fill="${rankColor}" text-anchor="middle">#${track.rank}</text>
        
        <!-- Album Art -->
        ${coverImg}
        <rect x="50" y="${rowY + 6}" width="36" height="36" rx="6" fill="none" stroke="${colors.border}" stroke-width="1" />

        <!-- Track Info -->
        <text x="96" y="${rowY + 22}" class="track-title" fill="${colors.title}">${safeTitle}</text>
        <text x="96" y="${rowY + 36}" class="track-artist" fill="${colors.artist}">${safeArtist}</text>

        ${divider}
      </g>`;
    })
    .join('\n');

  return `<svg width="420" height="${cardHeight}" viewBox="0 0 420 ${cardHeight}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="card-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${colors.bgStart}" />
      <stop offset="100%" stop-color="${colors.bgEnd}" />
    </linearGradient>
    ${clipDefs}
  </defs>

  <style>
    .header-title {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      fill: ${colors.brand};
    }
    .badge-text {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      font-size: 9px;
      font-weight: 600;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      fill: ${colors.badgeText};
    }
    .rank-num {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      font-size: 13px;
      font-weight: 700;
    }
    .track-title {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      font-size: 13px;
      font-weight: 600;
    }
    .track-artist {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      font-size: 11px;
      font-weight: 400;
    }
  </style>

  <!-- Background -->
  <rect width="420" height="${cardHeight}" rx="12" fill="url(#card-grad)" stroke="${colors.border}" stroke-width="1" />

  <!-- Header -->
  <g class="header">
    <text x="24" y="32" class="header-title">TOP TRACKS</text>
    
    <!-- Time range pill badge -->
    <rect x="110" y="20" width="105" height="18" rx="9" fill="${colors.badgeBg}" />
    <text x="162" y="32" class="badge-text" text-anchor="middle">${rangeBadgeText}</text>

    <!-- Spotify Logo (Top Right) -->
    <g transform="translate(380, 20) scale(0.75)">
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.497 17.305c-.215.352-.676.463-1.028.248-2.813-1.718-6.353-2.107-10.525-1.154-.403.092-.807-.16-.9-.562-.091-.403.16-.807.563-.9 4.568-1.044 8.483-.604 11.642 1.339.352.215.463.677.248 1.029zm1.467-3.26c-.27.44-.849.577-1.288.307-3.22-1.979-8.13-2.551-11.939-1.394-.496.15-1.023-.134-1.174-.63-.151-.496.134-1.024.63-1.175 4.356-1.322 9.776-.682 13.464 1.583.44.27.577.849.307 1.309zm.126-3.398C15.234 8.358 8.874 8.148 5.163 9.274c-.59.18-1.218-.16-1.398-.75-.18-.59.16-1.218.75-1.398 4.254-1.291 11.278-1.045 15.748 1.61.53.315.703 1.002.388 1.533-.314.53-1.002.703-1.56.378z" fill="${colors.brand}"/>
    </g>
  </g>

  <!-- Track List -->
  ${trackRows}
</svg>`;
}
