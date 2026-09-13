import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { renderCardCanvas, renderErrorCard } from '../api/lib/cardCanvas.js';

describe('Card Canvas (Deep Module)', () => {
  it('renders SVG envelope with proper dimensions and viewBox', () => {
    const svg = renderCardCanvas({
      width: 420,
      height: 120,
      content: '<text x="10" y="20">Hello World</text>',
    });

    assert.match(svg, /<svg width="420" height="120" viewBox="0 0 420 120"/);
    assert.match(svg, /xmlns="http:\/\/www.w3.org\/2000\/svg"/);
    assert.match(svg, /Hello World/);
  });

  it('applies dark and light theme background styles', () => {
    const darkSvg = renderCardCanvas({
      height: 120,
      theme: 'dark',
      content: '<g></g>',
    });
    // Dark theme bgStart is #0D1117
    assert.match(darkSvg, /#0D1117/);

    const lightSvg = renderCardCanvas({
      height: 120,
      theme: 'light',
      content: '<g></g>',
    });
    // Light theme bgStart is #F6F8FA
    assert.match(lightSvg, /#F6F8FA/);
  });

  it('injects custom defs and extra styles for animations', () => {
    const svg = renderCardCanvas({
      height: 120,
      defs: '<clipPath id="custom-clip"><rect width="10" height="10"/></clipPath>',
      extraStyles: '@keyframes testAnim { 0% { opacity: 0; } }',
      content: '<rect clip-path="url(#custom-clip)" />',
    });

    assert.match(svg, /id="custom-clip"/);
    assert.match(svg, /@keyframes testAnim/);
  });

  it('renders Spotify logo by default and allows disabling it', () => {
    const withLogo = renderCardCanvas({ height: 120, content: '' });
    assert.match(withLogo, /fill="#1DB954"/);

    const withoutLogo = renderCardCanvas({ height: 120, content: '', showLogo: false });
    assert.doesNotMatch(withoutLogo, /fill="#1DB954"/);
  });

  it('renders standard resilient error card with title and message', () => {
    const errorSvg = renderErrorCard({
      title: 'Spotify Presence Error',
      message: 'Failed to fetch status from Spotify',
      theme: 'dark',
      height: 120,
    });

    assert.match(errorSvg, /<svg width="420" height="120"/);
    assert.match(errorSvg, /Spotify Presence Error/);
    assert.match(errorSvg, /Failed to fetch status from Spotify/);
    assert.match(errorSvg, /#E3B341/); // Warning/status color
  });
});
