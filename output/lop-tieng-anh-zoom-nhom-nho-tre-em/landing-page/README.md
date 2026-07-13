# English Zoom Kids landing page

Sales page Next.js 15 theo offer `02-offer.json`, sử dụng Theme 1 — Modern Learning.

## Chạy local

```bash
pnpm install
pnpm dev
```

Mở `http://localhost:3000`.

## Lead form

Form kiểm tra đúng 3 trường: họ tên, SĐT và email. Khi chưa có `LEAD_WEBHOOK_URL`, form chạy ở chế độ preview và chỉ ghi lead vào terminal server. Trước khi chạy quảng cáo, sao chép `.env.example` thành `.env.local` rồi cấu hình webhook CRM nhận JSON.
