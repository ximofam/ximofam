# AGENTS.md

## Agent skills

### Issue tracker

GitHub issues via `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default 5 canonical triage labels (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context (`CONTEXT.md` + `docs/adr/`). See `docs/agents/domain.md`.

### Handoff

Khi sử dụng `/handoff`, luôn ghi file tài liệu tóm tắt context ra thư mục `.scratch/handoff/` trong workspace (tự động tạo nếu chưa có). Tên file Markdown bắt buộc có tiền tố là timestamp (ví dụ: `YYYYMMDD_HHMMSS-handoff.md` hoặc `YYYYMMDD_HHMMSS-<name>.md`) để có thể theo dõi theo trình tự thời gian và dễ dàng nạp lại context mới nhất.
