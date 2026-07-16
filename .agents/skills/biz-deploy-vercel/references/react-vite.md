# Deploy React (Vite / CRA) → Vercel

React SPA cần xử lý 2 thứ Vercel không tự lo: **client-side routing rewrite** và **build output directory**.

## Vite

### Auto-detect

Vercel detect qua `vite.config.js|.ts` → set:

- **Build Command**: `vite build`
- **Output Directory**: `dist`
- **Install Command**: từ lockfile

### vercel.json cho SPA routing

Nếu app dùng `react-router-dom` (BrowserRouter) hoặc `wouter`, mọi route phải fallback về `index.html` để JS router xử lý:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

Không có file này → reload `/dashboard` sẽ 404 vì server tìm file `dashboard.html` không tồn tại.

### Build local trước khi deploy

```bash
pnpm build         # hoặc npm run build
pnpm preview       # serve dist/ local, verify chạy ok
```

### Env vars (Vite)

Vite chỉ bundle env vars có prefix `VITE_` vào client:

```bash
vercel env add VITE_API_URL production
vercel env add VITE_STRIPE_PUBLIC_KEY production
```

Pull về local:

```bash
vercel env pull .env.local
```

Access trong code: `import.meta.env.VITE_API_URL`.

### Deploy

```bash
vercel --prod --yes
```

---

## Create React App (CRA)

### Auto-detect

Vercel detect qua `"react-scripts"` trong `package.json`:

- **Build Command**: `react-scripts build`
- **Output Directory**: `build`

### vercel.json cho SPA routing

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Env vars (CRA)

CRA prefix `REACT_APP_`:

```bash
vercel env add REACT_APP_API_URL production
```

Access: `process.env.REACT_APP_API_URL`.

### Lưu ý: CRA đã sunset

Facebook/Meta đã ngừng support CRA năm 2023. Nếu user đang start project mới → khuyên dùng Vite hoặc Next.js. Nếu đang maintain legacy CRA → vẫn deploy được bình thường.

---

## Vite + framework khác (Vue, Svelte, Solid)

Cùng template `vercel.json` rewrite về `index.html`. Build command vẫn `vite build`, output `dist`.

---

## Common pitfalls

**Asset path tuyệt đối hardcode** (`<img src="/Users/me/project/img.png">`) → fail trên Vercel. Dùng `import` hoặc relative path từ `public/`.

**`process.env.X` undefined trong Vite** → Vite không expose `process.env`, dùng `import.meta.env.VITE_X` thay thế.

**React Router không match route** sau deploy → thiếu rewrite trong `vercel.json`.

**Build OK nhưng white screen** → thường do base path. Trong `vite.config.ts`:

```ts
export default defineConfig({
  base: '/',   // không phải './' hay '/subpath/' trừ khi serve sub-path
});
```

**CRA build OOM** → thêm vào build command: `NODE_OPTIONS=--max-old-space-size=4096 react-scripts build`.
