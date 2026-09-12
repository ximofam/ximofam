# 🎵 Spotify Widgets for GitHub Profile

Bộ API tích hợp Spotify đọc cấu hình từ `.env` và tự động render các thẻ card SVG tuyệt đẹp để nhúng vào GitHub Profile README:
1. **Spotify Presence:** Thẻ trạng thái bài hát đang nghe theo thời gian thực (kèm hiệu ứng Equalizer sóng nhạc chuyển động) hoặc bài nghe gần nhất.
2. **Top Tracks:** Thẻ danh sách bài hát bạn nghe nhiều nhất (Top 5 / Top 10, tùy chọn 4 tuần qua, 6 tháng qua hoặc toàn thời gian).

---

## 🚀 Các bước cài đặt & sử dụng

### 1. Cấu hình Spotify Developer Dashboard
1. Truy cập [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) và chọn ứng dụng của bạn.
2. Vào mục **Settings** -> **Redirect URIs**.
3. Thêm URI sau:
   ```
   http://127.0.0.1:8888/callback
   ```
4. Nhấn **Add** và nhấn **Save** ở cuối trang.

---

### 2. Cấp quyền & Lấy `SPOTIFY_REFRESH_TOKEN`
Chạy lệnh sau tại thư mục `my-github-widget`:

```bash
yarn auth
# hoặc npm run auth
```

Script sẽ in ra đường link cấp quyền bao gồm cả quyền xem playback và top tracks (`user-read-currently-playing`, `user-read-playback-state`, `user-read-recently-played`, `user-top-read`). 

Mở link trên trình duyệt, đăng nhập và nhấn **Agree**. Script sẽ tự động lấy `refresh_token` và ghi đè vào file `.env`!

---

### 3. Chạy thử nghiệm trên máy (Local)

```bash
yarn server
# hoặc npm run server
```

- **Trang xem trước tổng quan:** [http://localhost:3000](http://localhost:3000)
- **API Presence (Đang nghe):** [http://localhost:3000/api/spotify](http://localhost:3000/api/spotify)
- **API Top Tracks (Nghe nhiều nhất):** [http://localhost:3000/api/top-tracks](http://localhost:3000/api/top-tracks)
- **Tùy chọn Top Tracks:**
  - 4 tuần qua: `http://localhost:3000/api/top-tracks?range=short_term`
  - 6 tháng qua: `http://localhost:3000/api/top-tracks?range=medium_term`
  - Toàn thời gian: `http://localhost:3000/api/top-tracks?range=long_term`
  - Số lượng bài: `http://localhost:3000/api/top-tracks?limit=5` (hoặc 10)
  - Light theme: `http://localhost:3000/api/top-tracks?theme=light`
  - Raw JSON: `http://localhost:3000/api/top-tracks?format=json`

---

### 4. Deploy lên Vercel (Miễn phí & Serverless)

1. Đẩy thư mục hoặc repository lên GitHub.
2. Truy cập [vercel.com](https://vercel.com) và Import repository.
3. Vào phần **Environment Variables**, thêm 3 biến từ `.env`:
   - `SPOTIFY_CLIENT_ID`
   - `SPOTIFY_CLIENT_SECRET`
   - `SPOTIFY_REFRESH_TOKEN`
4. Bấm **Deploy**. Bạn sẽ nhận được URL production (ví dụ `https://my-github-widget.vercel.app`).

---

### 5. Thêm vào GitHub Profile `README.md`

Dán đoạn mã sau vào file `README.md` (thay `YOUR_APP_URL` bằng domain Vercel của bạn):

#### 🎵 1. Thẻ bài hát đang nghe:
```markdown
[![Spotify Presence](https://YOUR_APP_URL/api/spotify)](https://YOUR_APP_URL/api/spotify?redirect=true)
```

#### 🏆 2. Thẻ top bài hát nghe nhiều nhất:
```markdown
[![Top Tracks](https://YOUR_APP_URL/api/top-tracks?range=short_term&limit=5)](https://open.spotify.com)
```
