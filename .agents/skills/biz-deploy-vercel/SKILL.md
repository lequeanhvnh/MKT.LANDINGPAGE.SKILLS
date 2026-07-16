---
name: biz-deploy-vercel
description: "Deploy landing page / website (React, Next.js, Vite, static HTML) lên Vercel — tự kiểm tra Vercel CLI hoặc Vercel MCP đã cài chưa, nếu chưa thì cài qua npm/pnpm và hướng dẫn user authenticate (vercel login), tự detect framework (Next.js / Vite / CRA / static), auto-generate vercel.json khi cần, chạy `vercel --prod`, trả về live URL + inspect URL + hướng dẫn custom domain. USE WHEN user says 'deploy lên vercel', 'đẩy landing page lên vercel', 'publish website', 'go live', 'deploy nextjs', 'deploy react', 'deploy vite', 'tạo URL live', 'đưa lên production', 'biz-deploy-vercel', 'host landing page', 'vercel deploy', 'ship lên vercel', 'đẩy code lên vercel'. Skill này áp dụng cho cả case dùng Vercel CLI lẫn Vercel MCP server."
framework: "Vercel CLI v51+ / Vercel MCP — auto-detect React, Next.js, Vite, static HTML — preflight → deploy → verify"
source: "Vercel CLI docs (https://vercel.com/docs/cli) + biz-deploy reference (/Users/tonyhoang/Documents/AI Agent Business Kit/.Codex/commands/biz-deploy.md)"
---

# Biz Deploy Vercel — Đẩy website lên Vercel an toàn, 1 lệnh

Skill này biến **1 thư mục dự án local** (React / Next.js / Vite / static HTML) thành **1 URL live trên Vercel** với SSL, CDN, preview deployment. Mục tiêu: solopreneur / SME không cần biết DevOps vẫn deploy được landing page chỉ qua hội thoại với Codex.

> **Tinh thần**: Không hỏi user những thứ Codex có thể tự kiểm tra. Tự detect framework, tự sinh `vercel.json` khi cần, chỉ dừng lại khi gặp **manual gate** thật sự (login browser, custom domain DNS).

## Khi nào dùng

User muốn:
- Đẩy 1 landing page / website lên live URL để share / test / chạy ads
- Deploy lại dự án sau khi sửa code
- Lần đầu setup Vercel cho 1 repo mới
- Setup custom domain trỏ về Vercel

## Khi nào KHÔNG dùng

- Chỉ cần build local, chưa muốn public → skip, dùng `npm run build` / `next dev`.
- Cần deploy lên Netlify / Cloudflare Pages / AWS → skill này chuyên về Vercel.
- Cần CI/CD phức tạp với GitHub Actions custom → vẫn dùng skill này để khởi tạo project, nhưng phần workflow custom user tự cấu hình.
- Cần backend Node.js full server stateful (websocket, long polling) → Vercel serverless không phù hợp, dùng Railway / Fly.io.

## Output user sẽ nhận

1. **Live URL** dạng `https://<project>.vercel.app` (production) hoặc preview URL.
2. **Inspect URL** dạng `https://vercel.com/<account>/<project>/<deployment-id>` để xem logs.
3. **Project linked** trong `.vercel/project.json` (gitignored) — lần deploy sau chỉ cần `vercel --prod`.
4. Nếu user yêu cầu custom domain → DNS instructions cụ thể (A record / CNAME).

---

## Workflow 6 bước

### Bước 1 — Preflight: Kiểm tra Vercel CLI / MCP

Chạy `scripts/check_vercel.sh` (hoặc inline các lệnh tương đương) để xác định trạng thái 3 thứ:

| Thứ cần check | Lệnh | Kết quả mong đợi |
|---|---|---|
| Node.js | `node --version` | v18+ hoặc v20+ |
| Vercel CLI | `vercel --version` | Có version trả về (v32+) |
| Vercel auth | `vercel whoami` | Trả về username |

**Nếu thiếu Node.js:**
- macOS: gợi ý `brew install node` hoặc download https://nodejs.org
- Windows: hướng dẫn download installer .msi từ https://nodejs.org/en/download/
- Linux: `nvm install --lts` hoặc package manager.
- **Dừng skill**, đợi user cài xong báo lại.

**Nếu thiếu Vercel CLI:**
- Phát hiện package manager đang dùng (kiểm tra `pnpm`, `yarn`, `npm` theo thứ tự ưu tiên hoặc đọc lockfile của project).
- Cài global:
  - `pnpm add -g vercel` (nếu user dùng pnpm)
  - `npm install -g vercel` (mặc định)
- Verify lại bằng `vercel --version`.

**Nếu có Vercel CLI nhưng chưa auth (`vercel whoami` báo error):**
- Chạy `vercel login` — **lệnh này mở browser**, user phải click confirm. Đây là **manual gate**, không skip được.
- Báo user: *"Mình đã chạy `vercel login`. Mở browser, click confirm để authenticate. Khi xong, gõ 'ok' để mình tiếp tục."*
- **Dừng**, đợi user phản hồi.

**Nếu user nói có Vercel MCP:**
- Kiểm tra MCP server bằng cách list MCP tools available (tool nào prefix `mcp__vercel__*`).
- Nếu có MCP, vẫn ưu tiên CLI cho deploy actual (CLI ổn định hơn cho file upload), dùng MCP để query project / domain / env vars sau khi deploy nếu cần.
- Nếu user **bắt buộc dùng MCP**: theo doc https://vercel.com/docs/mcp để authenticate, sau đó dùng các MCP tool tương ứng.

### Bước 2 — Detect framework + project structure

Đọc các file trong project root để xác định framework:

| File | Framework |
|---|---|
| `next.config.js` / `next.config.mjs` / `next.config.ts` | **Next.js** |
| `vite.config.js` / `vite.config.ts` | **Vite** (React/Vue/Svelte) |
| `package.json` có `"react-scripts"` | **Create React App** |
| `package.json` có `"astro"` | **Astro** |
| `package.json` có `"@remix-run/dev"` | **Remix** |
| Chỉ có `index.html` + assets, không `package.json` | **Static HTML** |
| Có `package.json` nhưng không match patterns trên | Hỏi user framework gì, hoặc để Vercel auto-detect |

Ghi nhận thêm:
- Build command từ `package.json` (`scripts.build`)
- Output directory (Next: `.next`, Vite: `dist`, CRA: `build`, static: `.`)
- Node version yêu cầu (từ `engines.node` hoặc `.nvmrc`)

→ Đọc reference tương ứng:
- React/Vite → `references/react-vite.md`
- Next.js → `references/nextjs.md`
- Static HTML → `references/static-html.md`

### Bước 3 — Sinh `vercel.json` (nếu cần)

**Next.js**: Vercel auto-detect hoàn toàn, **không cần** `vercel.json` trừ khi muốn custom headers / redirects.

**Vite / CRA (SPA routing)**: Cần `vercel.json` rewrite all routes về `index.html` để client-side routing hoạt động:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

**Static HTML**: Thường không cần. Nếu site có nhiều page (`thank-you.html`, `privacy.html`) thì không cần rewrite. Nếu chỉ có `index.html` + JS router thì cần rewrite như SPA.

**Security headers (recommended cho production):**

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    }
  ]
}
```

**Quy tắc**: Chỉ tạo `vercel.json` nếu user thật sự cần. Tạo file không cần thiết = noise trong repo.

### Bước 4 — Pre-deploy checklist

Trước khi chạy `vercel`, verify:

- [ ] Có `.gitignore` chứa `.vercel/`, `node_modules/`, `.env*` (KHÔNG được commit secrets)
- [ ] File paths trong code đều **lowercase + relative** (Linux case-sensitive)
- [ ] Không có hardcoded `localhost` URL
- [ ] External script/stylesheet đều `https://`
- [ ] Nếu Next.js có env vars → đã chuẩn bị danh sách env cần set
- [ ] Nếu có `package.json` → `npm install` (hoặc tương đương) chạy được local

Nếu phát hiện vấn đề rõ ràng (vd: hardcoded localhost trong HTML), **fix trước** rồi mới deploy.

### Bước 5 — Deploy

**Lần đầu deploy 1 project (chưa có `.vercel/project.json`):**

```bash
vercel --prod --yes
```

Cờ `--yes` chấp nhận tất cả default settings từ framework auto-detection. Vercel sẽ:
- Hỏi scope (tự pick user's account khi có `--yes`)
- Detect framework preset
- Set build command + output dir
- Push code, build, deploy

**Nếu cần custom project name** hoặc user muốn linked đến project có sẵn:

```bash
vercel link              # Link vào project có sẵn (interactive)
vercel --prod            # Deploy sau khi link
```

**Deploy preview (non-production):**

```bash
vercel
```

→ Trả về URL preview kiểu `https://<project>-<hash>.vercel.app`, dùng để test trước khi promote production.

**Deploy lại (project đã linked):**

```bash
vercel --prod
```

**Capture output** — parse stdout để lấy:
- `Production: https://<project>.vercel.app`
- `Inspect: https://vercel.com/...`

Báo user 2 URL này ngay.

### Bước 6 — Verify + report

Sau khi deploy thành công:

1. **HTTP check** live URL bằng `curl -I https://<project>.vercel.app` — verify status 200 + SSL active.
2. **Báo cáo cho user** theo format:

```markdown
## ✅ Deploy thành công

**Live URL**: https://<project>.vercel.app
**Inspect / Logs**: https://vercel.com/<account>/<project>/<deployment-id>
**Framework**: <Next.js | Vite | CRA | Static HTML>
**Build time**: <Xs>

### Lần deploy tiếp theo
Chỉ cần chạy: `vercel --prod`

### Tùy chọn
- Setup custom domain → bảo mình `setup domain <yourdomain.com>`
- Setup env vars → bảo mình `add env <KEY>`
- Xem logs → `vercel logs`
```

3. Nếu user yêu cầu custom domain → đọc `references/domains.md` và hướng dẫn DNS.

---

## Edge cases + recovery

### Build fail trên Vercel nhưng local ổn

Nguyên nhân thường gặp:
- **Case-sensitivity**: `import './Components/Header'` chạy local Mac nhưng fail Linux nếu thư mục thật là `components`. Fix: rename theo đúng case.
- **Missing dep**: package có trong `devDependencies` nhưng cần ở runtime → move sang `dependencies`.
- **Node version mismatch**: thêm `"engines": { "node": "20.x" }` vào `package.json` hoặc `.nvmrc`.

→ Lấy log bằng `vercel logs <deployment-url>`, đọc, fix, redeploy.

### Project đã link nhầm account / project

`rm -rf .vercel/` rồi chạy lại `vercel --prod --yes`. Hoặc dùng `vercel link` để chọn project đúng.

### Env vars production

```bash
vercel env add <KEY> production
# Paste value khi prompt
vercel env pull .env.production.local   # Pull về local nếu cần
```

Tránh commit `.env*` files. Thêm vào `.gitignore` nếu chưa có.

### Auth expire

Token CLI có thể expire. Nếu `vercel whoami` báo unauthorized → chạy lại `vercel login`.

---

## Tham khảo chi tiết theo framework

Đọc reference khớp với framework của project:

| Framework | Reference |
|---|---|
| Next.js (App / Pages router) | `references/nextjs.md` |
| React (Vite / CRA) | `references/react-vite.md` |
| Static HTML | `references/static-html.md` |
| Custom domain + DNS | `references/domains.md` |
| Lỗi & troubleshooting | `references/troubleshooting.md` |

## Tham khảo gốc

- Vercel CLI docs: https://vercel.com/docs/cli
- Vercel build config: https://vercel.com/docs/projects/project-configuration
- Vercel limits (free tier): https://vercel.com/docs/limits
- Status page: https://www.vercel-status.com
