# ⚡ GitHub Profile Widgets (Spotify & Terminal Ticking Clock)

Bộ sưu tập widget SVG động theo thời gian thực (Zero-Cache) để gắn vào GitHub Profile README:

1. **⏱️ Terminal Ticking Clock:** Đồng hồ phong cách cửa sổ Terminal tối giản (macOS style với 3 chấm màu), **nhảy số đếm Giờ : Phút : Giây thực tế** bằng Pure CSS `@keyframes` cascading reels, hỗ trợ co giãn tỉ lệ `scale`, tùy chỉnh `width`/`height`, mọi múi giờ IANA và đa dạng theme (`matrix`, `cyberpunk`, `dark`, `light`, `transparent`).
2. **🎵 Spotify Presence:** Thẻ trạng thái bài hát đang nghe theo thời gian thực (kèm hiệu ứng sóng nhạc Equalizer) hoặc bài nghe gần nhất.
3. **🏆 Spotify Top Tracks:** Thẻ danh sách bài hát bạn nghe nhiều nhất với hiệu ứng cuộn tự động (Infinite Auto-Scroll Carousel) và dừng khi rê chuột (Carousel Inspection).

---

## ⏱️ 1. Widget Đồng hồ Terminal Đếm Giờ Thực (Terminal Ticking Clock)

Đồng hồ chạy trực tiếp trên GitHub README mà không cần JavaScript. Sử dụng kỹ thuật dải cuộn số CSS (Cascading Digit Reels) đồng bộ chính xác:
- **Giây**: Nhảy số từng giây một (`steps(60)`).
- **Phút**: Tự động bước sang phút mới ngay khi giây chạm `59 ➔ 00`.
- **Giờ**: Tự động bước sang giờ mới ngay khi phút chạm `59 ➔ 00`.

### Cú pháp nhúng vào GitHub Profile `README.md`:

```markdown
![Terminal Clock](https://YOUR_APP_URL/clock?theme=dark&tz=Asia/Ho_Chi_Minh)
```

Hoặc gắn link mở trang chủ preview khi click:

```markdown
[![Terminal Clock](https://YOUR_APP_URL/clock?theme=matrix&tz=Asia/Ho_Chi_Minh&scale=1.1)](https://YOUR_APP_URL)
```

### Các Query Parameters tùy chỉnh:

| Tham số | Giá trị | Mặc định | Ý nghĩa |
| :--- | :--- | :--- | :--- |
| `tz` | Múi giờ IANA (vd: `Asia/Ho_Chi_Minh`, `Asia/Tokyo`, `America/New_York`, `Europe/London`, `UTC`) | `Asia/Ho_Chi_Minh` | Múi giờ hiển thị của đồng hồ. Tự động fallback nếu nhập sai. |
| `scale` | Số thực (vd: `0.8`, `1.0`, `1.2`, `1.5`) | `1.0` | Tự động co giãn toàn bộ kích thước đồng hồ theo tỉ lệ cân đối. |
| `width` | Số nguyên pixel (vd: `280`, `350`) | `280` | Chiều rộng tùy chỉnh. |
| `height` | Số nguyên pixel (vd: `85`, `100`) | `85` | Chiều cao tùy chỉnh. |
| `theme` | `dark`, `light`, `matrix`, `cyberpunk`, `transparent` | `dark` | Bảng màu giao diện: Matrix (xanh hacker neon), Cyberpunk (hồng/cyan), Nền trong suốt,... |
| `format` | `24`, `12`, `json` | `24` | Định dạng 24 giờ (`14:30:45`), 12 giờ kèm AM/PM (`02:30:45 PM`) hoặc trả về JSON. |

#### Ví dụ đường dẫn:
- Múi giờ Việt Nam (Dark Theme chuẩn): `https://YOUR_APP_URL/clock`
- Phóng to 1.2 lần (Hacker Matrix Theme): `https://YOUR_APP_URL/clock?theme=matrix&scale=1.2`
- Nhỏ gọn 0.8 lần: `https://YOUR_APP_URL/clock?scale=0.8`
- Cyberpunk Neon Theme (New York): `https://YOUR_APP_URL/clock?theme=cyberpunk&tz=America/New_York`
- Định dạng 12 giờ (AM/PM): `https://YOUR_APP_URL/clock?format=12`
- Nền trong suốt (Transparent): `https://YOUR_APP_URL/clock?theme=transparent`

> [!NOTE]
> **Khả năng đếm giờ thực tế trên GitHub:**
> Nhờ kỹ thuật CSS animation cascading reels, khi người xem mở trang cá nhân GitHub của bạn, **số giây sẽ nhảy liên tục từng giây một, phút và giờ sẽ tự động nhảy số khi hết chu kỳ**. Server luôn trả về header `no-cache` để mỗi lần tải lại trang hoặc proxy làm mới là đồng hồ lập tức đồng bộ theo mốc giờ mới nhất của server.

---

## 🎵 2. Spotify Widgets Setup

### Bước 1: Cấu hình Spotify Developer Dashboard
1. Truy cập [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) và tạo/chọn app.
2. Vào mục **Settings** -> **Redirect URIs**, thêm URI:
   ```
   http://127.0.0.1:8888/callback
   ```
3. Nhấn **Save**.

### Bước 2: Lấy Refresh Token
```bash
yarn auth
# hoặc npm run auth
```
Mở đường link in ra trong terminal, đăng nhập và nhấn **Agree**. Script sẽ tự động lấy `SPOTIFY_REFRESH_TOKEN` và lưu vào file `.env`.

### Bước 3: Cú pháp nhúng Spotify vào README:

#### 🎧 Bài hát đang nghe (Presence):
```markdown
[![Spotify Presence](https://YOUR_APP_URL/spotify)](https://YOUR_APP_URL/spotify?redirect=true)
```

#### 📜 Top bài hát yêu thích (Top Tracks):
```markdown
![Top Tracks](https://YOUR_APP_URL/top-tracks?range=short_term)
```

---

## 🤖 3. LLM Quote Generator API (`/quote`)

REST API sinh câu danh ngôn lập trình, cuộc sống hoặc động lực theo ngữ cảnh tâm trạng/trạng thái (`status`) của người dùng, hỗ trợ chuyển đổi linh hoạt giữa các nhà cung cấp **Google Gemini**, **Groq**, **Anthropic Claude**, **OpenAI**, **DeepSeek**:

### Endpoint:
```
GET /quote
GET /api/quote
```

### Tham số Query Parameters:
| Tham số | Mặc định | Ý nghĩa |
| :--- | :--- | :--- |
| `topic` | `coding` | Chủ đề quote: `coding`, `life`, `motivation`, `humor`. |
| `status` | `null` | Ngữ cảnh hoặc tâm trạng (vd: `fixing bugs`, `deploying to production`, `tired`). |
| `lang` | `en` | Ngôn ngữ câu quote: `en` (Tiếng Anh) hoặc `vi` (Tiếng Việt). |
| `tone` | `inspirational` | Giọng điệu: `inspirational`, `philosophical`, `humorous`, `sarcastic`. |
| `provider` | `auto` | Chỉ định provider: `gemini`, `groq`, `claude`, `openai` (nếu có cấu hình API Key tương ứng). |

### Ví dụ phản hồi JSON:
```json
{
  "quote": "Code is like humor. When you have to explain it, it’s bad.",
  "author": "Cory House",
  "topic": "coding",
  "status": "fixing bugs",
  "model": "gemini-3.6-flash",
  "language": "en",
  "timestamp": 1726215600000
}
```

> [!TIP]
> **Hỗ trợ đa nhà cung cấp (Multi-Provider):**
> - **Google Gemini**: Thêm `GEMINI_API_KEY` (khuyên dùng, miễn phí từ Google AI Studio, model mặc định: `gemini-3.6-flash`).
> - **Groq**: Thêm `GROQ_API_KEY` (tốc độ ~500ms, model mặc định: `llama-3.3-70b-versatile`).
> - **Anthropic Claude**: Thêm `ANTHROPIC_API_KEY` (model mặc định: `claude-3-5-haiku-20241022`).
> - **OpenAI**: Thêm `OPENAI_API_KEY` (model mặc định: `gpt-4o-mini`).
> - **Offline Fallback:** Nếu chưa cấu hình bất kỳ API Key nào, API tự động trả về câu quote phong phú từ kho offline với `"model": "offline-fallback"`.

---

## 💻 4. Chạy thử nghiệm trên máy cục bộ (Local Preview)

```bash
yarn server
# hoặc npm run server
```

Mở trình duyệt truy cập: [http://localhost:3000](http://localhost:3000)
- Trang chủ tích hợp sẵn bộ xem trước trực quan cho tất cả widget (Đồng hồ chạy nhảy giây trực tiếp, test đổi theme/múi giờ và thẻ Spotify).

---

## 🚀 4. Hướng dẫn Deploy lên Vercel (1-Click)

Dự án đã được cấu hình file [vercel.json](vercel.json) tự động rewrite route (`/clock`, `/quote`, `/spotify`, `/top-tracks`) sẵn sàng deploy:

1. Đẩy mã nguồn lên repository GitHub của bạn:
   ```bash
   git push origin main
   ```
2. Truy cập [vercel.com](https://vercel.com), bấm **Add New Project** và chọn repository này.
3. Cấu hình biến môi trường tại mục **Environment Variables** (nếu dùng):
   - **Spotify**: `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REFRESH_TOKEN`
   - **LLM Quote (tùy chọn)**: `LLM_API_KEY`, `LLM_BASE_URL` (nếu dùng Groq/DeepSeek), `LLM_MODEL`
   *(Nếu bạn chỉ sử dụng **Clock Widget** hoặc dùng Quote với danh mục offline fallback, bạn hoàn toàn không cần cấu hình thêm biến môi trường nào!)*
4. Nhấn **Deploy**. Bạn sẽ nhận được URL public (ví dụ: `https://my-github-widget.vercel.app`).

---

## 🧪 5. Chạy Kiểm thử & Lint

```bash
# Chạy bộ test tự động (Node.js Test Runner)
npm test

# Kiểm tra cú pháp và quy chuẩn code
npm run lint
```
