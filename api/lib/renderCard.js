// api/lib/renderCard.js

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
 * Formats milliseconds into M:SS string
 */
function formatTime(ms) {
  if (!ms || ms <= 0) return '0:00';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

/**
 * Truncates string to a max character count
 */
function truncate(str, maxLen) {
  if (!str) return '';
  return str.length > maxLen ? str.slice(0, maxLen - 1) + '…' : str;
}

/**
 * Renders the Spotify Presence card as an SVG string
 */
export function renderCard(presence, options = {}) {
  const isLight = options.theme === 'light';

  // Color palette
  const colors = isLight
    ? {
        bgStart: '#F6F8FA',
        bgEnd: '#FFFFFF',
        border: '#D0D7DE',
        title: '#1F2328',
        artist: '#59636E',
        time: '#656D76',
        barBg: '#EAEBEF',
        brand: '#1DB954',
        statusRecent: '#6E7681',
      }
    : {
        bgStart: '#0D1117',
        bgEnd: '#161B22',
        border: '#30363D',
        title: '#F0F6FC',
        artist: '#8B949E',
        time: '#7D8590',
        barBg: '#21262D',
        brand: '#1DB954',
        statusRecent: '#8B949E',
      };

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
      <circle cx="118" cy="22" r="3.5" fill="${colors.statusRecent}" />
      <text x="128" y="26" class="header-status" fill="${colors.statusRecent}">RECENTLY PLAYED</text>
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
  } else if (isRecentlyPlayed && playedAt) {
    bottomContent = `
      <text x="115" y="92" class="time-text" fill="${colors.time}">Played ${playedAt}</text>
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

  return `<svg width="420" height="120" viewBox="0 0 420 120" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <clipPath id="album-clip">
      <rect x="22" y="22" width="76" height="76" rx="8" />
    </clipPath>
    <linearGradient id="card-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${colors.bgStart}" />
      <stop offset="100%" stop-color="${colors.bgEnd}" />
    </linearGradient>
    <linearGradient id="progress-grad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#1DB954" />
      <stop offset="100%" stop-color="#1ED760" />
    </linearGradient>
  </defs>

  <style>
    .header-status {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 1.5px;
      text-transform: uppercase;
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
    @keyframes eq1 { 0%, 100% { height: 4px; y: 28px; } 50% { height: 13px; y: 19px; } }
    @keyframes eq2 { 0%, 100% { height: 13px; y: 19px; } 50% { height: 5px; y: 27px; } }
    @keyframes eq3 { 0%, 100% { height: 7px; y: 25px; } 50% { height: 14px; y: 18px; } }
    @keyframes eq4 { 0%, 100% { height: 12px; y: 20px; } 50% { height: 4px; y: 28px; } }
    .bar-1 { animation: eq1 1.0s ease-in-out infinite; }
    .bar-2 { animation: eq2 0.8s ease-in-out infinite; }
    .bar-3 { animation: eq3 1.1s ease-in-out infinite; }
    .bar-4 { animation: eq4 0.9s ease-in-out infinite; }
  </style>

  <!-- Card Background -->
  <rect width="420" height="120" rx="12" fill="url(#card-grad)" stroke="${colors.border}" stroke-width="1" />

  <!-- Album Artwork -->
  ${coverArtContent}
  <rect x="22" y="22" width="76" height="76" rx="8" fill="none" stroke="${colors.border}" stroke-width="1" />

  <!-- Status Header -->
  ${statusHeader}

  <!-- Spotify Logo (Top Right) -->
  <g transform="translate(382, 18) scale(0.8)">
    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.497 17.305c-.215.352-.676.463-1.028.248-2.813-1.718-6.353-2.107-10.525-1.154-.403.092-.807-.16-.9-.562-.091-.403.16-.807.563-.9 4.568-1.044 8.483-.604 11.642 1.339.352.215.463.677.248 1.029zm1.467-3.26c-.27.44-.849.577-1.288.307-3.22-1.979-8.13-2.551-11.939-1.394-.496.15-1.023-.134-1.174-.63-.151-.496.134-1.024.63-1.175 4.356-1.322 9.776-.682 13.464 1.583.44.27.577.849.307 1.309zm.126-3.398C15.234 8.358 8.874 8.148 5.163 9.274c-.59.18-1.218-.16-1.398-.75-.18-.59.16-1.218.75-1.398 4.254-1.291 11.278-1.045 15.748 1.61.53.315.703 1.002.388 1.533-.314.53-1.002.703-1.56.378z" fill="${colors.brand}"/>
  </g>

  <!-- Track Title -->
  <text x="115" y="53" class="song-title" fill="${colors.title}">${safeTitle}</text>

  <!-- Artist Name -->
  <text x="115" y="72" class="artist-name" fill="${colors.artist}">${safeArtist}</text>

  <!-- Progress Bar or Footer Text -->
  ${bottomContent}
</svg>`;
}
