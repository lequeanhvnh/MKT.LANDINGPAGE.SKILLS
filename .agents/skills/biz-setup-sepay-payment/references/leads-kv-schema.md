# Leads KV Schema — design rationale

Reference cho `lib/leads-kv.ts` (Phase 3). Đọc khi cần hiểu vì sao key naming + TTL như vậy.

---

## Schema overview

```
lead:DH000123          → { orderId, name, phone, email, productName, amount, status, createdAt, paidAt?, payment? }
phone:0901234567       → "DH000123"  (secondary index, 1 phone → 1 active order)
counter:order          → 123          (atomic INCR cho order ID)
transactions:9999999   → true         (dedup webhook payload.id, TTL 7d)
```

---

## Why these keys

### `lead:{orderId}` — primary record

- **Lookup pattern chính**: webhook nhận `content` (chứa `DH000123`) → parse → lookup KV trực tiếp bằng key `lead:DH000123`.
- **TTL 7 ngày unpaid, 90 ngày paid**: lead chưa pay sau 7 ngày = abandoned, auto-cleanup không cần worry. Lead paid giữ 90 ngày để có audit log + customer support reference.

### `phone:{phone}` — secondary index

- **Lý do tồn tại**: nếu khách dán content sai (vd: `DH000123x` typo) hoặc chỉ dán SĐT (`0901234567`), webhook vẫn lookup được lead.
- **1 phone → 1 active order**: khi `createLead` cho cùng phone, key `phone:0901234567` overwrite. Order cũ vẫn còn dưới `lead:DH000xxx` nhưng không lookup được qua phone (acceptable trade-off).
- **TTL khớp với lead**: cùng 7d unpaid hoặc 90d paid để 2 keys expire cùng nhau.

### `counter:order` — atomic counter

- Dùng `kv.incr()` (atomic INCR của Redis) → race-condition-safe ngay cả khi 100 lead concurrent.
- Format: `DH${String(n).padStart(6, '0')}` → `DH000001`, `DH000002`, ..., `DH999999`. Đủ cho 1M đơn lifetime.
- **KHÔNG TTL** — counter giữ mãi để order ID không bị reset.

### `transactions:{sepay_id}` — dedup marker

- Sepay retry webhook nếu nhận non-200 (lên đến 5 lần). Mỗi retry gửi cùng `payload.id`.
- Webhook check `kv.get('transactions:' + payload.id)` first → nếu có thì return 200 ngay, skip side effects.
- **TTL 7 ngày**: sau 7 ngày Sepay không còn retry → safely delete.

---

## Key naming convention

| Pattern | Mục đích | Ví dụ |
|---|---|---|
| `lead:` | Primary record | `lead:DH000123` |
| `phone:` | Secondary index by phone | `phone:0901234567` |
| `counter:` | Atomic counters | `counter:order` |
| `transactions:` | Dedup markers | `transactions:9999999` |

Theo pattern `<entity>:<id>` chuẩn Redis convention. Dễ pattern-match nếu sau này cần SCAN hoặc cleanup hàng loạt.

---

## TTL strategy

| Status | TTL | Rationale |
|---|---|---|
| Lead pending (mới tạo) | 7 ngày | Khách chưa pay sau 1 tuần = abandoned. Không bloat KV. |
| Lead paid | 90 ngày | Audit log, customer support reference, refund window. |
| Lead expired (auto) | — | Auto-delete khi TTL hết. Không cần cron job cleanup. |
| Transactions dedup | 7 ngày | Sepay retry tối đa ~24h. 7d safety margin. |
| Counter | None | Persistent forever. |

**Tradeoff**: Nếu có khách pay sau 7d (rare nhưng possible), webhook lookup `lead:DH000123` trả null → fall back to `phone:0901234567` (cũng đã expire). → Không lookup được → log warning, admin xử lý manual.

Cách giải quyết edge case này (optional, không default): tăng TTL pending lên 30d. Trade-off: KV usage cao hơn ~4x.

---

## Schema evolution (nếu sau này cần migrate)

Thêm field mới vào Lead type → backwards compatible vì JSON serialize:
- Read old lead (không có field mới) → undefined cho field đó.
- Write back với field mới → KV update.

Đổi key prefix → cần migration script:
```typescript
// Migrate phone:* → leadphone:*
const keys = await kv.keys('phone:*');
for (const oldKey of keys) {
  const value = await kv.get(oldKey);
  const newKey = oldKey.replace('phone:', 'leadphone:');
  const ttl = await kv.ttl(oldKey);
  await kv.set(newKey, value, { ex: ttl });
  await kv.del(oldKey);
}
```

(Chỉ làm khi cần — tránh premature migration.)

---

## Storage estimate

1 lead JSON ~500 bytes. Với 256MB free tier:
- ~500K leads max storage
- Free tier 30K commands/tháng → giới hạn read/write trước storage

→ Storage không phải bottleneck. Quota commands là bottleneck. Estimate: 100 lead/tháng = 400 commands.
