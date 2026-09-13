import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { renderCard } from '../api/lib/renderCard.js';
import { renderTopTracks } from '../api/lib/renderTopTracks.js';

describe('renderCard (Spotify Presence)', () => {
  it('renders actively playing track with equalizer and progress bar', () => {
    const svg = renderCard({
      status: 'playing',
      isPlaying: true,
      title: 'Bohemian Rhapsody',
      artist: 'Queen',
      album: 'A Night at the Opera',
      durationMs: 354000,
      progressMs: 120000,
    });

    assert.match(svg, /NOW PLAYING/);
    assert.match(svg, /Bohemian Rhapsody/);
    assert.match(svg, /Queen/);
    assert.match(svg, /class="equalizer"/);
    assert.match(svg, /2:00 \/ 5:54/);
  });

  it('renders recently played track', () => {
    const svg = renderCard({
      status: 'recent',
      isPlaying: false,
      isRecentlyPlayed: true,
      title: 'Yesterday',
      artist: 'The Beatles',
      playedAt: '10m ago',
    });

    assert.match(svg, /RECENTLY PLAYED/);
    assert.match(svg, /Yesterday/);
    assert.match(svg, /The Beatles/);
    assert.match(svg, /Played 10m ago/);
  });

  it('renders offline idle state when not listening', () => {
    const svg = renderCard({
      status: 'idle',
      isPlaying: false,
    });

    assert.match(svg, /SPOTIFY OFFLINE/);
    assert.match(svg, /Not Playing/);
  });

  it('renders error state properly', () => {
    const svg = renderCard({
      status: 'error',
      title: 'Spotify Presence',
      artist: 'Token expired',
    });

    assert.match(svg, /Spotify Presence/);
    assert.match(svg, /Token expired/);
  });
});

describe('renderTopTracks (Top Tracks Carousel)', () => {
  const sampleTracks = [
    { rank: 1, title: 'Track One', artist: 'Artist One' },
    { rank: 2, title: 'Track Two', artist: 'Artist Two' },
    { rank: 3, title: 'Track Three', artist: 'Artist Three' },
    { rank: 4, title: 'Track Four', artist: 'Artist Four' },
    { rank: 5, title: 'Track Five', artist: 'Artist Five' },
  ];

  it('renders top tracks with auto-scroll carousel for > 4 tracks', () => {
    const svg = renderTopTracks({
      status: 'success',
      timeRange: 'short_term',
      tracks: sampleTracks,
    });

    assert.match(svg, /TOP 5 TRACKS/);
    assert.match(svg, /LAST 4 WEEKS/);
    assert.match(svg, /AUTO/);
    assert.match(svg, /track-scroller/);
    assert.match(svg, /Track One/);
    assert.match(svg, /Track Five/);

    // Carousel inspection on card hover
    assert.match(svg, /svg:hover \.track-scroller/);
    assert.match(svg, /animation-play-state: paused;/);
    assert.match(svg, /badge-paused/);
    assert.match(svg, /PAUSED/);
    assert.match(svg, /\.track-row:hover \.track-title/);
  });

  it('renders static list without scroll when <= 4 tracks', () => {
    const svg = renderTopTracks({
      status: 'success',
      timeRange: 'long_term',
      tracks: sampleTracks.slice(0, 3),
    });

    assert.match(svg, /TOP TRACKS/);
    assert.match(svg, /ALL TIME/);
    assert.doesNotMatch(svg, /track-scroller/);
    assert.match(svg, /Track Three/);
  });

  it('renders fallback error message when status is error or empty', () => {
    const svg = renderTopTracks({
      status: 'error',
      error: 'Insufficient client scope',
      tracks: [],
    });

    assert.match(svg, /Top Spotify Tracks/);
    assert.match(svg, /Insufficient client scope/);
  });
});
