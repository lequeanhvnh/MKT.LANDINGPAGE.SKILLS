# Custom Domain Setup trên Vercel

Vercel cấp SSL miễn phí (Let's Encrypt) cho mọi custom domain, tự renew.

## Workflow tổng quan

```
1. Mua domain (Namecheap, GoDaddy, Porkbun, Cloudflare Registrar...)
2. Add domain vào Vercel project
3. Update DNS records ở registrar
4. Đợi propagation (5 phút – 48h)
5. SSL tự issue khi DNS đã trỏ đúng
```

## Add domain vào project

**Qua CLI:**

```bash
vercel domains add example.com
vercel domains add www.example.com
```

Hoặc gán vào project cụ thể:

```bash
vercel alias <deployment-url> example.com
```

**Qua dashboard:**

1. https://vercel.com/dashboard → chọn project
2. Settings → Domains
3. Enter domain → Add

Vercel sẽ show **DNS records cụ thể** user phải set ở registrar.

## DNS records

### Apex domain (`example.com`, không có www)

Tại registrar, set **A record**:

| Type | Name | Value | TTL |
|---|---|---|---|
| A | @ | `76.76.21.21` | 3600 |

### Subdomain (`www.example.com`, hoặc `app.example.com`)

Set **CNAME**:

| Type | Name | Value | TTL |
|---|---|---|---|
| CNAME | www | `cname.vercel-dns.com` | 3600 |

### Best practice: set CẢ HAI

Cover cả người gõ `example.com` và `www.example.com`:

```
A      @     76.76.21.21
CNAME  www   cname.vercel-dns.com
```

Trong Vercel dashboard, chọn 1 cái làm primary (thường `example.com`), cái còn lại auto-redirect.

## Verify

```bash
# Check DNS propagation
dig example.com +short
dig www.example.com +short

# Hoặc dùng https://dnschecker.org
```

Khi DNS đã trỏ đúng:

```bash
curl -I https://example.com
# Expect: HTTP/2 200 + valid SSL
```

## Thời gian propagation

| Stage | Time |
|---|---|
| Minimum | 5 phút |
| Average | 1–4 giờ |
| Maximum | 24–48 giờ |
| SSL issue (sau khi DNS xong) | 5 phút – 1 giờ |

## Common issues

**"Invalid Configuration" trong Vercel dashboard**
→ DNS chưa propagate, hoặc record value sai. Verify lại bằng `dig`.

**SSL pending mãi không cấp**
→ DNS phải trỏ đúng trước. Vercel mới request cert được.

**Site load nhưng "Not Secure" cảnh báo**
→ Có resource HTTP nhúng vào page HTTPS (mixed content). Check `<img src="http://...">` hoặc external scripts.

**Domain ở Cloudflare**
→ TẮT proxy (cloud icon thành xám) khi setup ban đầu. Sau khi SSL active mới bật lại nếu cần. Hoặc dùng Cloudflare Pages thay cho Vercel.

**Apex domain registrar không cho A record IP**
→ Một số registrar (Cloudflare, một số EU registrar) support ALIAS/ANAME thay A. Dùng `ALIAS @ cname.vercel-dns.com` nếu có. Nếu không có, đổi sang registrar khác hoặc dùng subdomain primary.

## Remove domain

```bash
vercel domains rm example.com
```

Hoặc trong dashboard: Settings → Domains → Remove.

## Reference

- Official: https://vercel.com/docs/projects/domains
- DNS troubleshooting: https://vercel.com/docs/projects/domains/troubleshooting
