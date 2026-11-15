# Widget cho profile GitHub

Bốn endpoint SVG/JSON phục vụ README profile. App chạy trên Vercel, source nằm trong `widget/` của repo `ximofam/ximofam`. README ở root nhúng `/clock`, `/spotify`, `/top-tracks`; `/quote` được `scripts/generate_quote.js` gọi hằng ngày để chèn quote vào README.

Base URL: `https://my-github-widget.vercel.app`

## Endpoint

| Route | Trả về | Dùng cho |
| :--- | :--- | :--- |
| `/clock` | SVG hoặc JSON | Đồng hồ terminal nhảy giây |
| `/spotify` | SVG, JSON hoặc redirect 302 | Bài đang nghe / nghe gần nhất |
| `/top-tracks` | SVG hoặc JSON | Top tracks, auto-scroll |
| `/quote` | JSON | Quote từ LLM hoặc offline fallback |

### `/clock`

| Tham số | Giá trị | Mặc định |
| :--- | :--- | :--- |
| `tz` | Múi giờ IANA | Timezone của request (Vercel) hoặc `Asia/Ho_Chi_Minh` |
| `theme` | `dark`, `light`, `matrix`, `cyberpunk`, `transparent` | `dark` |
| `format` | `24`, `12`, `json` | `24` |
| `scale` | Số thực | `1` |
| `width` | Pixel | `280` |
| `height` | Pixel | `85` |

Ví dụ: `.../clock?theme=matrix&tz=Asia/Ho_Chi_Minh&scale=1.2`

`format=json` trả về `timestamp`, `iso`, `hours`, `minutes`, `seconds`, `period`, `dateStr`, `timezone`.

### `/spotify`

| Tham số | Giá trị | Mặc định |
| :--- | :--- | :--- |
| `theme` | `dark`, `light` | `dark` |
| `redirect` | `true` hoặc `1` để 302 sang bài hát | – |
| `format` | `json` để trả dữ liệu thô | – |

### `/top-tracks`

| Tham số | Giá trị | Mặc định |
| :--- | :--- | :--- |
| `range` | `short_term` (4 tuần), `medium_term` (6 tháng), `long_term` (all time) | `short_term` |
| `limit` | 1–20, số track lấy từ Spotify | `10` |
| `count` (hoặc `visible`) | 1–10, số track hiển thị | `4` |
| `theme` | `dark`, `light` | `dark` |
| `format` | `json` để trả dữ liệu thô | – |

Ví dụ: `.../top-tracks?range=long_term&count=4`

### `/quote`

| Tham số | Giá trị | Mặc định |
| :--- | :--- | :--- |
| `topic` | `coding`, `life`, `motivation`, `humor`, `auto` | `coding` (hoặc `auto` khi có `status`) |
| `status` | Văn bản tự do | – |
| `lang` | `en`, `vi` | `en`; tự nhận `vi` nếu `status` có dấu tiếng Việt |
| `tone` | `inspirational`, `philosophical`, `humorous`, `sarcastic`, `auto` | `inspirational` (hoặc `auto` khi có `status`) |
| `provider` | `gemini`, `groq`, `claude`, `openai` | Tự chọn theo API key đang có |

Ví dụ: `GET https://my-github-widget.vercel.app/quote?status=tired&lang=vi&topic=life`

```json
{
  "quote": "Cuộc sống là những gì diễn ra khi ta đang bận rộn với các kế hoạch khác.",
  "author": "John Lennon",
  "topic": "life",
  "status": "tired",
  "model": "gemini-3.6-flash",
  "language": "vi",
  "timestamp": 1763000000000
}
```

Không có API key nào → `"model": "offline-fallback"`.

## Chạy local

```bash
npm install
cp .env.example .env
npm run server
```

Mở `http://localhost:3000` — server local chạy cả 4 route và trang preview.

| Lệnh | Việc |
| :--- | :--- |
| `npm run server` | Server local + trang preview |
| `npm test` | Chạy `node:test` |
| `npm run lint` | ESLint |
| `npm run build` | Vite build |
| `npm run auth` | Lấy Spotify refresh token, ghi vào `.env` |

Vercel dùng `yarn.lock` khi build; trên máy local dùng `npm` (yarn chưa chạy với Node 26 hiện tại).

## Biến môi trường

| Nhóm | Biến |
| :--- | :--- |
| Spotify (bắt buộc cho `/spotify`, `/top-tracks`) | `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REFRESH_TOKEN` |
| LLM (tùy chọn) | `GEMINI_API_KEY`, `GROQ_API_KEY`, `ANTHROPIC_API_KEY` (hoặc `CLAUDE_API_KEY`), `OPENAI_API_KEY` |
| Generic | `LLM_PROVIDER`, `LLM_API_KEY`, `LLM_MODEL`, `LLM_BASE_URL` |

Thứ tự chọn provider: `LLM_PROVIDER` → Gemini → Groq → Claude → OpenAI → `LLM_API_KEY` (suy ra từ model/base URL). Không có key nào thì dùng quote offline trong `docs/offline_quotes.json`.

| Provider | Model mặc định |
| :--- | :--- |
| `gemini` | `gemini-3.6-flash` |
| `groq` | `openai/gpt-oss-20b` |
| `claude` | `claude-3-5-haiku-20241022` |
| `openai` | `gpt-4o-mini` |

## Deploy

- Vercel project: `my-github-widget`
- Repo: `ximofam/ximofam`
- Root Directory: `widget`
- Production Branch: `main`
- Domain: `my-github-widget.vercel.app`

Khai báo biến môi trường ở **Project Settings → Environment Variables**. `vercel.json` rewrite `/clock`, `/quote`, `/spotify`, `/top-tracks` về các handler trong `api/`.

`vercel.json` cũng đặt `ignoreCommand`: chỉ build khi có thay đổi trong `widget/`. Commit chỉ sửa README ở root (daily quote, WakaTime) sẽ được bỏ qua, không deploy lại.

## Cấu trúc

```text
api/          handler cho 4 route
api/lib/      render SVG, Spotify client, LLM quote
src/          Vite React app (UI mặc định)
server.js     server local + trang preview
scripts/      get-refresh-token.js
docs/         offline_quotes.json
test/         test bằng node:test
vercel.json   rewrite route
```

## Ghi chú

- `/clock`, `/spotify`, `/quote` trả `no-cache`; `/top-tracks` cache 1 giờ.
- Đồng hồ tự nhảy giây bằng CSS animation, không cần JavaScript phía client.
- Card Spotify chỉ có 2 theme `dark`/`light`; clock có 5 theme.
