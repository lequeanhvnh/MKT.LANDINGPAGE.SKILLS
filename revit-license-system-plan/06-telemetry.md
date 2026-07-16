# Module 06 — Telemetry (Usage + Error log + Dashboard)

**Mục tiêu:** Ghi mọi lần chạy command (success/error/denied) để (a) thống kê tool ưa thích nhất, (b) thu thập lỗi thực địa để debug.

**Phụ thuộc:** Module 01 (usage_events, mv_tool_daily), Module 05 (CommandBase wrapper).

**Deliverables:**
- Add-in: `Telemetry/TelemetryClient.cs`, `Telemetry/EventQueue.cs`, `Telemetry/UsageEvent.cs`
- API: `app/api/telemetry/route.ts` (Next.js, batch ingest)  *(hoặc insert PostgREST trực tiếp)*
- Web/Admin queries (module 08 dùng)

## Phía Add-in — gửi fire-and-forget (xem doc gốc 10.2)

- [ ] `UsageEvent`: command_id, product_code, status, duration_ms, revit_version, app_version, error_code, error_message, stack_trace, session_id, started_at.
- [ ] `session_id` = GUID mỗi lần mở Revit.
- [ ] `EventQueue`: hàng đợi RAM + backup file; flush khi đủ N (vd 20) hoặc 30s.
- [ ] `TelemetryClient.Flush()`: gửi batch `POST /api/telemetry` (Bearer access_token). Fail → giữ lại retry.
- [ ] Offline-safe: lưu file `%APPDATA%/<App>/telemetry-queue.jsonl`, gửi bù lần sau.
- [ ] **KHÔNG** chặn command — chạy nền (Task.Run / channel).
- [ ] `CommandBase` tự log: Stopwatch quanh logic, try/catch ghi error.

## Phía API — `POST /api/telemetry` (Next.js, runtime='nodejs')

- [ ] Verify user JWT → user_id (ép `user_id` = token, bỏ giá trị client gửi → chống giả mạo).
- [ ] Nhận mảng event (giới hạn ≤ 200/req), validate schema.
- [ ] Bulk insert `usage_events` qua supabase-js (service role). Cắt `stack_trace` ≤ 8KB.
- [ ] Trả `{ accepted: n }`. Idempotent không bắt buộc (trùng nhẹ chấp nhận được; có thể dedupe theo client event_id nếu cần).

> Phương án thay thế: bỏ route, insert thẳng PostgREST với RLS `INSERT WHERE user_id = auth.uid()`. Đơn giản hơn nhưng khó validate/cắt stack_trace → khuyến nghị dùng API route.

## Dung lượng & retention (QUAN TRỌNG khi scale)

Với 200 DAU dùng liên tục ≈ **40.000 event/ngày** → giữ 180 ngày ≈ **7 triệu dòng**, có stack_trace có thể lên vài GB → **vượt Supabase Free 500MB**. Chiến lược:
- [ ] Dùng **Supabase Pro** (8GB) khi production.
- [ ] Event `success` ghi **gọn** (không stack_trace); chỉ `error` lưu full stack (≤8KB).
- [ ] Rollup sang `mv_tool_daily` mỗi đêm, rồi **prune `usage_events` raw sau 30–90 ngày** (job `daily_cleanup`, module 01/09) — số liệu thống kê lâu dài nằm ở rollup, không cần raw.
- [ ] (Tuỳ chọn) sample event `success` (vd giữ 100%) nhưng luôn giữ đủ `error`/`denied`.
- [ ] Cân nhắc partition `usage_events` theo tháng để drop partition cũ nhanh.

## Thống kê (query cho admin — module 08)

- **Top tool ưa thích:** `SELECT command_id, sum(runs) r FROM mv_tool_daily WHERE day >= :from GROUP BY 1 ORDER BY r DESC`.
- **Tỷ lệ lỗi từng tool:** `sum(errors)::float/nullif(sum(runs),0)`.
- **Top lỗi:** `SELECT error_code, error_message, count(*) FROM usage_events WHERE status='error' AND started_at>=:from GROUP BY 1,2 ORDER BY 3 DESC LIMIT 50` (kèm 1 mẫu stack_trace).
- **Usage hôm nay theo user:** `... WHERE user_id=:u AND started_at::date = current_date`.
- **DAU / theo bộ môn:** count distinct user theo ngày, group product_code.

## Acceptance criteria

- [ ] Chạy 1 command → sau ≤30s xuất hiện 1 dòng `usage_events` status='success' + duration.
- [ ] Command throw → có dòng status='error' kèm error_message + stack_trace.
- [ ] Command bị chặn quyền → status='denied'.
- [ ] Ngắt mạng chạy vài command → có mạng lại → event được gửi bù.
- [ ] Client cố gửi event với user_id người khác → server ép về user_id thật.
- [ ] `mv_tool_daily` sau refresh trả đúng top tool.
