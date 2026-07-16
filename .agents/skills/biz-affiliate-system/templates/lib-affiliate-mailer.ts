// lib/affiliate-mailer.ts
//
// Email GIAO DỊCH cho đối tác affiliate — 3 loại:
//   1. sendAffiliateWelcomeEmail        — vừa đăng ký /aff-register (kèm mã + link)
//   2. sendAffiliateCommissionEarnedEmail — có đơn paid qua link aff (hoa hồng pending)
//   3. sendAffiliatePayoutEmail         — admin đánh dấu hoa hồng "đã trả"
//
// Module SELF-CONTAINED: tự tạo nodemailer transporter từ env SMTP_* (cùng bộ
// env của /biz-email-setup). KHÔNG import lib/mailer.ts để tránh coupling — chỉ
// dùng chung dependency `nodemailer` (đã có nếu đã chạy /biz-email-setup).
//
// GATED: thiếu SMTP env → log warn + return, KHÔNG throw (không được làm fail
// luồng đăng ký / webhook / duyệt hoa hồng). Bọc mọi lời gọi trong try/catch ở
// nơi gọi cho chắc.
//
// ⚠️ Nếu project ĐÃ có các hàm này trong lib/mailer.ts (vd project tham chiếu
//    ai-agent-camp), KHÔNG tạo file này — import thẳng từ mailer.ts.

import nodemailer, { type Transporter } from "nodemailer";

// === Brand — THAY 2 placeholder dưới đây ===
const BRAND_NAME = "__BRAND_NAME__"; // vd: "The AI First"
const BRAND_SIGNATURE = "__BRAND_SIGNATURE__"; // vd: "Hoàng Trần — The AI First"

const MAIL_FROM = process.env.MAIL_FROM || process.env.SMTP_USER || "";
const LANDING_PAGE_URL = (process.env.LANDING_PAGE_URL || "").replace(/\/$/, "");

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: process.env.SMTP_SECURE === "true",
      auth: { user, pass },
    });
  }
  return transporter;
}

function formatVND(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "0đ";
  return n.toLocaleString("vi-VN") + "đ";
}

const FONT =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

/** Khung email chung (header trắng + footer) — nhận phần thân HTML. */
function shell(bodyHtml: string, footerNote: string): string {
  return `<!DOCTYPE html>
<html lang="vi"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f5f5f7;font-family:${FONT};color:#1a1a1a;">
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f5f5f7;"><tr><td align="center" style="padding:32px 16px;">
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:560px;background:#fff;border-radius:12px;overflow:hidden;">
<tr><td style="padding:32px 24px;">
${bodyHtml}
<p style="margin:24px 0 0;font-size:14px;">Cảm ơn anh/chị đã đồng hành 🙌</p>
<p style="margin:4px 0 0;font-size:13px;color:#6b7280;">— ${BRAND_SIGNATURE}</p>
</td></tr></table>
<p style="margin:16px 0 0;font-size:11px;color:#999;text-align:center;max-width:560px;">${footerNote}</p>
</td></tr></table>
</body></html>`;
}

async function send(to: string, subject: string, html: string, tag: string) {
  const t = getTransporter();
  if (!t) {
    console.warn(`[aff-mailer] thiếu SMTP env, bỏ qua ${tag} → ${to}`);
    return;
  }
  try {
    await t.sendMail({ from: MAIL_FROM, to, replyTo: MAIL_FROM, subject, html });
    console.log(`[aff-mailer] ${tag} sent → ${to}`);
  } catch (err) {
    console.error(`[aff-mailer] ${tag} fail → ${to}`, err);
  }
}

// ===========================================================================
// 1. Welcome — vừa đăng ký làm đối tác
// ===========================================================================

export type AffiliateWelcomeEmail = {
  name: string;
  email: string;
  affCode: string;
  commissionRate: number;
};

export async function sendAffiliateWelcomeEmail(
  info: AffiliateWelcomeEmail,
): Promise<void> {
  const refLink = LANDING_PAGE_URL
    ? `${LANDING_PAGE_URL}/?aff=${info.affCode}`
    : `…/?aff=${info.affCode}`;
  const portalUrl = `${LANDING_PAGE_URL}/affiliate`;

  const body = `
<p style="margin:0 0 12px;font-size:16px;line-height:1.5;">Chào anh/chị <strong>${info.name}</strong>,</p>
<p style="margin:0 0 20px;font-size:16px;line-height:1.5;">
🎉 Anh/chị đã trở thành <strong>Đối tác giới thiệu</strong> của ${BRAND_NAME} — hoa hồng <strong>${info.commissionRate}%</strong> trên mỗi đơn thành công.
</p>

<div style="background:#0f172a;border-radius:10px;padding:18px;margin:0 0 16px;text-align:center;">
  <p style="margin:0 0 6px;font-size:12px;color:#94a3b8;font-weight:700;letter-spacing:0.6px;">MÃ ĐỐI TÁC CỦA ANH/CHỊ</p>
  <p style="margin:0;font-size:28px;font-weight:800;letter-spacing:3px;color:#fff;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;">${info.affCode}</p>
</div>

<div style="background:#eef2ff;border:1px solid #c7d2fe;border-radius:10px;padding:14px 16px;margin:0 0 20px;">
  <p style="margin:0 0 6px;font-size:13px;color:#4338ca;font-weight:700;">LINK GIỚI THIỆU — CHIA SẺ LINK NÀY</p>
  <p style="margin:0;font-size:13px;word-break:break-all;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;color:#1e293b;">${refLink}</p>
</div>

<p style="margin:0 0 8px;font-size:14px;font-weight:700;">CÁCH HOẠT ĐỘNG</p>
<ol style="margin:0 0 20px;padding-left:18px;font-size:14px;color:#374151;line-height:1.7;">
  <li>Chia sẻ link giới thiệu lên Zalo, Facebook, hội nhóm.</li>
  <li>Khách bấm link rồi đăng ký + thanh toán trong <strong>30 ngày</strong> → tính hoa hồng cho anh/chị.</li>
  <li>Theo dõi click, đơn, hoa hồng tại cổng đối tác (đăng nhập bằng chính email này).</li>
</ol>

<div style="text-align:center;margin:0 0 8px;">
  <a href="${portalUrl}" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 28px;border-radius:8px;">▶ VÀO CỔNG ĐỐI TÁC</a>
</div>`;

  await send(
    info.email,
    `🎉 Chào mừng đối tác mới — mã của anh/chị: ${info.affCode}`,
    shell(body, `Anh/chị nhận email này vì vừa đăng ký làm đối tác của ${BRAND_NAME}.`),
    "welcome",
  );
}

// ===========================================================================
// 2. Commission earned — có đơn paid qua link aff (hoa hồng pending)
// ===========================================================================

export type AffiliateCommissionEarnedEmail = {
  affiliateName: string;
  affiliateEmail: string;
  affCode: string;
  customerName: string;
  ticket: string;
  orderAmount: number;
  commissionRate: number;
  commissionAmount: number;
  orderId: string;
};

export async function sendAffiliateCommissionEarnedEmail(
  info: AffiliateCommissionEarnedEmail,
): Promise<void> {
  const portalUrl = `${LANDING_PAGE_URL}/affiliate`;
  const body = `
<p style="margin:0 0 12px;font-size:16px;line-height:1.5;">Chào anh/chị <strong>${info.affiliateName}</strong>,</p>
<p style="margin:0 0 20px;font-size:16px;line-height:1.5;">
🎉 Có khách vừa thanh toán thành công qua link giới thiệu của anh/chị — hoa hồng đã được ghi vào tài khoản đối tác.
</p>

<div style="background:#f0fdf4;border:1px solid #86efac;border-radius:10px;padding:18px;margin:0 0 20px;text-align:center;">
  <p style="margin:0 0 6px;font-size:13px;color:#15803d;font-weight:700;letter-spacing:0.5px;">HOA HỒNG NHẬN ĐƯỢC</p>
  <p style="margin:0;font-size:30px;font-weight:800;color:#15803d;letter-spacing:-0.5px;">${formatVND(info.commissionAmount)}</p>
  <p style="margin:8px 0 0;font-size:12px;color:#15803d;">${info.commissionRate}% × ${formatVND(info.orderAmount)}</p>
</div>

<p style="margin:0 0 8px;font-size:14px;font-weight:700;">CHI TIẾT ĐƠN</p>
<table cellpadding="0" cellspacing="0" style="width:100%;font-size:14px;color:#1a1a1a;margin:0 0 20px;">
  <tr><td style="padding:3px 0;color:#6b7280;width:120px;">Mã đơn:</td><td style="padding:3px 0;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;"><strong>${info.orderId}</strong></td></tr>
  <tr><td style="padding:3px 0;color:#6b7280;">Khách hàng:</td><td style="padding:3px 0;">${info.customerName}</td></tr>
  <tr><td style="padding:3px 0;color:#6b7280;">Gói/Vé:</td><td style="padding:3px 0;">${info.ticket || "—"}</td></tr>
  <tr><td style="padding:3px 0;color:#6b7280;">Giá trị đơn:</td><td style="padding:3px 0;">${formatVND(info.orderAmount)}</td></tr>
</table>

<div style="background:#fff7ed;border:1px solid #fdba74;border-radius:10px;padding:14px 16px;margin:0 0 20px;">
  <p style="margin:0 0 6px;font-size:13px;color:#9a3412;font-weight:700;">TRẠNG THÁI: CHỜ DUYỆT</p>
  <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6;">Hoa hồng đang ở trạng thái <strong>pending</strong>. Ban quản trị sẽ rà soát + duyệt định kỳ, sau đó chuyển sang <strong>đã thanh toán</strong> theo lịch chi trả.</p>
</div>

<div style="text-align:center;margin:0 0 8px;">
  <a href="${portalUrl}" style="display:inline-block;background:#ea580c;color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 28px;border-radius:8px;">▶ XEM PORTAL ĐỐI TÁC</a>
</div>`;

  await send(
    info.affiliateEmail,
    `🎉 Anh/chị vừa có hoa hồng ${formatVND(info.commissionAmount)} — đơn ${info.orderId}`,
    shell(body, `Anh/chị nhận email này vì là đối tác của ${BRAND_NAME}. Đơn ${info.orderId}.`),
    "commission-earned",
  );
}

// ===========================================================================
// 3. Payout — admin đánh dấu hoa hồng "đã trả"
// ===========================================================================

export type AffiliatePayoutEmail = {
  affiliateName: string;
  affiliateEmail: string;
  orderId: string;
  commissionAmount: number;
  payoutNote?: string | null;
};

export async function sendAffiliatePayoutEmail(
  info: AffiliatePayoutEmail,
): Promise<void> {
  const portalUrl = `${LANDING_PAGE_URL}/affiliate`;
  const noteBlock = info.payoutNote
    ? `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:12px 16px;margin:0 0 20px;">
         <p style="margin:0;font-size:13px;color:#475569;line-height:1.6;"><strong>Ghi chú chi trả:</strong> ${info.payoutNote}</p>
       </div>`
    : "";
  const body = `
<p style="margin:0 0 12px;font-size:16px;line-height:1.5;">Chào anh/chị <strong>${info.affiliateName}</strong>,</p>
<p style="margin:0 0 20px;font-size:16px;line-height:1.5;">
✅ Ban quản trị đã <strong>chi trả</strong> hoa hồng cho đơn <strong>${info.orderId}</strong>. Anh/chị kiểm tra tài khoản nhận tiền giúp em nhé.
</p>

<div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:18px;margin:0 0 20px;text-align:center;">
  <p style="margin:0 0 6px;font-size:13px;color:#1d4ed8;font-weight:700;letter-spacing:0.5px;">ĐÃ CHI TRẢ</p>
  <p style="margin:0;font-size:30px;font-weight:800;color:#1d4ed8;letter-spacing:-0.5px;">${formatVND(info.commissionAmount)}</p>
</div>
${noteBlock}

<div style="text-align:center;margin:0 0 8px;">
  <a href="${portalUrl}" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 28px;border-radius:8px;">▶ XEM LỊCH SỬ HOA HỒNG</a>
</div>`;

  await send(
    info.affiliateEmail,
    `✅ Đã chi trả hoa hồng ${formatVND(info.commissionAmount)} — đơn ${info.orderId}`,
    shell(body, `Anh/chị nhận email này vì là đối tác của ${BRAND_NAME}. Đơn ${info.orderId}.`),
    "payout",
  );
}
