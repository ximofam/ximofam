// api/lib/renderClock.js
import { escapeXml } from './utils.js';

const THEMES = {
  dark: {
    bg: '#0D1117',
    border: '#30363D',
    headerBg: '#161B22',
    headerText: '#8B949E',
    digits: '#58A6FF',
    colons: '#58A6FF',
    period: '#79C0FF',
    liveDot: '#238636',
    glow: 'none',
  },
  light: {
    bg: '#FFFFFF',
    border: '#D0D7DE',
    headerBg: '#F6F8FA',
    headerText: '#59636E',
    digits: '#1F2328',
    colons: '#0969DA',
    period: '#0969DA',
    liveDot: '#1A7F37',
    glow: 'none',
  },
  matrix: {
    bg: '#050D08',
    border: '#1B4728',
    headerBg: '#08160D',
    headerText: '#238636',
    digits: '#00FF66',
    colons: '#00FF66',
    period: '#00FF66',
    liveDot: '#00FF66',
    glow: '0 0 10px rgba(0, 255, 102, 0.45)',
  },
  cyberpunk: {
    bg: '#0A0A12',
    border: '#FF0055',
    headerBg: '#131322',
    headerText: '#FF0055',
    digits: '#00F0FF',
    colons: '#FF0055',
    period: '#FFE600',
    liveDot: '#00F0FF',
    glow: '0 0 10px rgba(0, 240, 255, 0.45)',
  },
  transparent: {
    bg: 'none',
    border: '#30363D',
    headerBg: 'none',
    headerText: '#8B949E',
    digits: '#00FF66',
    colons: '#00FF66',
    period: '#00FF66',
    liveDot: '#238636',
    glow: 'none',
  },
};

/**
 * Formats a Date object into clock segments for a given IANA timezone
 */
export function formatClockData(date = new Date(), timezone = 'Asia/Ho_Chi_Minh', is12Hour = false) {
  let safeTz = timezone || 'Asia/Ho_Chi_Minh';
  let parts;

  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: safeTz,
      hour12: is12Hour,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      weekday: 'short',
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    });
    parts = Object.fromEntries(formatter.formatToParts(date).map((p) => [p.type, p.value]));
  } catch {
    safeTz = 'Asia/Ho_Chi_Minh';
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: safeTz,
      hour12: is12Hour,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      weekday: 'short',
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    });
    parts = Object.fromEntries(formatter.formatToParts(date).map((p) => [p.type, p.value]));
  }

  const hours = parts.hour || '00';
  const minutes = parts.minute || '00';
  const seconds = parts.second || '00';
  const period = is12Hour ? parts.dayPeriod || null : null;
  const dateStr = `${parts.weekday}, ${parts.month} ${parts.day}, ${parts.year}`;

  return {
    hours,
    minutes,
    seconds,
    period,
    dateStr,
    timezone: safeTz,
  };
}

/**
 * Pads a number to 2 digits
 */
function pad(num) {
  return num < 10 ? `0${num}` : `${num}`;
}

/**
 * Renders a Minimal Terminal Window SVG with synchronized live ticking Hours, Minutes, and Seconds
 *
 * @param {Object} options
 * @param {Date} [options.date=new Date()]
 * @param {string} [options.timezone='Asia/Ho_Chi_Minh']
 * @param {string} [options.theme='dark']
 * @param {boolean} [options.is12Hour=false]
 * @param {number} [options.scale=1]
 * @param {number} [options.width]
 * @param {number} [options.height]
 * @returns {string} SVG markup
 */
export function renderClockSvg({
  date = new Date(),
  timezone = 'Asia/Ho_Chi_Minh',
  theme = 'dark',
  is12Hour = false,
  scale = 1,
  width,
  height,
} = {}) {
  const clock = formatClockData(date, timezone, is12Hour);
  const colors = THEMES[theme] || THEMES.dark;

  // ViewBox base dimensions: 280 x 85
  const baseW = 280;
  const baseH = 85;
  const targetScale = parseFloat(scale) || 1;
  const finalWidth = width ? parseInt(width, 10) : Math.round(baseW * targetScale);
  const finalHeight = height ? parseInt(height, 10) : Math.round(baseH * targetScale);

  const startSec = parseInt(clock.seconds, 10) || 0;
  const startMin = parseInt(clock.minutes, 10) || 0;
  const startHr = parseInt(clock.hours, 10) || 0;

  const rowHeight = 36;
  const hrCount = is12Hour ? 12 : 24;
  const hrCycleSeconds = hrCount * 3600;
  const elapsedInHour = startMin * 60 + startSec;
  const minDelay = startSec > 0 ? `-${startSec}s` : '0s';
  const hrDelay = elapsedInHour > 0 ? `-${elapsedInHour}s` : '0s';

  let secondsRows = '';
  for (let i = 0; i <= 60; i++) {
    const s = (startSec + i) % 60;
    secondsRows += `<text x="210" y="${58 + i * rowHeight}" text-anchor="middle" class="digit" fill="${colors.digits}">${pad(s)}</text>\n`;
  }

  let minutesRows = '';
  for (let i = 0; i <= 60; i++) {
    const m = (startMin + i) % 60;
    minutesRows += `<text x="140" y="${58 + i * rowHeight}" text-anchor="middle" class="digit" fill="${colors.digits}">${pad(m)}</text>\n`;
  }

  let hoursRows = '';
  for (let i = 0; i <= hrCount; i++) {
    const h = is12Hour ? ((startHr - 1 + i) % hrCount) + 1 : (startHr + i) % hrCount;
    hoursRows += `<text x="70" y="${58 + i * rowHeight}" text-anchor="middle" class="digit" fill="${colors.digits}">${pad(h)}</text>\n`;
  }

  const bgRect =
    colors.bg === 'none'
      ? `<rect width="${baseW}" height="${baseH}" rx="8" fill="none" stroke="${colors.border}" stroke-width="1" />`
      : `<rect width="${baseW}" height="${baseH}" rx="8" fill="${colors.bg}" stroke="${colors.border}" stroke-width="1" />`;

  const headerBgRect =
    colors.headerBg === 'none'
      ? ''
      : `<path d="M1 8C1 4.134 4.134 1 8 1H272C275.866 1 279 4.134 279 8V22H1V8Z" fill="${colors.headerBg}" />`;

  const periodSvg = clock.period
    ? `<text x="246" y="58" class="period" fill="${colors.period}">${escapeXml(clock.period)}</text>`
    : '';

  const tzLabel = escapeXml(clock.timezone.split('/').pop()?.replace(/_/g, ' ') || clock.timezone);

  return `<svg width="${finalWidth}" height="${finalHeight}" viewBox="0 0 ${baseW} ${baseH}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <clipPath id="digits-viewport">
      <rect x="10" y="24" width="260" height="${rowHeight + 4}" />
    </clipPath>
  </defs>

  <style>
    text {
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
    }
    .hud-title {
      font-size: 9px;
      font-weight: 600;
      letter-spacing: 0.5px;
      fill: ${colors.headerText};
    }
    .digit {
      font-size: 30px;
      font-weight: 700;
      letter-spacing: 1.5px;
      ${colors.glow !== 'none' ? `filter: drop-shadow(${colors.glow});` : ''}
    }
    .colon {
      font-size: 28px;
      font-weight: 700;
      fill: ${colors.colons};
      animation: blink 1s step-start infinite;
      ${colors.glow !== 'none' ? `filter: drop-shadow(${colors.glow});` : ''}
    }
    .period {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.8px;
    }
    @keyframes blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.15; }
    }
    @keyframes tickSeconds {
      0% { transform: translateY(0px); }
      100% { transform: translateY(-${60 * rowHeight}px); }
    }
    .reel-seconds {
      animation: tickSeconds 60s steps(60) infinite;
    }
    @keyframes tickMinutes {
      0% { transform: translateY(0px); }
      100% { transform: translateY(-${60 * rowHeight}px); }
    }
    .reel-minutes {
      animation: tickMinutes 3600s steps(60) infinite;
      animation-delay: ${minDelay};
    }
    @keyframes tickHours {
      0% { transform: translateY(0px); }
      100% { transform: translateY(-${hrCount * rowHeight}px); }
    }
    .reel-hours {
      animation: tickHours ${hrCycleSeconds}s steps(${hrCount}) infinite;
      animation-delay: ${hrDelay};
    }
  </style>

  ${bgRect}
  ${headerBgRect}
  <line x1="0" y1="22" x2="${baseW}" y2="22" stroke="${colors.border}" stroke-width="0.8" />
  <circle cx="14" cy="11.5" r="3.2" fill="#FF5F56" />
  <circle cx="24" cy="11.5" r="3.2" fill="#FFBD2E" />
  <circle cx="34" cy="11.5" r="3.2" fill="#27C93F" />
  <text x="${baseW - 14}" y="14.5" text-anchor="end" class="hud-title">clock.sh · ${tzLabel}</text>

  <g clip-path="url(#digits-viewport)">
    <g class="reel-hours">
      ${hoursRows}
    </g>
    <g class="reel-minutes">
      ${minutesRows}
    </g>
    <g class="reel-seconds">
      ${secondsRows}
    </g>
  </g>

  <text x="105" y="56" text-anchor="middle" class="colon">:</text>
  <text x="175" y="56" text-anchor="middle" class="colon">:</text>
  ${periodSvg}
</svg>`;
}
