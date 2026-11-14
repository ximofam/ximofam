# Gộp `my-github-widget` vào `ximofam/ximofam`

## Mục tiêu

- Một repo duy nhất chứa profile README và toàn bộ source widget.
- Giữ nguyên domain Vercel `my-github-widget.vercel.app` và auto-deploy theo Git.
- Giữ lịch sử commit của widget.

## Ngoài phạm vi

- Không đổi nội dung, giao diện hay API của widget.
- Không đổi logic 2 workflow daily quote / WakaTime.
- Không migrate issues/labels (repo cũ không có issue/PR mở).

## Ràng buộc

- `ximofam/ximofam` là repo **PUBLIC**, `my-github-widget` là repo **PRIVATE**. Gộp nghĩa là source widget và toàn bộ history sẽ công khai. Đã kiểm tra: file `.env` chưa từng được commit, history không chứa API key/secret.
- README và workflow daily quote đang hardcode `https://my-github-widget.vercel.app/...`, nên phải giữ domain cũ.
- Máy local không có Vercel CLI/token → bước nối project Vercel thực hiện qua dashboard.

## Cách làm

1. `git subtree add --prefix=widget git@github.com:ximofam/my-github-widget.git main` để giữ history và gộp vào thư mục `widget/`.
2. Bỏ tooling agent trùng lặp: `widget/.agents/`, `widget/skills-lock.json`, `widget/docs/agents/`, `widget/AGENTS.md`. Giữ `widget/CONTEXT.md` làm domain context.
3. Copy `.env` local sang `widget/.env` (vẫn untracked) để dev/test tiếp.
4. Root giữ nguyên README, `scripts/`, `.github/`.

## Deploy

1. Trong Vercel project `my-github-widget`: Settings → Git → đổi repo sang `ximofam/ximofam`, Root Directory = `widget`, Production Branch = `main`.
2. Push commit gộp → Vercel tự build/deploy, domain giữ nguyên.
3. Fallback nếu dashboard không cho đổi repo: tạo project mới từ repo mới rồi trỏ domain cũ sang, hoặc deploy bằng Vercel CLI sau khi login.
4. Verify bằng `curl` 4 endpoint: `/clock`, `/spotify`, `/top-tracks`, `/quote`; chạy thử workflow daily quote.

## Kiểm chứng trước khi push

- `npm test` trong `widget/`.
- `npm run build` trong `widget/`.
- Chạy `node server.js` và `curl` 4 endpoint ở local.
- `git status` sạch, `.env` không bị track.

## Rollback

- `git revert` commit gộp, redeploy bản trước trên Vercel. Repo cũ vẫn còn cho tới khi archive.

## Sau khi deploy xanh

- Archive (read-only) hoặc xoá repo `my-github-widget` — chờ xác nhận.
- Xoá thư mục local `/home/ximofam/MyCodes/my-github-widget` — chờ xác nhận.

## Việc còn để builder

- Xác nhận đồng ý đưa source widget thành public.
- Chọn deploy qua dashboard (mặc định) hay CLI.
