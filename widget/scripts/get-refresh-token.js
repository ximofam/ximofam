// scripts/get-refresh-token.js
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env');

// 1. Load .env
if (fs.existsSync(envPath)) {
  try {
    process.loadEnvFile(envPath);
  } catch (err) {
    console.error('Lỗi khi đọc file .env:', err.message);
  }
} else {
  console.error('❌ Không tìm thấy file .env tại:', envPath);
  process.exit(1);
}

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const PORT = process.env.AUTH_PORT || 8888;
const REDIRECT_URI = `http://127.0.0.1:${PORT}/callback`;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('❌ Thiếu SPOTIFY_CLIENT_ID hoặc SPOTIFY_CLIENT_SECRET trong file .env!');
  console.error('Vui lòng thêm vào file .env rồi chạy lại.');
  process.exit(1);
}

const SCOPES = [
  'user-read-currently-playing',
  'user-read-playback-state',
  'user-read-recently-played',
  'user-top-read',
].join(' ');

const authUrl = `https://accounts.spotify.com/authorize?${new URLSearchParams({
  client_id: CLIENT_ID,
  response_type: 'code',
  redirect_uri: REDIRECT_URI,
  scope: SCOPES,
}).toString()}`;

// 2. Start temporary local server to catch the callback
const server = http.createServer(async (req, res) => {
  const reqUrl = new URL(req.url, `http://127.0.0.1:${PORT}`);

  if (reqUrl.pathname === '/callback') {
    const code = reqUrl.searchParams.get('code');
    const error = reqUrl.searchParams.get('error');

    if (error) {
      res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`<h2>❌ Lỗi xác thực Spotify: ${error}</h2>`);
      console.error(`❌ Lỗi xác thực: ${error}`);
      process.exit(1);
    }

    if (!code) {
      res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end('<h2>❌ Không nhận được authorization code từ Spotify.</h2>');
      return;
    }

    try {
      // 3. Exchange code for access & refresh token
      const basic = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
      const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${basic}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: REDIRECT_URI,
        }),
      });

      const tokenData = await tokenRes.json();

      if (!tokenRes.ok || !tokenData.refresh_token) {
        throw new Error(tokenData.error_description || tokenData.error || 'Không lấy được refresh_token');
      }

      const refreshToken = tokenData.refresh_token;

      // 4. Save refresh_token into .env
      let envContent = fs.readFileSync(envPath, 'utf8');
      if (envContent.includes('SPOTIFY_REFRESH_TOKEN=')) {
        envContent = envContent.replace(/SPOTIFY_REFRESH_TOKEN=.*/g, `SPOTIFY_REFRESH_TOKEN=${refreshToken}`);
      } else {
        envContent = envContent.trimEnd() + `\nSPOTIFY_REFRESH_TOKEN=${refreshToken}\n`;
      }
      fs.writeFileSync(envPath, envContent, 'utf8');

      // 5. Send success response
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Spotify Auth Success</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #121212; color: #fff; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .card { background: #18181b; border: 1px solid #27272a; padding: 40px; border-radius: 12px; text-align: center; max-width: 480px; box-shadow: 0 8px 24px rgba(0,0,0,0.5); }
            h1 { color: #1DB954; margin-top: 0; font-size: 24px; }
            p { color: #a1a1aa; line-height: 1.6; }
            code { background: #27272a; color: #1DB954; padding: 4px 8px; border-radius: 4px; font-size: 13px; word-break: break-all; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>🎉 Cấp quyền thành công!</h1>
            <p><strong>SPOTIFY_REFRESH_TOKEN</strong> đã được tự động lưu vào file <code>.env</code>.</p>
            <p>Bây giờ bạn có thể đóng tab trình duyệt này lại và quay trở lại terminal để kiểm tra API.</p>
          </div>
        </body>
        </html>
      `);

      console.log('\n======================================================');
      console.log('🎉 CẤP QUYỀN SPOTIFY THÀNH CÔNG!');
      console.log('Đã tự động lưu SPOTIFY_REFRESH_TOKEN vào .env:');
      console.log(`SPOTIFY_REFRESH_TOKEN=${refreshToken}`);
      console.log('======================================================\n');

      setTimeout(() => {
        server.close(() => process.exit(0));
      }, 1000);
    } catch (err) {
      console.error('❌ Lỗi khi đổi token:', err.message);
      res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`<h2>❌ Lỗi: ${err.message}</h2>`);
    }
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('\n======================================================');
  console.log('🎵 SPOTIFY PRESENCE - HƯỚNG DẪN LẤY REFRESH TOKEN');
  console.log('======================================================');
  console.log('1. Đảm bảo bạn đã thêm Redirect URI sau vào Spotify Developer App:');
  console.log(`   👉 ${REDIRECT_URI}`);
  console.log('   (Vào https://developer.spotify.com/dashboard -> Chọn App -> Settings -> Redirect URIs -> Add & Save)');
  console.log('\n2. Nhấn vào liên kết sau (hoặc copy vào trình duyệt) để cấp quyền:');
  console.log(`   👉 ${authUrl}`);
  console.log('======================================================\n');
  console.log(`⏳ Đang chờ xác thực từ trình duyệt tại cổng ${PORT}... (Nhấn Ctrl+C để hủy)`);
});
