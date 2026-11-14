# Viết lại README widget — thiết kế ngắn

## Mục tiêu

`widget/README.md` trở thành tài liệu vận hành nội bộ cho app widget trong repo profile: đúng với code hiện tại, gọn, không mang giọng giới thiệu sản phẩm cho người ngoài.

## Ngoài phạm vi

- Không đổi code, endpoint hay hành vi widget.
- Không sửa README profile ở root.
- Không thêm screenshot/badge mới.

## Quyết định

- Giữ tiếng Việt, thuật ngữ kỹ thuật bằng tiếng Anh.
- Bỏ phần giới thiệu 3 widget và hướng dẫn "tạo Spotify app / deploy 1-click" cho người ngoài.
- Bỏ cú pháp nhúng `![...]` vì README root mới là nơi dùng thật; chỉ để một dòng trỏ về đó.
- Dùng domain thật `https://my-github-widget.vercel.app` trong ví dụ, không dùng `YOUR_APP_URL`.
- Chỉ dùng `npm` (máy hiện tại không chạy được `yarn` với Node 26).
- Mọi giá trị mặc định (model LLM, params, giới hạn) lấy từ code, không chép lại từ README cũ.

## Cấu trúc

1. Một dòng mô tả app + vị trí trong repo.
2. Bảng 4 endpoint kèm params thật, phân biệt theme clock (5) và theme card Spotify (dark/light).
3. Chạy local + test/lint/build/auth.
4. Biến môi trường (Spotify, 4 provider, `LLM_*`, offline fallback).
5. Deploy Vercel: repo `ximofam/ximofam`, Root Directory `widget`, branch `main`.
6. Cấu trúc thư mục.
7. Ghi chú cache/rendering.

## Nguồn xác thực

`api/clock.js`, `api/spotify.js`, `api/top-tracks.js`, `api/quote.js`, `api/lib/*.js`, `package.json`, `vercel.json`, `.env.example`.
