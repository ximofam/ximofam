// api/lib/renderCard.js
import { escapeXml, truncate, formatTime, getThemeColors } from './utils.js';
import { renderCardCanvas, renderErrorCard } from './cardCanvas.js';

/**
 * Renders the Spotify Presence card as an SVG string
 */
export function renderCard(presence, options = {}) {
  const {
    status = 'idle',
    isPlaying = false,
    isRecentlyPlayed = false,
    title = 'Not Playing',
    artist = 'Open Spotify to listen',
    albumImageBase64 = null,
    durationMs = 0,
    progressMs = 0,
    playedAt = null,
  } = presence || {};

  // Delegate error states to the standard error card seam
  if (status === 'error') {
    return renderErrorCard({
      title: title || 'Spotify Presence',
      message: artist || 'Failed to fetch status',
      theme: options.theme,
      height: 120,
    });
  }

  const colors = getThemeColors(options.theme);
  const safeTitle = escapeXml(truncate(title, 26));
  const safeArtist = escapeXml(truncate(artist, 34));

  // Calculate progress bar
  const totalBarWidth = 205;
  const progressRatio = durationMs > 0 ? Math.min(1, Math.max(0, progressMs / durationMs)) : 0;
  const progressWidth = Math.max(4, Math.round(progressRatio * totalBarWidth));
  const progressTimeStr = `${formatTime(progressMs)} / ${formatTime(durationMs)}`;

  // Header status configuration
  let statusHeader;
  if (status === 'unconfigured') {
    statusHeader = `
      <circle cx="118" cy="22" r="3.5" fill="#E3B341" />
      <text x="128" y="26" class="header-status" fill="#E3B341">SETUP REQUIRED</text>
    `;
  } else if (isPlaying) {
    statusHeader = `
      <g class="equalizer" fill="${colors.brand}">
        <rect class="bar bar-1" x="115" y="24" width="3" height="8" rx="1.5" />
        <rect class="bar bar-2" x="120" y="19" width="3" height="13" rx="1.5" />
        <rect class="bar bar-3" x="125" y="22" width="3" height="10" rx="1.5" />
        <rect class="bar bar-4" x="130" y="25" width="3" height="7" rx="1.5" />
      </g>
      <text x="140" y="26" class="header-status" fill="${colors.brand}">NOW PLAYING</text>
    `;
  } else if (isRecentlyPlayed) {
    statusHeader = `
      <g transform="translate(115, 17) scale(0.65)">
        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm4.2 14.2L11 13V7h1.5v5.2l4.5 2.7-.8 1.3z" fill="${colors.statusRecent}" />
      </g>
      <text x="134" y="26" class="header-status" fill="${colors.statusRecent}">RECENTLY PLAYED</text>
    `;
  } else {
    statusHeader = `
      <circle cx="118" cy="22" r="3.5" fill="${colors.statusRecent}" />
      <text x="128" y="26" class="header-status" fill="${colors.statusRecent}">SPOTIFY OFFLINE</text>
    `;
  }

  // Cover art image or fallback SVG
  const coverArtContent = albumImageBase64
    ? `<image href="${albumImageBase64}" x="22" y="22" width="76" height="76" clip-path="url(#album-clip)" preserveAspectRatio="xMidYMid slice" />`
    : `
      <rect x="22" y="22" width="76" height="76" rx="8" fill="${colors.barBg}" />
      <!-- Vinyl record fallback placeholder -->
      <circle cx="60" cy="60" r="28" fill="#18181B" stroke="#27272A" stroke-width="2" />
      <circle cx="60" cy="60" r="20" fill="none" stroke="#27272A" stroke-width="1" stroke-dasharray="3 3" />
      <circle cx="60" cy="60" r="10" fill="${colors.brand}" />
      <circle cx="60" cy="60" r="3" fill="#FFFFFF" />
    `;

  // Bottom footer: Progress bar or status line
  let bottomContent;
  if (isPlaying && durationMs > 0) {
    bottomContent = `
      <rect x="115" y="88" width="${totalBarWidth}" height="4" rx="2" fill="${colors.barBg}" />
      <rect x="115" y="88" width="${progressWidth}" height="4" rx="2" fill="url(#progress-grad)" />
      <text x="330" y="92" class="time-text" fill="${colors.time}">${progressTimeStr}</text>
    `;
  } else if (isRecentlyPlayed) {
    const rawLabel = playedAt && playedAt !== 'recently' ? `Played ${playedAt}` : 'Last played song';
    const timeLabel = escapeXml(rawLabel);
    bottomContent = `
      <text x="115" y="92" class="time-text" fill="${colors.time}">${timeLabel}</text>
    `;
  } else if (status === 'unconfigured') {
    bottomContent = `
      <text x="115" y="92" class="time-text" fill="#E3B341">Add SPOTIFY_REFRESH_TOKEN to .env</text>
    `;
  } else {
    bottomContent = `
      <text x="115" y="92" class="time-text" fill="${colors.time}">Open Spotify to start listening</text>
    `;
  }

  const defs = `
    <clipPath id="album-clip">
      <rect x="22" y="22" width="76" height="76" rx="8" />
    </clipPath>
    <linearGradient id="progress-grad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#1DB954" />
      <stop offset="100%" stop-color="#1ED760" />
    </linearGradient>
  `;

  const extraStyles = `
    @keyframes eq1 { 0%, 100% { height: 4px; y: 28px; } 50% { height: 13px; y: 19px; } }
    @keyframes eq2 { 0%, 100% { height: 13px; y: 19px; } 50% { height: 5px; y: 27px; } }
    @keyframes eq3 { 0%, 100% { height: 7px; y: 25px; } 50% { height: 14px; y: 18px; } }
    @keyframes eq4 { 0%, 100% { height: 12px; y: 20px; } 50% { height: 4px; y: 28px; } }
    .bar-1 { animation: eq1 1.0s ease-in-out infinite; }
    .bar-2 { animation: eq2 0.8s ease-in-out infinite; }
    .bar-3 { animation: eq3 1.1s ease-in-out infinite; }
    .bar-4 { animation: eq4 0.9s ease-in-out infinite; }
  `;

  const content = `
    <!-- Album Artwork -->
    ${coverArtContent}
    <rect x="22" y="22" width="76" height="76" rx="8" fill="none" stroke="${colors.border}" stroke-width="1" />

    <!-- Status Header -->
    ${statusHeader}

    <!-- Track Title -->
    <text x="115" y="53" class="song-title" fill="${colors.title}">${safeTitle}</text>

    <!-- Artist Name -->
    <text x="115" y="72" class="artist-name" fill="${colors.artist}">${safeArtist}</text>

    <!-- Progress Bar or Footer Text -->
    ${bottomContent}
  `;

  return renderCardCanvas({
    width: 420,
    height: 120,
    theme: options.theme,
    defs,
    extraStyles,
    content,
    logoCoords: { x: 382, y: 18, scale: 0.8 },
  });
}
