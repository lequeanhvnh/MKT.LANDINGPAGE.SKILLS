# Deploy Next.js → Vercel

Vercel là công ty đứng sau Next.js, nên zero-config: hầu hết các app Next.js deploy thẳng không cần `vercel.json`.

## Auto-detect

Vercel tự nhận diện qua `next.config.js|.mjs|.ts` hoặc `"next"` trong `package.json` dependencies. Auto set:

- **Framework Preset**: Next.js
- **Build Command**: `next build`
- **Output Directory**: `.next` (không expose, Vercel tự handle)
- **Install Command**: detect từ lockfile (`pnpm install` / `yarn install` / `npm install`)
- **Development Command**: `next dev`

## Lần deploy đầu

```bash
cd /path/to/nextjs-app
vercel --prod --yes
```

Vercel build trên server, deploy → live URL `<project>.vercel.app`.

## Env vars

Next.js phân biệt **server-side** (chỉ access trong API routes / Server Components / `getServerSideProps`) và **client-side** (prefix `NEXT_PUBLIC_`, bundle vào client JS).

```bash
# Server-only secret (recommended)
vercel env add DATABASE_URL production
vercel env add STRIPE_SECRET_KEY production

# Public, bundle vào client
vercel env add NEXT_PUBLIC_GA_ID production
```

Pull về local để dev:

```bash
vercel env pull .env.local
```

## App Router vs Pages Router

Không cần config khác nhau cho 2 router. Vercel detect tự động qua presence của `app/` hoặc `pages/`.

## Edge runtime / ISR / SSG

Mọi feature Next.js (Edge functions, Incremental Static Regeneration, Server Actions) work out-of-the-box. Không cần `vercel.json` custom.

Tránh ép `output: 'export'` (static export) trong `next.config.js` trừ khi muốn deploy như static site — sẽ mất ISR, API routes, Server Components dynamic.

## Custom config khi cần

Chỉ cần `vercel.json` nếu muốn:

**Redirect cũ → mới:**

```json
{
  "redirects": [
    { "source": "/blog-old/:slug", "destination": "/blog/:slug", "permanent": true }
  ]
}
```

**Custom headers cho 1 path:**

```json
{
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "*" }
      ]
    }
  ]
}
```

**Crons (chạy job định kỳ):**

```json
{
  "crons": [
    { "path": "/api/cron/cleanup", "schedule": "0 0 * * *" }
  ]
}
```

## Bundle analyze (debug build size)

```bash
# Local
ANALYZE=true pnpm build
```

Cần `@next/bundle-analyzer` plugin. Hữu ích khi build trên Vercel chậm hoặc fail vì size.

## Common build failures

**"Module not found"** → check case-sensitivity: `import Header from './components/Header'` vs file thật `./Components/header.tsx`.

**"Type error"** trong production build nhưng dev OK → Next.js skip type-check trong dev. Chạy `pnpm tsc --noEmit` local trước khi deploy.

**Image domain blocked** → thêm vào `next.config.js`:

```js
module.exports = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.example.com' }
    ]
  }
}
```
