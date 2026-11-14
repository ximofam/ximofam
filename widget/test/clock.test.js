import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { formatClockData, renderClockSvg } from '../api/lib/renderClock.js';

describe('Clock Widget (Terminal Ticking Clock)', () => {
  const fixedDate = new Date('2026-09-13T07:15:30.000Z'); // 14:15:30 in UTC+7 (Asia/Ho_Chi_Minh)

  describe('formatClockData', () => {
    it('formats time correctly in default Asia/Ho_Chi_Minh 24h format', () => {
      const data = formatClockData(fixedDate, 'Asia/Ho_Chi_Minh', false);
      assert.equal(data.hours, '14');
      assert.equal(data.minutes, '15');
      assert.equal(data.seconds, '30');
      assert.equal(data.period, null);
      assert.equal(data.timezone, 'Asia/Ho_Chi_Minh');
    });

    it('formats time correctly in 12h format with period', () => {
      const data = formatClockData(fixedDate, 'Asia/Ho_Chi_Minh', true);
      assert.equal(data.hours, '02');
      assert.equal(data.minutes, '15');
      assert.equal(data.seconds, '30');
      assert.equal(data.period, 'PM');
    });

    it('handles different timezones (e.g. UTC, America/New_York)', () => {
      const utcData = formatClockData(fixedDate, 'UTC', false);
      assert.equal(utcData.hours, '07');
      assert.equal(utcData.minutes, '15');
      assert.equal(utcData.seconds, '30');

      const nyData = formatClockData(fixedDate, 'America/New_York', false);
      assert.equal(nyData.hours, '03'); // EDT
      assert.equal(nyData.minutes, '15');
      assert.equal(nyData.seconds, '30');
    });

    it('falls back safely to Asia/Ho_Chi_Minh on invalid timezone', () => {
      const fallbackData = formatClockData(fixedDate, 'Invalid/Timezone_XYZ', false);
      assert.equal(fallbackData.hours, '14');
      assert.equal(fallbackData.minutes, '15');
      assert.equal(fallbackData.seconds, '30');
      assert.equal(fallbackData.timezone, 'Asia/Ho_Chi_Minh');
    });
  });

  describe('renderClockSvg', () => {
    it('renders SVG with Terminal window styling and 3 macOS dots', () => {
      const svg = renderClockSvg({
        date: fixedDate,
        timezone: 'Asia/Ho_Chi_Minh',
        theme: 'dark',
      });

      assert.match(svg, /<svg width="280" height="85" viewBox="0 0 280 85"/);
      assert.match(svg, /fill="#FF5F56"/); // Red dot
      assert.match(svg, /fill="#FFBD2E"/); // Yellow dot
      assert.match(svg, /fill="#27C93F"/); // Green dot
      assert.match(svg, /clock\.sh/);
      assert.match(svg, /class="colon">:</);
      assert.match(svg, /@keyframes blink/);
      // In strict XML/SVG, HTML entities like &middot; are invalid
      assert.doesNotMatch(svg, /&(?!(amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);)[a-zA-Z]+;/);
    });

    it('includes synchronized ticking reels for hours, minutes, and seconds', () => {
      const svg = renderClockSvg({ date: fixedDate });

      // Check reels exist
      assert.match(svg, /class="reel-seconds"/);
      assert.match(svg, /class="reel-minutes"/);
      assert.match(svg, /class="reel-hours"/);

      // Check keyframes and discrete step animations exist
      assert.match(svg, /@keyframes tickSeconds/);
      assert.match(svg, /animation: tickSeconds 60s steps\(60\) infinite/);
      assert.match(svg, /@keyframes tickMinutes/);
      assert.match(svg, /animation: tickMinutes 3600s steps\(60\) infinite/);
      assert.match(svg, /animation-delay: -30s;/); // fixedDate seconds = 30
      assert.match(svg, /@keyframes tickHours/);
      assert.match(svg, /animation: tickHours 86400s steps\(24\) infinite/);
      assert.match(svg, /animation-delay: -930s;/); // fixedDate 15min * 60 + 30s = 930s
    });

    it('renders theme palettes correctly (matrix, cyberpunk, light, transparent)', () => {
      const matrixSvg = renderClockSvg({ date: fixedDate, theme: 'matrix' });
      assert.match(matrixSvg, /#00FF66/);

      const cyberSvg = renderClockSvg({ date: fixedDate, theme: 'cyberpunk' });
      assert.match(cyberSvg, /#00F0FF/);

      const lightSvg = renderClockSvg({ date: fixedDate, theme: 'light' });
      assert.match(lightSvg, /#1F2328/);

      const transSvg = renderClockSvg({ date: fixedDate, theme: 'transparent' });
      assert.match(transSvg, /fill="none"/);
    });

    it('supports scaling parameter and custom width/height', () => {
      const scaledSvg = renderClockSvg({ date: fixedDate, scale: 1.5 });
      assert.match(scaledSvg, /<svg width="420" height="128"/);

      const customSvg = renderClockSvg({ date: fixedDate, width: 350, height: 100 });
      assert.match(customSvg, /<svg width="350" height="100"/);
    });
  });
});
