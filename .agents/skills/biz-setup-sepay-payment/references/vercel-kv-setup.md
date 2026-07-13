# Vercel KV Setup — Upstash Redis làm lead store

Reference cho Phase 2 trong SKILL.md. Đọc khi user hỏi "Vercel KV là gì", "tạo KV namespace ra sao", "env vars của KV", "test connection".

---

## Vercel KV vs alternatives

| Option | Free tier | Latency | Khi nào dùng |
|---|---|---|---|
| **Vercel KV (Upstash Redis)** | 30K commands/tháng + 256MB | <50ms (edge) | Default cho landing page Next.js trên Vercel |
| Upstash Redis direct | 10K commands/day | <50ms | Nếu không dùng Vercel hosting |
| Vercel Postgres | 60h compute/tháng | 200-500ms | Cần SQL query phức tạp (overkill cho lead store) |
| Vercel Blob | 1GB | 100-300ms | File storage, không phù hợp KV |
| Sheet API (Google Sheets) | unlimited | 1-3s | Owner cần xem manual qua UI Sheets |

**Recommend Vercel KV** cho default — fastest setup, native Vercel UI, đủ cho 99% landing page.

---

## Bước 1 — Tạo KV namespace

1. Login [Vercel Dashboard](https://vercel.com/dashboard)
2. Vào project → tab **Storage**
3. Bấm **Create Database** → chọn **KV (Redis)** (tên cũ: Vercel KV. Backed by Upstash since 2024)
4. Đặt tên: vd `sepay-leads` hoặc `landing-page-store`
5. Region: chọn region gần user — Singapore (`sin1`) cho VN traffic
6. Pricing tier: **Hobby** (free) — đủ cho landing page <500 đơn/tháng

**Sau khi tạo**, Vercel auto-generate 4 env vars cho project:
```
KV_URL=redis://default:xxx@xxx.upstash.io:6379
KV_REST_API_URL=https://xxx.upstash.io
KV_REST_API_TOKEN=AYAxxxxx
KV_REST_API_READ_ONLY_TOKEN=AYAxxxxx
```

7. Bấm **Connect to Project** → check ✓ all environments (Development + Preview + Production) → Save.

---

## Bước 2 — Pull env xuống local

### Option A — Vercel CLI (recommended)
```bash
# Cài CLI nếu chưa có
npm install -g vercel

# Link project local với Vercel project
vercel link
# → chọn account + project

# Pull env
vercel env pull .env.local
# → file .env.local được tạo với 4 KV_* + các env khác
```

### Option B — Copy thủ công

Vercel Dashboard → Project → Settings → Environment Variables → copy từng giá trị → paste vào `.env.local`.

### Verify env loaded

```bash
cat .env.local | grep KV_REST
# Expect: KV_REST_API_URL=... + KV_REST_API_TOKEN=...
```

---

## Bước 3 — Install package

```bash
# Theo package manager của project
pnpm add @vercel/kv
# hoặc
yarn add @vercel/kv
# hoặc
npm install @vercel/kv
```

Package `@vercel/kv` là wrapper của `@upstash/redis` REST client — work mọi runtime (Edge, Node, Serverless).

---

## Bước 4 — Verify connection

Tạo file `scripts/test-kv.mjs`:

```javascript
import { kv } from '@vercel/kv';

async function test() {
  await kv.set('test:hello', 'world', { ex: 60 });
  const value = await kv.get('test:hello');
  console.log('KV connection OK:', value);
  await kv.del('test:hello');
  process.exit(0);
}

test().catch(err => {
  console.error('KV connection FAIL:', err);
  process.exit(1);
});
```

Chạy:
```bash
node --env-file=.env.local scripts/test-kv.mjs
# Hoặc Node <20:
# npx dotenv -e .env.local -- node scripts/test-kv.mjs
```

Expect: `KV connection OK: world`.

**Common errors**:

| Error | Cause | Fix |
|---|---|---|
| `Cannot find module '@vercel/kv'` | Chưa install | Chạy `pnpm add @vercel/kv` lại |
| `KV_REST_API_URL is undefined` | Env chưa load | Restart shell, hoặc dùng `--env-file` flag |
| `401 Unauthorized` | Token sai/revoke | Re-pull env: `vercel env pull` |
| `getaddrinfo ENOTFOUND` | URL malformed | Check `KV_REST_API_URL` có `https://` prefix |

---

## API quick reference

```typescript
import { kv } from '@vercel/kv';

// Set với TTL (giây)
await kv.set('key', 'value', { ex: 3600 });        // 1h TTL
await kv.set('key', { obj: 'json' }, { ex: 86400 }); // auto JSON serialize

// Get
const value = await kv.get<string>('key');         // returns null nếu không có
const obj = await kv.get<{ obj: string }>('key');  // typed JSON parse

// Delete
await kv.del('key');

// Atomic counter (cho order ID auto-increment)
const next = await kv.incr('counter:order');

// Check exists
const exists = await kv.exists('key');             // 0 hoặc 1

// Set với expire-only-if-not-exists (race-condition-safe)
await kv.set('key', 'value', { nx: true, ex: 60 });
```

Full API: https://vercel.com/docs/storage/vercel-kv/sdk

---

## Quota monitoring

Free tier: 30K commands/tháng + 256MB storage.

**Estimate cho landing page bán khoá học**:
- 1 lead = 3 set + 1 get = 4 commands
- 100 lead/tháng = 400 commands
- 1000 lead/tháng = 4000 commands

Cách check usage: Vercel Dashboard → Storage → KV namespace → Metrics tab.

Khi gần limit, Vercel cảnh báo 7 ngày trước. Upgrade Pro tier (~$10/tháng) cho 100K commands hoặc tự host Redis.

---

## Cleanup

KV ở Vercel Hobby dùng free indefinitely. Nếu muốn xoá:
- Storage tab → namespace → ⋮ → Delete
- Confirm typing namespace name
- Tất cả keys mất ngay, không recoverable
