# Module 04 — Auth trong Revit (Login / Register / Forgot password)

**Mục tiêu:** Dialog WPF trong Revit cho phép đăng nhập, đăng ký, quên mật khẩu, gọi thẳng Supabase Auth (GoTrue) — không cần mở web.

**Phụ thuộc:** Module 01 (auth.users → trigger profiles). Cung cấp `access_token` cho Module 05.

**Deliverables (C#/.NET trong project add-in):**
```
Auth/
  SupabaseAuthClient.cs   // gọi GoTrue REST
  TokenStore.cs           // lưu refresh_token mã hoá DPAPI
  Models/AuthModels.cs
UI/
  LoginWindow.xaml(.cs)   // tab: Đăng nhập / Đăng ký / Quên mật khẩu
```

## GoTrue endpoints (dùng anon key)

| Hành động | Endpoint |
|---|---|
| Đăng ký | `POST {SUPABASE_URL}/auth/v1/signup` |
| Đăng nhập | `POST /auth/v1/token?grant_type=password` |
| Refresh | `POST /auth/v1/token?grant_type=refresh_token` |
| Quên mật khẩu | `POST /auth/v1/recover` |

Header chung: `apikey: <ANON_KEY>`, `Content-Type: application/json`.

## Task checklist

- [ ] `SupabaseAuthClient`: 4 method async (SignUp, SignIn, Refresh, Recover), parse lỗi GoTrue → message tiếng Việt.
- [ ] `TokenStore`: lưu `{ refresh_token, user_id, email }` mã hoá `ProtectedData` (DPAPI, scope CurrentUser) tại `%APPDATA%/<App>/auth.dat`.
- [ ] Khởi động: nếu có refresh_token → Refresh ngầm; thất bại → mở LoginWindow.
- [ ] LoginWindow:
  - [ ] Tab **Đăng nhập**: email + password → SignIn → lưu token → đóng, tiếp `/activate` (module 05).
  - [ ] Tab **Đăng ký**: full_name + email + password + SĐT → SignUp → báo "kiểm tra email xác nhận".
  - [ ] Tab **Quên mật khẩu**: email → Recover → báo "đã gửi link reset, đặt lại trên web".
  - [ ] Validate SĐT regex `^(0|\+84)[0-9]{9}$`, email hợp lệ.
- [ ] Lưu `phone`, `full_name` vào `profiles` (qua user metadata khi signup hoặc PATCH sau login).

## Quy tắc

- **Reset mật khẩu KHÔNG làm trong Revit** — chỉ trigger email; user đổi trên trang web `/reset-password` (module 08).
- `access_token` chỉ giữ trong RAM; chỉ `refresh_token` lưu đĩa (mã hoá).
- HttpClient static tái dùng, timeout 5s, không block UI (async/await).

## Acceptance criteria

- [ ] Đăng ký mới → nhận email xác nhận → đăng nhập được.
- [ ] Đăng nhập sai → báo lỗi tiếng Việt rõ ràng.
- [ ] Đóng/mở Revit lại → không phải đăng nhập lại (refresh_token).
- [ ] Quên mật khẩu → nhận email reset, đổi trên web, đăng nhập lại OK.
- [ ] File `auth.dat` copy sang máy khác (user Windows khác) → không giải mã được (DPAPI).
