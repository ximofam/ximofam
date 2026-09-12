// api/lib/spotify.js
const TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';
const NOW_PLAYING_ENDPOINT = 'https://api.spotify.com/v1/me/player/currently-playing';
const RECENTLY_PLAYED_ENDPOINT = 'https://api.spotify.com/v1/me/player/recently-played?limit=1';
const TOP_TRACKS_ENDPOINT = 'https://api.spotify.com/v1/me/top/tracks';

// In-memory cache for access token
let cachedToken = null;
let tokenExpiresAt = 0;

/**
 * Loads environment variables if running in standalone Node.js (Node 20+)
 */
export function loadEnv() {
  if (typeof process.loadEnvFile === 'function') {
    try {
      process.loadEnvFile('.env');
    } catch {
      // Ignored if .env does not exist or running on Vercel
    }
  }
}

/**
 * Gets a fresh or cached Spotify access token using the refresh token
 */
export async function getAccessToken() {
  loadEnv();

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN;

  if (!clientId || !clientSecret) {
    throw new Error('Missing SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET in environment variables.');
  }

  if (!refreshToken) {
    throw new Error('Missing SPOTIFY_REFRESH_TOKEN in environment variables. Run `yarn auth` or `npm run auth` to obtain one.');
  }

  // Return cached token if valid (with 60s safety window)
  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken;
  }

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const response = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to refresh Spotify access token (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  cachedToken = data.access_token;
  // Cache until expires_in seconds (minus 60s buffer)
  tokenExpiresAt = Date.now() + ((data.expires_in || 3600) - 60) * 1000;

  return cachedToken;
}

/**
 * Fetches an image URL and converts it to a base64 Data URI for inline SVG embedding.
 * GitHub Camo sanitizer strips external image URLs inside SVGs, so base64 data URIs are required.
 */
export async function fetchBase64Image(url) {
  if (!url) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const arrayBuffer = await res.arrayBuffer();
    const contentType = res.headers.get('content-type') || 'image/jpeg';
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    return `data:${contentType};base64,${base64}`;
  } catch {
    return null;
  }
}

/**
 * Fetches the user's currently playing track from Spotify
 */
export async function getNowPlaying(accessToken) {
  const response = await fetch(NOW_PLAYING_ENDPOINT, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (response.status === 204 || response.status > 400) {
    return null;
  }

  try {
    return await response.json();
  } catch {
    return null;
  }
}

/**
 * Fetches the user's most recently played track from Spotify
 */
export async function getRecentlyPlayed(accessToken) {
  const response = await fetch(RECENTLY_PLAYED_ENDPOINT, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    return null;
  }

  try {
    const data = await response.json();
    return data.items?.[0] || null;
  } catch {
    return null;
  }
}

/**
 * Calculates human-readable relative time (e.g. "3m ago", "1h ago")
 */
function getRelativeTime(dateString) {
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
 * Retrieves the complete Spotify presence: currently playing track, or fallback to recently played.
 */
export async function getSpotifyPresence() {
  loadEnv();

  // Validate env vars
  if (!process.env.SPOTIFY_REFRESH_TOKEN) {
    return {
      status: 'unconfigured',
      error: 'Missing SPOTIFY_REFRESH_TOKEN in .env',
      isPlaying: false,
      title: 'Spotify Not Configured',
      artist: 'Run `yarn auth` to get Refresh Token',
      album: '',
      albumImageUrl: null,
      albumImageBase64: null,
      songUrl: 'https://open.spotify.com',
      durationMs: 0,
      progressMs: 0,
      isRecentlyPlayed: false,
      playedAt: null,
    };
  }

  const token = await getAccessToken();
  const nowPlayingData = await getNowPlaying(token);

  // Check if currently playing music
  if (nowPlayingData && nowPlayingData.item && nowPlayingData.currently_playing_type === 'track') {
    const item = nowPlayingData.item;
    // Prefer medium size (300x300, index 1) or fallback to 640x640 / 64x64
    const albumImage = item.album?.images?.[1]?.url || item.album?.images?.[0]?.url || null;
    const albumImageBase64 = await fetchBase64Image(albumImage);

    return {
      status: 'playing',
      isPlaying: Boolean(nowPlayingData.is_playing),
      title: item.name || 'Unknown Track',
      artist: (item.artists || []).map((a) => a.name).join(', ') || 'Unknown Artist',
      album: item.album?.name || '',
      albumImageUrl: albumImage,
      albumImageBase64,
      songUrl: item.external_urls?.spotify || 'https://open.spotify.com',
      durationMs: item.duration_ms || 0,
      progressMs: nowPlayingData.progress_ms || 0,
      isRecentlyPlayed: false,
      playedAt: null,
    };
  }

  // Fallback to recently played
  const recentItem = await getRecentlyPlayed(token);
  if (recentItem && recentItem.track) {
    const track = recentItem.track;
    const albumImage = track.album?.images?.[1]?.url || track.album?.images?.[0]?.url || null;
    const albumImageBase64 = await fetchBase64Image(albumImage);

    return {
      status: 'recent',
      isPlaying: false,
      title: track.name || 'Unknown Track',
      artist: (track.artists || []).map((a) => a.name).join(', ') || 'Unknown Artist',
      album: track.album?.name || '',
      albumImageUrl: albumImage,
      albumImageBase64,
      songUrl: track.external_urls?.spotify || 'https://open.spotify.com',
      durationMs: track.duration_ms || 0,
      progressMs: 0,
      isRecentlyPlayed: true,
      playedAt: getRelativeTime(recentItem.played_at),
    };
  }

  // Fallback when nothing is playing and no recent tracks found
  return {
    status: 'idle',
    isPlaying: false,
    title: 'Not Playing',
    artist: 'Open Spotify to listen',
    album: '',
    albumImageUrl: null,
    albumImageBase64: null,
    songUrl: 'https://open.spotify.com',
    durationMs: 0,
    progressMs: 0,
    isRecentlyPlayed: false,
    playedAt: null,
  };
}

/**
 * Retrieves the user's top / frequently played tracks from Spotify
 * @param {'short_term' | 'medium_term' | 'long_term'} timeRange - approx 4 weeks, 6 months, or years
 * @param {number} limit - number of tracks (1 to 10)
 */
export async function getTopTracks(timeRange = 'short_term', limit = 5) {
  loadEnv();

  if (!process.env.SPOTIFY_REFRESH_TOKEN) {
    return {
      status: 'unconfigured',
      error: 'Missing SPOTIFY_REFRESH_TOKEN in .env',
      timeRange,
      limit,
      tracks: [],
    };
  }

  const validRanges = ['short_term', 'medium_term', 'long_term'];
  const safeRange = validRanges.includes(timeRange) ? timeRange : 'short_term';
  const safeLimit = Math.max(1, Math.min(10, parseInt(limit, 10) || 5));

  const token = await getAccessToken();
  const endpoint = `${TOP_TRACKS_ENDPOINT}?time_range=${safeRange}&limit=${safeLimit}`;

  const response = await fetch(endpoint, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    if (response.status === 403 && errorText.includes('Insufficient client scope')) {
      return {
        status: 'scope_required',
        error: 'Chạy lại `yarn auth` để cấp quyền xem top tracks',
        timeRange: safeRange,
        limit: safeLimit,
        tracks: [],
      };
    }
    throw new Error(`Failed to fetch top tracks (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const rawItems = data.items || [];

  // Convert thumbnails to base64 Data URIs in parallel
  const tracks = await Promise.all(
    rawItems.map(async (item, index) => {
      // Small thumbnail (64x64 at index 2 or fallback to 300x300)
      const imgUrl =
        item.album?.images?.[2]?.url ||
        item.album?.images?.[1]?.url ||
        item.album?.images?.[0]?.url ||
        null;
      const albumImageBase64 = await fetchBase64Image(imgUrl);

      return {
        rank: index + 1,
        title: item.name || 'Unknown Track',
        artist: (item.artists || []).map((a) => a.name).join(', ') || 'Unknown Artist',
        album: item.album?.name || '',
        albumImageUrl: imgUrl,
        albumImageBase64,
        songUrl: item.external_urls?.spotify || 'https://open.spotify.com',
        durationMs: item.duration_ms || 0,
      };
    })
  );

  return {
    status: 'success',
    timeRange: safeRange,
    limit: safeLimit,
    tracks,
  };
}

