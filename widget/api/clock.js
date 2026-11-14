// api/clock.js
import { renderClockSvg, formatClockData } from './lib/renderClock.js';
import { parseQueryParams, setNoCacheHeaders } from './lib/utils.js';

/**
 * Serverless function for real-time Terminal HUD Clock widget
 */
export default async function handler(req, res) {
  try {
    const query = parseQueryParams(req);
    const tz = query.tz || req.headers?.['x-vercel-ip-timezone'] || 'Asia/Ho_Chi_Minh';
    const theme = query.theme || 'dark';
    const is12Hour = query.format === '12';
    const scale = query.scale ? parseFloat(query.scale) : 1;
    const width = query.width ? parseInt(query.width, 10) : undefined;
    const height = query.height ? parseInt(query.height, 10) : undefined;

    const now = new Date();

    if (query.format === 'json') {
      const data = formatClockData(now, tz, is12Hour);
      setNoCacheHeaders(res, 'application/json; charset=utf-8');
      res.end(
        JSON.stringify(
          {
            timestamp: now.getTime(),
            iso: now.toISOString(),
            ...data,
          },
          null,
          2
        )
      );
      return;
    }

    const svg = renderClockSvg({
      date: now,
      timezone: tz,
      theme,
      is12Hour,
      scale,
      width,
      height,
    });

    setNoCacheHeaders(res, 'image/svg+xml; charset=utf-8');
    res.end(svg);
  } catch (error) {
    console.error('Clock API Error:', error);

    const fallbackSvg = renderClockSvg({
      date: new Date(),
      timezone: 'Asia/Ho_Chi_Minh',
      theme: 'dark',
      showDate: false,
    });

    setNoCacheHeaders(res, 'image/svg+xml; charset=utf-8');
    res.end(fallbackSvg);
  }
}
