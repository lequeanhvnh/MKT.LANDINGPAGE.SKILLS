# Vercel Deploy — Troubleshooting

Bảng tra lỗi nhanh khi deploy gặp vấn đề.

## Lấy log

```bash
# Log của deployment gần nhất
vercel logs

# Log của deployment cụ thể
vercel logs https://<project>-<hash>.vercel.app

# Follow real-time (cho serverless functions)
vercel logs --follow
```

Hoặc mở **Inspect URL** trong report → tab Build Logs / Function Logs.

---

## Build errors

### `Module not found: Can't resolve '...'`

- **Case-sensitivity**: `import './Header'` trên Mac OK (HFS case-insensitive default), Linux fail. Fix: rename file/folder theo đúng case dùng trong import.
- **Path alias không resolve**: check `tsconfig.json` `paths`, `vite.config.ts` alias, hoặc `next.config.js` webpack config.
- **Dep trong `devDependencies` nhưng cần lúc build runtime**: move sang `dependencies`.

### `Out of memory` / `JavaScript heap out of memory`

Build command thêm:

```bash
NODE_OPTIONS=--max-old-space-size=4096 <original-build-command>
```

Set trong `package.json` script hoặc Vercel project settings → Build Command override.

### `Command "npm install" exited with 1`

- Conflict lockfile vs `package.json` → xóa lockfile + `node_modules` local, install lại, commit lockfile mới.
- Wrong package manager (project dùng pnpm nhưng Vercel default npm). Set Install Command: `pnpm install --frozen-lockfile` trong project settings.

### `Type error: ...` (Next.js)

Local dev không type-check, Vercel build có. Run local:

```bash
pnpm tsc --noEmit
```

Fix type errors hoặc tạm thời thêm `next.config.js`:

```js
module.exports = {
  typescript: { ignoreBuildErrors: true }   // chỉ làm khi cần ship gấp, sau đó fix
};
```

### Build timeout (> 45 phút free / > 120 phút pro)

- Tách monorepo: chỉ deploy 1 package, không build cả workspace.
- Bật Turbopack (Next.js) hoặc swc compiler.
- Cache dependencies — Vercel làm tự động qua lockfile, đảm bảo lockfile committed.

---

## Runtime errors (sau khi deploy xong)

### `404 Not Found` cho route SPA (React/Vite/CRA)

Thiếu rewrite rule. Thêm `vercel.json`:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### `404` cho `index.html` ở root

Thiếu file `index.html` trong root, hoặc tên file sai (`Index.html`, `home.html`). Đổi về đúng `index.html`.

### Images không load

- Path tuyệt đối local (`<img src="C:\...\img.png">`) → đổi relative.
- Case mismatch: `<img src="Hero.jpg">` nhưng file thật là `hero.jpg` (Linux case-sensitive).
- File ngoài thư mục build output → move vào `public/` (Next.js, Vite) hoặc đặt cùng level với HTML (static).

### `Mixed content` / `Not Secure`

Có resource HTTP nhúng vào page HTTPS. Search code:

```bash
grep -r 'http://' --include='*.html' --include='*.tsx' --include='*.jsx' .
```

Đổi sang HTTPS hoặc remove.

### CORS error khi gọi API

- API server chưa allow Vercel domain. Set `Access-Control-Allow-Origin: https://<project>.vercel.app`.
- Hoặc dùng Vercel rewrite proxy: 

```json
{
  "rewrites": [
    { "source": "/api/proxy/:path*", "destination": "https://api.external.com/:path*" }
  ]
}
```

### Env vars undefined ở runtime

- Forgot prefix: Vite cần `VITE_`, CRA cần `REACT_APP_`, Next.js client cần `NEXT_PUBLIC_`.
- Set ở wrong environment: `vercel env add KEY production` ≠ preview. Add cho cả 3 env nếu cần.
- Redeploy sau khi add env (env mới không apply vào deployment cũ).

---

## Project / linking issues

### "Project not found" hoặc deploy đến nhầm project

```bash
rm -rf .vercel
vercel link              # link lại
vercel --prod
```

### Deploy vào nhầm Vercel team

`vercel switch` để đổi scope, hoặc `rm -rf .vercel` + `vercel link --scope <team>`.

### Forgot to logout previous account

```bash
vercel logout
vercel login
```

---

## CLI / installation issues

### `vercel: command not found` sau khi `npm install -g vercel`

PATH chưa include npm global bin:

```bash
# macOS/Linux
echo $(npm config get prefix)/bin
# Add vào ~/.zshrc hoặc ~/.bashrc:
export PATH="$(npm config get prefix)/bin:$PATH"
```

Nếu dùng pnpm:

```bash
pnpm setup
# Restart terminal
```

### `EACCES: permission denied` khi `npm install -g`

Tránh `sudo npm install -g`. Dùng nvm để manage Node, hoặc đổi npm prefix về home directory:

```bash
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
export PATH=~/.npm-global/bin:$PATH
```

Add export vào shell rc file.

---

## Auth

### `vercel whoami` → "Error: Not authorized"

Token expired hoặc never logged in:

```bash
vercel login
```

→ Mở browser, click confirm.

### Login không mở browser

Force mode CLI:

```bash
vercel login --github   # hoặc --gitlab --bitbucket --email
```

Hoặc dùng token thủ công: https://vercel.com/account/tokens → set env:

```bash
export VERCEL_TOKEN=<token>
vercel --prod --token $VERCEL_TOKEN
```

---

## Khi không biết nguyên nhân

1. Mở **Inspect URL** từ output deploy → đọc Build Logs từng step
2. Reproduce build local:
   ```bash
   pnpm install
   pnpm build
   ```
3. Check Vercel status: https://www.vercel-status.com
4. Search lỗi cụ thể trên https://github.com/vercel/vercel/discussions

## Reference

- Errors database: https://vercel.com/docs/errors
- CLI docs: https://vercel.com/docs/cli
- Build config: https://vercel.com/docs/projects/project-configuration
