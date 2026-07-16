# Next.js Setup — Wiring chi tiết (SMTP / nodemailer)

Next.js có 2 router (App vs Pages) → API route đặt khác chỗ, syntax handler khác. Skill detect qua sự tồn tại của folder `app/` vs `pages/`.

Dùng `nodemailer` để gửi qua bất kỳ SMTP provider nào (Gmail / Resend / SendGrid / Mailgun / Brevo / Zoho / custom hosting).

---

## App Router (Next.js 13+)

### File location
`app/api/submit/route.ts`

### Install
```bash
# Detect package manager qua lockfile
pnpm add nodemailer && pnpm add -D @types/nodemailer       # nếu pnpm-lock.yaml
# hoặc
npm install nodemailer && npm install -D @types/nodemailer # nếu package-lock.json
# hoặc
yarn add nodemailer && yarn add -D @types/nodemailer       # nếu yarn.lock
```

`@types/nodemailer` chỉ cần cho TypeScript project.

### Runtime — BẮT BUỘC Node, không Edge

```ts
// app/api/submit/route.ts
export const runtime = "nodejs";
```

`nodemailer` dùng `node:net`/`node:tls` → KHÔNG chạy được trên Edge runtime. Nếu quên dòng này và project default sang edge → deploy fail với lỗi `Module not found: net`.

### Code
Copy `templates/api-route-nextjs-app.ts` → `app/api/submit/route.ts`, sau đó thay các placeholder `{{PRODUCT_NAME}}`, `{{BRAND_NAME}}`, etc. theo context Phase 2.

### Wire form component
Form là client component → cần `"use client"` directive ở đầu file.

Copy `templates/form-binding-react.tsx` → ví dụ `components/LeadForm.tsx`.

Import trong page (server component):
```tsx
// app/page.tsx
import LeadForm from "@/components/LeadForm";

export default function Home() {
  return (
    <main>
      {/* ... hero, body sections ... */}
      <section id="cta">
        <h2>{{CTA_HEADING}}</h2>
        <LeadForm />
      </section>
    </main>
  );
}
```

---

## Pages Router (Next.js 12 và pre-app dir)

### File location
`pages/api/submit.ts`

### Code (tương tự App Router nhưng signature khác)

```ts
// pages/api/submit.ts
import type { NextApiRequest, NextApiResponse } from "next";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST!,
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === "true",
  auth: { user: process.env.SMTP_USER!, pass: process.env.SMTP_PASS! },
});

// ... (validate, formatPhoneVN, renderEmailHTML giống App Router template)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }
  // ... same logic — Promise.all 2 transporter.sendMail call
}
```

### Form binding
Form binding code (`templates/form-binding-react.tsx`) work giống nhau ở Pages Router, không cần `"use client"`.

---

## Env vars (cả 2 router giống nhau)

### Local dev: `.env.local` ở root project

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=youremail@gmail.com
SMTP_PASS=abcdefghijklmnop          # Gmail App Password (16 ký tự, không space)

MAIL_FROM="Tên Brand <hello@yourbrand.vn>"
OWNER_EMAIL=hoang.tran@prediction3d.com
LANDING_PAGE_URL=https://yourbrand.vn
```

Đổi 4 dòng `SMTP_*` đầu để swap provider — code không sửa.

### Production: Vercel dashboard

1. Vercel → Project → Settings → Environment Variables
2. Add từng key-value, scope = Production (+ Preview nếu muốn).
3. **Quan trọng**: sau khi add, phải **redeploy** (push commit hoặc Vercel UI → Deployments → "..." → Redeploy). Env vars không hot-reload.

### .gitignore

Đảm bảo `.env.local` được ignore:

```gitignore
# env files
.env*.local
.env
```

---

## Edge runtime — KHÔNG dùng được

Đã nói ở trên: `nodemailer` không tương thích Edge. Nếu cần Edge cho lý do nào đó:
- Đổi sang provider có HTTP API + SDK edge-friendly (Resend SDK, MailChannels) — nhưng đó là vendor lock-in.
- Hoặc giữ `/api/submit` ở Node runtime, route khác chạy edge.

Skill này mặc định Node runtime cho `/api/submit` — đúng best practice cho transactional email (cold start 200-500ms hoàn toàn chấp nhận được).

---

## Type safety (TypeScript)

Define type cho lead payload để IDE catch typo:

```ts
// types/lead.ts
export type LeadPayload = {
  name: string;
  phone: string;
  email: string;
  utm_source?: string;
  utm_campaign?: string;
  message?: string;
};
```

Reuse trong cả API route và form component.

---

## Server Action alternative (Next.js 14+)

Thay vì API route, có thể dùng Server Action:

```tsx
// app/actions/submit-lead.ts
"use server";

import nodemailer from "nodemailer";

export async function submitLead(formData: FormData) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST!,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user: process.env.SMTP_USER!, pass: process.env.SMTP_PASS! },
  });
  // ... validate, send 2 emails
}
```

```tsx
// LeadForm.tsx
import { submitLead } from "@/app/actions/submit-lead";

<form action={submitLead}>
  ...
</form>
```

**Tradeoff**: Server Action gọn hơn (no API route), nhưng:
- Khó test bằng curl từ ngoài.
- Khó share endpoint với app mobile/extension sau này.
- Error handling phức tạp hơn (cần `useFormState`).

**Default recommendation**: dùng API route `/api/submit` — universal, debuggable, scaleable.
