// server.js
import http from 'node:http';
import spotifyHandler from './api/spotify.js';
import topTracksHandler from './api/top-tracks.js';
import clockHandler from './api/clock.js';
import quoteHandler from './api/quote.js';
import { loadEnv } from './api/lib/spotify.js';

loadEnv();

const PORT = process.env.PORT || 3000;

const server = http.createServer(async (req, res) => {
  const reqUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  // Route: /api/clock and /clock (Terminal HUD Clock)
  if (reqUrl.pathname === '/api/clock' || reqUrl.pathname === '/clock') {
    return clockHandler(req, res);
  }

  // Route: /api/quote and /quote (LLM Quote API)
  if (reqUrl.pathname === '/api/quote' || reqUrl.pathname === '/quote') {
    return quoteHandler(req, res);
  }

  // Route: /api/spotify and /spotify (Currently Playing Presence)
  if (reqUrl.pathname === '/api/spotify' || reqUrl.pathname === '/spotify') {
    return spotifyHandler(req, res);
  }

  // Route: /api/top-tracks and /top-tracks (Frequently Played Tracks)
  if (reqUrl.pathname === '/api/top-tracks' || reqUrl.pathname === '/top-tracks') {
    return topTracksHandler(req, res);
  }

  // Route: Home Preview Page
  if (reqUrl.pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Spotify Widgets Preview</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background: #090d16;
            color: #e6edf3;
            margin: 0;
            padding: 40px 20px;
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .container {
            max-width: 720px;
            width: 100%;
          }
          h1 {
            color: #1DB954;
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 8px;
          }
          .subtitle {
            color: #8b949e;
            margin-bottom: 28px;
          }
          .section-title {
            color: #58a6ff;
            font-size: 18px;
            margin-top: 32px;
            margin-bottom: 12px;
            border-bottom: 1px solid #21262d;
            padding-bottom: 8px;
          }
          .preview-box {
            background: #161b22;
            border: 1px solid #30363d;
            border-radius: 12px;
            padding: 24px;
            margin-bottom: 24px;
            text-align: center;
          }
          .preview-box img {
            max-width: 100%;
            height: auto;
            border-radius: 12px;
            box-shadow: 0 8px 24px rgba(0,0,0,0.4);
          }
          .code-block {
            background: #0d1117;
            border: 1px solid #30363d;
            border-radius: 8px;
            padding: 16px;
            margin: 12px 0;
            overflow-x: auto;
            font-family: monospace;
            font-size: 13px;
            color: #58a6ff;
          }
          .links {
            display: flex;
            gap: 12px;
            margin-top: 16px;
            justify-content: center;
            flex-wrap: wrap;
          }
          .btn {
            display: inline-block;
            background: #21262d;
            color: #c9d1d9;
            text-decoration: none;
            padding: 8px 16px;
            border-radius: 6px;
            border: 1px solid #30363d;
            font-size: 14px;
            transition: all 0.2s ease;
          }
          .btn:hover {
            background: #30363d;
            color: #fff;
          }
          .btn.primary {
            background: #1DB954;
            color: #000;
            font-weight: 600;
            border-color: #1DB954;
          }
          .btn.primary:hover {
            background: #1ed760;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🎵 Spotify GitHub Widgets</h1>
          <p class="subtitle">Xem trước các SVG card động lấy từ Spotify API để gắn vào GitHub Profile README.</p>

          <!-- 1. NOW PLAYING WIDGET -->
          <div class="section-title">1. Spotify Presence (Currently / Recently Playing)</div>
          <div class="preview-box">
            <h3 style="margin-top:0; color:#8b949e;">Dark Theme</h3>
            <img src="/api/spotify?t=${Date.now()}" alt="Spotify Presence Card" />

            <div class="links">
              <a class="btn primary" href="/api/spotify" target="_blank">Xem ảnh SVG</a>
              <a class="btn" href="/api/spotify?theme=light" target="_blank">Light Theme</a>
              <a class="btn" href="/api/spotify?format=json" target="_blank">Dữ liệu JSON</a>
              <a class="btn" href="/api/spotify?redirect=true" target="_blank">Test nhảy link nhạc</a>
            </div>
          </div>

          <!-- 2. TOP TRACKS WIDGET -->
          <div class="section-title">2. Top Tracks (Bài hát nghe nhiều nhất)</div>
          <div class="preview-box">
            <h3 style="margin-top:0; color:#8b949e;">Top 5 Bài hát gần đây (4 tuần qua)</h3>
            <img src="/api/top-tracks?t=${Date.now()}" alt="Top Tracks Card" />

            <div class="links">
              <a class="btn primary" href="/api/top-tracks" target="_blank">Xem ảnh SVG (Top 5)</a>
              <a class="btn" href="/api/top-tracks?range=medium_term" target="_blank">6 tháng qua</a>
              <a class="btn" href="/api/top-tracks?range=long_term" target="_blank">Mọi thời đại</a>
              <a class="btn" href="/api/top-tracks?theme=light" target="_blank">Light Theme</a>
              <a class="btn" href="/api/top-tracks?format=json" target="_blank">Dữ liệu JSON</a>
            </div>
          </div>

          <!-- 3. CLOCK WIDGET -->
          <div class="section-title">3. Terminal HUD Clock (Đồng hồ động thời gian thực)</div>
          <div class="preview-box">
            <h3 style="margin-top:0; color:#8b949e;">Múi giờ Việt Nam (Asia/Ho_Chi_Minh)</h3>
            <img id="clock-img" src="/clock?t=${Date.now()}" alt="Clock Widget" />

            <div class="links">
              <a class="btn primary" href="/clock" target="_blank">Xem ảnh SVG (/clock)</a>
              <a class="btn" href="/clock?theme=matrix" target="_blank">Matrix Theme</a>
              <a class="btn" href="/clock?theme=cyberpunk" target="_blank">Cyberpunk Theme</a>
              <a class="btn" href="/clock?theme=light" target="_blank">Light Theme</a>
              <a class="btn" href="/clock?tz=America/New_York" target="_blank">New York (EDT)</a>
              <a class="btn" href="/clock?tz=Asia/Tokyo" target="_blank">Tokyo (JST)</a>
              <a class="btn" href="/clock?format=12" target="_blank">12h (AM/PM)</a>
              <a class="btn" href="/clock?format=json" target="_blank">Dữ liệu JSON</a>
            </div>
            <script>
              // Auto-refresh preview every 1 second on dev page
              setInterval(() => {
                const img = document.getElementById('clock-img');
                if (img) img.src = '/clock?t=' + Date.now();
              }, 1000);
            </script>
          </div>

          <!-- 4. LLM QUOTE API -->
          <div class="section-title">4. LLM Quote Generator (API sinh câu quote thông minh)</div>
          <div class="preview-box">
            <h3 style="margin-top:0; color:#8b949e;">REST JSON API: /quote</h3>
            <p style="color:#c9d1d9; font-size: 14px;">Sinh câu danh ngôn truyền cảm hứng theo lập trình, cuộc sống và trạng thái người dùng (kèm model LLM sinh ra):</p>
            <div class="links">
              <a class="btn primary" href="/quote" target="_blank">Gọi API mặc định (/quote)</a>
              <a class="btn" href="/quote?topic=coding&lang=vi" target="_blank">Code (Tiếng Việt)</a>
              <a class="btn" href="/quote?topic=life" target="_blank">Life Quote</a>
              <a class="btn" href="/quote?status=fixing+memory+leak+late+at+night&tone=humorous" target="_blank">Status: Fixing Bug (Humor)</a>
              <a class="btn" href="/quote?topic=motivation&lang=vi" target="_blank">Động lực (Tiếng Việt)</a>
            </div>
          </div>

          <!-- USAGE IN README -->
          <div class="section-title">📋 Cách chèn vào GitHub Profile README.md</div>
          <p style="color:#8b949e; font-size: 14px;">Thay <code>YOUR_APP_URL</code> bằng domain Vercel sau khi bạn deploy:</p>
          
          <h4 style="color:#c9d1d9; margin-bottom: 4px;">Thẻ Đồng hồ động (Terminal HUD Clock):</h4>
          <div class="code-block">
![Terminal Clock](https://YOUR_APP_URL/clock?theme=dark&tz=Asia/Ho_Chi_Minh)
          </div>

          <h4 style="color:#c9d1d9; margin-bottom: 4px;">Thẻ Spotify Presence:</h4>
          <div class="code-block">
[![Spotify Presence](https://YOUR_APP_URL/spotify)](https://YOUR_APP_URL/spotify?redirect=true)
          </div>

          <h4 style="color:#c9d1d9; margin-bottom: 4px;">Thẻ Top Tracks:</h4>
          <div class="code-block">
![Top Tracks](https://YOUR_APP_URL/top-tracks?range=short_term)
          </div>
        </div>
      </body>
      </html>
    `);
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

server.listen(PORT, () => {
  console.log(`🚀 Spotify, Clock & Quote Server đang chạy tại: http://localhost:${PORT}`);
  console.log(`👉 Xem trước Widgets: http://localhost:${PORT}`);
  console.log(`👉 API Quote (LLM): http://localhost:${PORT}/quote`);
  console.log(`👉 API Clock: http://localhost:${PORT}/clock`);
  console.log(`👉 API Presence: http://localhost:${PORT}/spotify`);
  console.log(`👉 API Top Tracks: http://localhost:${PORT}/top-tracks`);
});
