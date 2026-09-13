// api/lib/renderTopTracks.js
import { escapeXml, truncate, getThemeColors } from './utils.js';
import { renderCardCanvas, renderErrorCard } from './cardCanvas.js';

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
 * Generates stepped keyframes for smooth auto-scrolling
 */
function generateScrollKeyframes(trackCount, rowHeight) {
  const step = 100 / trackCount;
  let keyframes = '';

  for (let i = 0; i < trackCount; i++) {
    const start = (i * step).toFixed(1);
    const pauseEnd = (i * step + step * 0.75).toFixed(1);
    const currentY = -(i * rowHeight);

    keyframes += `    ${start}%, ${pauseEnd}% { transform: translateY(${currentY}px); }\n`;
  }

  const finalY = -(trackCount * rowHeight);
  keyframes += `    100% { transform: translateY(${finalY}px); }`;
  return keyframes;
}

/**
 * Renders user's top tracks as an SVG card with smooth vertical auto-scrolling
 */
export function renderTopTracks(data, options = {}) {
  const {
    status = 'success',
    timeRange = 'short_term',
    tracks = [],
    error = null,
  } = data || {};

  const contentTracks = status === 'success' ? tracks : [];

  // Delegate error states and empty results to the standard error card seam
  if (status !== 'success' || contentTracks.length === 0) {
    const errorMsg =
      error || (status === 'unconfigured' ? 'Run `yarn auth` to configure Spotify' : 'No top tracks found');
    return renderErrorCard({
      title: 'Top Spotify Tracks',
      message: errorMsg,
      theme: options.theme,
      height: 140,
    });
  }

  const colors = getThemeColors(options.theme);
  const rangeBadgeText = RANGE_LABELS[timeRange] || 'TOP TRACKS';
  const rowHeight = 48;
  const headerHeight = 52;
  const bottomPadding = 8;
  const visibleCount = 4; // Show top 4 at a time

  // Determine if auto-scroll is needed
  const shouldScroll = contentTracks.length > visibleCount;
  const displayedCount = Math.min(contentTracks.length, visibleCount);
  const viewportHeight = displayedCount * rowHeight;
  const cardHeight = headerHeight + viewportHeight + bottomPadding;

  // If scrolling, duplicate first `visibleCount` tracks at the bottom for seamless infinite loop
  const scrollItems = shouldScroll
    ? [...contentTracks, ...contentTracks.slice(0, visibleCount)]
    : contentTracks;

  // Animation duration: ~2.8s per track
  const animDuration = Math.max(12, contentTracks.length * 2.8);

  // Generate SVG definitions for clip paths
  const clipDefs = scrollItems
    .map(
      (_, index) => `
      <clipPath id="track-clip-${index}">
        <rect x="50" y="${headerHeight + index * rowHeight + 6}" width="36" height="36" rx="6" />
      </clipPath>`
    )
    .join('\n');

  // Generate track rows
  const trackRows = scrollItems
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
        index < scrollItems.length - 1
          ? `<line x1="24" y1="${rowY + rowHeight}" x2="396" y2="${rowY + rowHeight}" stroke="${colors.divider}" stroke-width="1" />`
          : '';

      return `
      <!-- Track Row ${track.rank} (index ${index}) -->
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

  // Keyframes and CSS
  const scrollKeyframes = shouldScroll
    ? `
    @keyframes autoScrollTracks {
${generateScrollKeyframes(contentTracks.length, rowHeight)}
    }
    .track-scroller {
      animation: autoScrollTracks ${animDuration}s cubic-bezier(0.65, 0, 0.35, 1) infinite;
    }
    svg:hover .track-scroller {
      animation-play-state: paused;
    }
    .badge-paused {
      display: none;
    }
    svg:hover .badge-auto {
      display: none;
    }
    svg:hover .badge-paused {
      display: inline;
    }
  `
    : '';

  const headerTitleText = contentTracks.length > visibleCount
    ? `TOP ${contentTracks.length} TRACKS`
    : 'TOP TRACKS';

  const defs = `
    <!-- Viewport clip path to constrain visible tracks to 4 rows -->
    <clipPath id="viewport-clip">
      <rect x="0" y="${headerHeight}" width="420" height="${viewportHeight}" />
    </clipPath>
    ${clipDefs}
  `;

  const extraStyles = `
    .badge-text {
      font-size: 9px;
      font-weight: 600;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      fill: ${colors.badgeText};
    }
    .rank-num {
      font-size: 13px;
      font-weight: 700;
    }
    .track-title {
      font-size: 13px;
      font-weight: 600;
    }
    .track-artist {
      font-size: 11px;
      font-weight: 400;
    }
    .track-row {
      cursor: pointer;
    }
    .track-row:hover .track-title {
      fill: ${colors.brand};
      transition: fill 0.2s ease;
    }
    ${scrollKeyframes}
  `;

  const content = `
    <!-- Viewport for Track List (Shows 4 at a time with smooth infinite auto-scroll) -->
    <g clip-path="url(#viewport-clip)">
      <g class="${shouldScroll ? 'track-scroller' : ''}">
        ${trackRows}
      </g>
    </g>

    <!-- Header Background Shield to ensure clean top boundary -->
    <path d="M1 12C1 5.92487 5.92487 1 12 1H408C414.075 1 419 5.92487 419 12V${headerHeight}H1V12Z" fill="${colors.headerBg}" />
    <line x1="1" y1="${headerHeight}" x2="419" y2="${headerHeight}" stroke="${colors.divider}" stroke-width="1" />

    <!-- Header Content -->
    <g class="header">
      <text x="24" y="32" class="header-title">${headerTitleText}</text>
      
      <!-- Time range pill badge -->
      <rect x="132" y="20" width="105" height="18" rx="9" fill="${colors.badgeBg}" />
      <text x="184" y="32" class="badge-text" text-anchor="middle">${rangeBadgeText}</text>

      ${
        shouldScroll
          ? `
      <!-- Auto-scroll indicator badge with paused toggle on hover -->
      <rect x="244" y="20" width="68" height="18" rx="9" fill="${colors.badgeBg}" />
      <text x="278" y="32" class="badge-text badge-auto" text-anchor="middle">↕ AUTO</text>
      <text x="278" y="32" class="badge-text badge-paused" text-anchor="middle" fill="#E3B341">⏸ PAUSED</text>
      `
          : ''
      }
    </g>
  `;

  return renderCardCanvas({
    width: 420,
    height: cardHeight,
    theme: options.theme,
    defs,
    extraStyles,
    content,
    logoCoords: { x: 380, y: 20, scale: 0.75 },
  });
}
