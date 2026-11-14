# Widget README Rewrite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Viết lại `widget/README.md` thành tài liệu vận hành nội bộ, khớp 100% với code hiện tại.

**Architecture:** Thay toàn bộ nội dung file Markdown; không đổi code. Mọi giá trị kỹ thuật đối chiếu trực tiếp với handler/lib trong `widget/`.

**Tech Stack:** Markdown, Node 26, npm.

**Spec:** `docs/superpowers/specs/2026-11-15-widget-readme-design.md`

## Global Constraints

- Chỉ sửa `widget/README.md` (cộng 2 file spec/plan mới).
- Không dùng `YOUR_APP_URL`, không dùng `yarn`, không còn tiêu đề trùng số.
- Domain ví dụ: `https://my-github-widget.vercel.app`.
- Thông tin deploy: repo `ximofam/ximofam`, Root Directory `widget`, branch `main`.
- Mọi default phải khớp code: Groq `openai/gpt-oss-20b`, Gemini `gemini-3.6-flash`, Claude `claude-3-5-haiku-20241022`, OpenAI `gpt-4o-mini`, top-tracks limit 1–20/default 10, range default `short_term`.

## Review Focus

- Default/model lệch code → đối chiếu từng dòng bảng với `api/lib/llmQuote.js` và `api/top-tracks.js`.
- Theme không đúng phạm vi: clock có 5 theme, card Spotify chỉ `dark`/`light` → ghi rõ theo endpoint.
- Lệnh local không chạy được (`yarn`, `dev` không có API) → chỉ dùng `npm run server` cho local API.
- Deploy guide lại bảo chọn repo root → ghi rõ Root Directory `widget`.
- Link tương đối hỏng sau khi file nằm trong `widget/` → kiểm tra `test -f` cho mọi link nội bộ.

---

### Task 1: Viết lại README và xác thực

**Files:**
- Modify: `widget/README.md`
- Add: `docs/superpowers/specs/2026-11-15-widget-readme-design.md`
- Add: `docs/superpowers/plans/2026-11-15-widget-readme.md`

**Interfaces:**
- Consumes: nội dung đã duyệt trong spec.
- Produces: README mới, không ảnh hưởng code.

- [ ] **Step 1: Viết lại `widget/README.md` theo cấu trúc trong spec**

Nội dung gồm: mô tả 1 dòng, bảng 4 endpoint + params, chạy local, biến môi trường, deploy, cấu trúc thư mục, ghi chú cache. Không chèn cú pháp nhúng.

- [ ] **Step 2: Kiểm tra không còn nội dung cũ sai**

Run:
```bash
grep -nE 'YOUR_APP_URL|yarn|## .*4\.|llama-3\.3|Add New Project' widget/README.md || echo "OK: no stale content"
```
Expected: `OK: no stale content`.

- [ ] **Step 3: Đối chiếu default với code**

Run:
```bash
grep -nE "gemini-3\.6-flash|openai/gpt-oss-20b|claude-3-5-haiku-20241022|gpt-4o-mini" widget/README.md
grep -nE "validRanges|Math\.min\(20|short_term" widget/api/lib/spotify.js | head
```
Expected: README chứa đủ 4 model; code thể hiện range hợp lệ và limit ≤ 20.

- [ ] **Step 4: Kiểm tra link nội bộ**

Run:
```bash
cd widget && for f in $(grep -oE '\]\([^)#]+' README.md | sed 's/^](//' | grep -vE '^https?:'); do test -e "$f" || echo "MISSING $f"; done; echo done
```
Expected: chỉ in `done`.

- [ ] **Step 5: Chạy lại test/lint để chắc không ảnh hưởng**

Run:
```bash
cd widget && npm test && npm run lint
```
Expected: test pass 43/43; lint exit 0 (nếu lint có lỗi sẵn từ code cũ, ghi lại chính xác, không sửa code ngoài phạm vi).

- [ ] **Step 6: Commit**

```bash
git add widget/README.md docs/superpowers/specs/2026-11-15-widget-readme-design.md docs/superpowers/plans/2026-11-15-widget-readme.md
git commit -m "docs(widget): rewrite README as internal project guide"
```
