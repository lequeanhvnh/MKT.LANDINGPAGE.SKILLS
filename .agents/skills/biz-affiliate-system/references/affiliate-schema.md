# Affiliate schema — 3 bảng + vòng đời hoa hồng

Đọc file này trước khi áp migration để hiểu rõ thiết kế. Migration đầy đủ:
`templates/supabase-migration-affiliate.sql`.

## Mục lục
- [Sơ đồ quan hệ](#sơ-đồ-quan-hệ)
- [Bảng affiliates](#bảng-affiliates)
- [Bảng affiliate_clicks](#bảng-affiliate_clicks)
- [Bảng affiliate_commissions](#bảng-affiliate_commissions)
- [Cột thêm vào leads](#cột-thêm-vào-leads)
- [Vòng đời hoa hồng](#vòng-đời-hoa-hồng)
- [Quyết định thiết kế](#quyết-định-thiết-kế)

## Sơ đồ quan hệ

```
affiliates (1) ──< (N) affiliate_commissions
     │ aff_code
     └──────────────< (N) affiliate_clicks   (nối lỏng qua aff_code, không FK)

leads.aff_code  ──(tra cứu lúc đơn paid)──>  affiliates.aff_code
```

`affiliate_commissions` sinh ra từ `leads` đã paid + `affiliates` — nhưng **không FK tới `leads`** vì `leads` có TTL (pg_cron xoá sau 90 ngày) còn hoa hồng phải giữ vĩnh viễn.

## Bảng affiliates

| Cột | Kiểu | Ghi chú |
|---|---|---|
| `id` | UUID PK | |
| `name` | TEXT | họ tên đối tác |
| `email` | TEXT UNIQUE | định danh đăng nhập portal |
| `phone` | TEXT | tuỳ chọn |
| `aff_code` | TEXT UNIQUE | mã công khai trên link `?aff=`, vd `LINH7K2` |
| `tier` | TEXT | `pro` \| `elite` |
| `commission_rate` | NUMERIC(5,2) | % hoa hồng; mặc định = rate tier, chỉnh riêng được |
| `status` | TEXT | `active` \| `paused` — `paused` thì đơn mới KHÔNG sinh hoa hồng |
| `note` | TEXT | ghi chú nội bộ |
| `created_at` | TIMESTAMPTZ | |

## Bảng affiliate_clicks

Log nhẹ mỗi lần khách bấm link aff — để portal hiển thị "lượt click".

| Cột | Kiểu | Ghi chú |
|---|---|---|
| `id` | BIGINT IDENTITY PK | |
| `aff_code` | TEXT | KHÔNG FK — mã typo vẫn ghi, query theo code của đối tác nên rác tự ẩn |
| `path` | TEXT | trang khách bấm link |
| `referrer` | TEXT | |
| `created_at` | TIMESTAMPTZ | pg_cron xoá row > 180 ngày (nếu project có pg_cron) |

## Bảng affiliate_commissions

**Sổ sách tài chính — 1 đơn paid = 1 row, không bao giờ TTL.**

| Cột | Kiểu | Ghi chú |
|---|---|---|
| `id` | UUID PK | |
| `affiliate_id` | UUID FK → affiliates | ON DELETE CASCADE |
| `aff_code` | TEXT | snapshot mã lúc bán |
| `order_id` | TEXT **UNIQUE** | = `leads.order_id`. UNIQUE → webhook retry không tạo trùng |
| `customer_name` | TEXT | snapshot tên khách |
| `ticket` | TEXT | snapshot tên sản phẩm/gói |
| `order_amount` | BIGINT | snapshot giá trị đơn (VND) |
| `commission_rate` | NUMERIC(5,2) | snapshot % lúc bán |
| `commission_amount` | BIGINT | = round(order_amount × rate / 100) |
| `status` | TEXT | `pending` \| `approved` \| `paid` \| `rejected` |
| `created_at` / `approved_at` / `paid_at` | TIMESTAMPTZ | mốc thời gian theo trạng thái |
| `payout_note` | TEXT | ghi chú chi trả, vd "CK Vietcombank 01/06" |

## Cột thêm vào leads

`ALTER TABLE leads ADD COLUMN IF NOT EXISTS aff_code TEXT;` — đơn được gán cho
đối tác nào. NULL = đơn không qua link aff. Có index `leads_aff_code_idx`.

## Vòng đời hoa hồng

```
            ┌─────────────────────────────────────────────┐
            │  Đơn paid (Sepay webhook) + lead có aff_code │
            └───────────────────────┬─────────────────────┘
                                    ▼
                              ┌──────────┐   admin "Duyệt"   ┌───────────┐
                              │ pending  │ ────────────────> │ approved  │
                              └────┬─────┘                   └─────┬─────┘
                                   │ admin "Đánh dấu đã trả"       │
                                   │ ◄─────────────────────────────┘
                                   ▼
                              ┌──────────┐
                              │   paid   │  ← trạng thái cuối, có payout_note
                              └──────────┘

  Bất kỳ lúc nào (trừ paid): admin "Từ chối" → rejected (đơn hoàn tiền/huỷ).
  rejected/paid có thể "Mở lại" → pending nếu cần sửa.
```

- `pending` → tạo tự động khi đơn paid. Đối tác `paused` thì **không** tạo.
- `approved` → admin đã đối soát, xác nhận hợp lệ, chờ kỳ chi trả.
- `paid` → đã chuyển tiền cho đối tác.
- `rejected` → không tính (KHÔNG cộng vào `commissionTotal`, `revenue`, `orders`).

## Quyết định thiết kế

- **Tại sao snapshot rate + tên + số tiền vào commission?** Để hoa hồng cũ ổn
  định khi (a) admin đổi tier/rate đối tác sau này, (b) `leads` hết TTL bị xoá.
  Hoa hồng phải đọc được độc lập như một bản ghi kế toán.
- **Tại sao `order_id` UNIQUE thay vì check tồn tại trước khi insert?** Sepay
  webhook có thể retry song song. UNIQUE constraint + bắt lỗi `23505` cho
  idempotency ở tầng DB — chắc chắn hơn check-then-insert (có race).
- **Tại sao clicks không FK tới affiliates?** Khách có thể bấm link mã sai/cũ.
  Ghi hết để soi, query luôn lọc theo `aff_code` của đối tác thật nên rác vô hại.
- **Tại sao RLS deny-all?** 3 bảng đều bật RLS không policy → anon/auth bị chặn.
  Mọi truy cập đi qua API route dùng `service_role` key (bypass RLS). `aff_code`
  lộ trên URL là chủ đích; email + số liệu hoa hồng chỉ ra client qua API đã verify.
