# Deploy Static HTML → Vercel

Static HTML là case đơn giản nhất: không build step, không framework. Vercel serve files thẳng từ thư mục.

## Cấu trúc project tối thiểu

```
my-landing/
├── index.html         ← REQUIRED, phải chính xác tên này (lowercase)
├── thank-you.html     ← Optional, route /thank-you
├── privacy.html       ← Optional, route /privacy
└── assets/
    ├── images/
    ├── css/
    └── js/
```

## Auto-detect

Không có `package.json` → Vercel preset = **Other / Static**:

- Build Command: none
- Output Directory: `.` (root)
- Install Command: none

## Deploy

```bash
cd /path/to/static-site
vercel --prod --yes
```

## Khi nào cần vercel.json

**Trường hợp KHÔNG cần** (mặc định đủ dùng):
- Site có nhiều file HTML, mỗi page là 1 file riêng (`/thank-you.html`, `/privacy.html`).
- User access bằng URL kèm `.html` hoặc Vercel tự strip `.html` (tự handle).

**Cần** `vercel.json` khi:

### Pretty URL (bỏ `.html`)

Mặc định Vercel cho phép cả `/thank-you` và `/thank-you.html`. Nếu muốn **force** strip `.html`:

```json
{
  "cleanUrls": true
}
```

### Trailing slash

```json
{
  "trailingSlash": false
}
```

### Custom 404

Tạo `404.html` ở root — Vercel tự dùng.

### Redirects

```json
{
  "redirects": [
    { "source": "/old", "destination": "/new", "permanent": true }
  ]
}
```

### Security headers (recommended cho production)

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" }
      ]
    }
  ]
}
```

## Form handling

Static HTML không có backend. Form options:

- **Formspree**: `<form action="https://formspree.io/f/YOUR_ID" method="POST">`
- **Web3Forms**: `<form action="https://api.web3forms.com/submit" method="POST">`
- **Vercel Serverless function**: thêm 1 file `api/submit.js` (thực ra hết "pure static") — chỉ làm khi cần custom logic.

## Asset optimization

Vercel không tự minify static HTML/CSS/JS. Nên:
- Compress images trước khi commit (TinyPNG, Squoosh)
- Minify CSS/JS local nếu cần (esbuild, terser CLI)
- Hoặc dùng CDN (Cloudinary, ImageKit) cho images

## Image rules

- File names: lowercase, hyphens, no spaces. Linux case-sensitive.
- Paths trong HTML: relative (`./assets/img/hero.jpg`), không tuyệt đối local.
- HTTPS-only external resources (mixed content sẽ fail SSL).

## Lần deploy sau

Project đã link → chỉnh code → `vercel --prod`. Không cần config lại.
