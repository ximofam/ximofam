# Gộp widget vào profile repo — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Đưa toàn bộ source + history của `my-github-widget` vào thư mục `widget/` của `ximofam/ximofam`, giữ nguyên domain Vercel và không làm hỏng profile README.

**Architecture:** Dùng `git subtree add` để import repo widget vào `widget/` (giữ history), xoá tooling agent trùng lặp, giữ nguyên root README + workflow. Vercel project được trỏ lại repo này với Root Directory `widget`, nên domain và auto-deploy không đổi.

**Tech Stack:** Git subtree, Node 26, Vite/React, Vercel, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-11-14-widget-merge-design.md`

## Global Constraints

- Domain production giữ nguyên: `https://my-github-widget.vercel.app`.
- Repo đích `ximofam/ximofam` PUBLIC; README profile phải nằm ở root.
- Không được commit `.env` hay bất kỳ secret nào.
- Không đổi nội dung README, `scripts/`, `.github/workflows/` ở root.
- Không xoá file runtime của widget: `api/`, `src/`, `public/`, `test/`, `docs/offline_quotes.json`, `server.js`, `package.json`, `yarn.lock`, `vercel.json`, `CONTEXT.md`.

## Review Focus

- **Secret bị public:** `.env` local bị `git add` nhầm khi merge → luôn kiểm tra `git ls-files widget/.env` rỗng trước khi push.
- **Mất history:** dùng `--squash` hoặc copy tay → kiểm tra `git log -- widget` phải có ≥ 8 commit.
- **Vercel build sai thư mục:** Root Directory không được set `widget` → build fail hoặc deploy trang rỗng; verify bằng curl sau deploy.
- **Widget hỏng sau deploy:** endpoint trả 404/500 do rewrite hoặc env chưa có trên Vercel → curl cả 4 endpoint.
- **Mất file runtime khi dọn tooling:** xoá nhầm `docs/` hoặc `test/` → kiểm tra danh sách file bắt buộc ở Task 2.

---

### Task 1: Import repo widget bằng subtree

**Files:**
- Create: `widget/**` (toàn bộ repo cũ)

**Interfaces:**
- Consumes: remote `git@github.com:ximofam/my-github-widget.git` nhánh `main`.
- Produces: thư mục `widget/` với đầy đủ source + history.

- [ ] **Step 1: Xác nhận working tree sạch và đang ở main**

Run:
```bash
git status --porcelain && git log -1 --oneline
```
Expected: không có dòng nào từ `git status`; commit cuối là `b594eee docs(readme): update WakaTime statistics` hoặc mới hơn.

- [ ] **Step 2: Import subtree (không squash để giữ history)**

Run:
```bash
git subtree add --prefix=widget git@github.com:ximofam/my-github-widget.git main
```
Expected: `Added dir 'widget'`, kết thúc bằng merge commit `Merge commit '<sha>' as 'widget'`.

- [ ] **Step 3: Kiểm tra history và file cốt lõi**

Run:
```bash
git log --oneline -- widget | wc -l
ls widget/api widget/src widget/test widget/public widget/server.js widget/package.json widget/vercel.json
```
Expected: số commit ≥ 8; các thư mục/file đều tồn tại.

- [ ] **Step 4: Kiểm tra không có secret trong cây làm việc và history**

Run:
```bash
git ls-files widget | grep -x 'widget/\.env' || echo "OK: no tracked .env"
git log --all --oneline -- widget/.env | wc -l
```
Expected: `OK: no tracked .env`; số commit chứa `.env` = `0`.

### Task 2: Dọn tooling agent, giữ context/runtime, commit

**Files:**
- Delete: `widget/.agents/`, `widget/skills-lock.json`, `widget/docs/agents/`, `widget/AGENTS.md`
- Keep: `widget/CONTEXT.md`, `widget/docs/offline_quotes.json`
- Create (untracked): `widget/.env` (copy từ máy local)
- Add: `docs/superpowers/specs/2026-11-14-widget-merge-design.md`, `docs/superpowers/plans/2026-11-14-widget-merge.md`

**Interfaces:**
- Consumes: `widget/` từ Task 1.
- Produces: cây `widget/` sạch để build/deploy; `.env` local vẫn dùng được.

- [ ] **Step 1: Xoá tooling trùng lặp**

Run:
```bash
git rm -r -q widget/.agents widget/docs/agents widget/skills-lock.json widget/AGENTS.md
```
Expected: các đường dẫn bị xoá, không lỗi.

- [ ] **Step 2: Kiểm tra file runtime còn đủ**

Run:
```bash
for f in widget/CONTEXT.md widget/docs/offline_quotes.json widget/api/lib/llmQuote.js widget/api/lib/renderClock.js widget/server.js widget/package.json widget/yarn.lock widget/vercel.json; do test -f "$f" || echo "MISSING $f"; done; echo done
```
Expected: chỉ in `done`.

- [ ] **Step 3: Copy `.env` local và xác nhận bị ignore**

Run:
```bash
cp /home/ximofam/MyCodes/my-github-widget/.env widget/.env
git check-ignore widget/.env
git status --short | grep -x '?? widget/\.env' || echo "OK: .env ignored"
```
Expected: `widget/.env` được in ra bởi `check-ignore`; `OK: .env ignored`.

- [ ] **Step 4: Commit phần dọn dẹp + tài liệu thiết kế/plan**

Run:
```bash
git add -A
git status --short
git commit -m "chore: merge my-github-widget into widget/ and prune agent tooling"
```
Expected: `git status` không còn `widget/.env`; commit tạo thành công.

### Task 3: Kiểm chứng widget ở local

**Files:** không sửa file; chỉ chạy kiểm tra.

**Interfaces:**
- Consumes: `widget/` đã commit ở Task 2.
- Produces: bằng chứng test/build/server đều chạy được trước khi push.

- [ ] **Step 1: Chạy unit test**

Run:
```bash
cd widget && npm test
```
Expected: 4 file test chạy, tất cả `pass`, exit code 0.

- [ ] **Step 2: Cài dependency cho build (không tạo lockfile mới)**

Run:
```bash
cd widget && npm install --no-package-lock
```
Expected: cài xong `react`, `vite`; không sinh `package-lock.json`.

- [ ] **Step 3: Build production**

Run:
```bash
cd widget && npm run build
```
Expected: Vite báo build thành công, tạo `widget/dist/`.

- [ ] **Step 4: Smoke test server local**

Run:
```bash
cd widget && PORT=3100 node server.js > /tmp/opencode/widget-server.log 2>&1 &
sleep 2
for p in clock spotify top-tracks; do curl -sS -o /dev/null -w "$p %{http_code}\n" "http://127.0.0.1:3100/$p"; done
kill %1
```
Expected: `clock 200`, `spotify 200`, `top-tracks 200`.

- [ ] **Step 5: Xác nhận working tree sạch**

Run:
```bash
git status --short
```
Expected: không có output (mọi thứ đã commit/ignore).

### Task 4: Push, trỏ lại Vercel và verify production

**Files:** không sửa file.

**Interfaces:**
- Consumes: commit sạch ở Task 3, quyền truy cập Vercel project `my-github-widget`.
- Produces: deployment mới từ `ximofam/ximofam`, domain cũ hoạt động.

- [ ] **Step 1: Trỏ Vercel project sang repo mới (thao tác dashboard, người dùng làm)**

Trong Vercel project `my-github-widget`: **Settings → Git → Connected Git Repository** đổi sang `ximofam/ximofam`; **Root Directory** = `widget`; **Production Branch** = `main`. Lưu thay đổi.

Expected: Vercel hiển thị repo mới, không đổi project name/domain.

- [ ] **Step 2: Push commit**

Run:
```bash
git push origin main
```
Expected: push thành công lên `ximofam/ximofam` nhánh `main`.

- [ ] **Step 3: Đợi Vercel build xong rồi kiểm tra 4 endpoint production**

Run:
```bash
for p in clock spotify top-tracks "quote?lang=vi"; do curl -sS -o /dev/null -w "$p %{http_code} %{content_type}\n" "https://my-github-widget.vercel.app/$p"; done
```
Expected: cả 4 đều `200`; `clock/spotify/top-tracks` trả `image/svg+xml`, `quote` trả `application/json`.

- [ ] **Step 4: Chạy thử workflow daily quote**

Run:
```bash
gh workflow run daily-quote.yml -R ximofam/ximofam
sleep 5
gh run list -R ximofam/ximofam --workflow=daily-quote.yml --limit 1
```
Expected: run mới nhất có trạng thái `completed`/`success` (theo dõi bằng `gh run watch <id> -R ximofam/ximofam` nếu còn chạy).

- [ ] **Step 5: Xác nhận README không đổi ngoài phần quote**

Run:
```bash
git fetch origin && git status -sb
```
Expected: `main...origin/main` không ahead/behind sau khi workflow commit (nếu workflow vừa commit thì pull về).

### Task 5: Dọn dẹp sau khi deploy xanh (chờ xác nhận)

**Files:** không sửa trong repo.

**Interfaces:**
- Consumes: Task 4 xanh.
- Produces: chỉ còn một repo duy nhất.

- [ ] **Step 1: Hỏi người dùng chọn archive hay xoá repo cũ**

Không tự chạy lệnh xoá. Chờ xác nhận rõ ràng.

- [ ] **Step 2: Archive repo cũ (mặc định khuyến nghị)**

Run (chỉ sau khi được xác nhận):
```bash
gh repo archive ximofam/my-github-widget --yes
```
Expected: `Archived repository ximofam/my-github-widget`.

- [ ] **Step 3: Xoá thư mục local cũ (chỉ sau khi được xác nhận)**

Run:
```bash
rm -rf /home/ximofam/MyCodes/my-github-widget
```
Expected: thư mục không còn tồn tại; `widget/` trong repo này là bản duy nhất.
