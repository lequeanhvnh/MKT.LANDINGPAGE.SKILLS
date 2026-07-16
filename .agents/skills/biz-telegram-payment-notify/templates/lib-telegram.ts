// lib/telegram.ts
//
// Helper function gửi Telegram notification từ Sepay payment webhook.
// Wire vào webhook handler — gọi trong Promise.allSettled cùng email send.
//
// Env vars cần có:
//   TELEGRAM_BOT_TOKEN — token từ @BotFather (vd: "1234567890:AAxx...")
//   TELEGRAM_CHAT_ID   — chat_id 1-1 hoặc group/channel (số, có thể âm cho group)
//
// Quy tắc thiết kế:
//   - KHÔNG throw error — Telegram fail không được làm Sepay nhận non-200 → retry → duplicate
//   - Escape HTML trong user input (tên khách có thể có ký tự đặc biệt)
//   - Format VN: amount với dấu chấm phân nghìn + "đ", phone cách 3-3-3, time HH:mm dd/mm/yyyy giờ VN

export type TelegramPaymentPayload = {
  name: string;
  phone: string;
  email: string;
  amount: number; // VND raw (vd: 499000)
  productName: string;
  referenceCode?: string;
};

export async function sendTelegramNotification(payload: TelegramPaymentPayload): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.error('[telegram] Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID env var');
    return;
  }

  const text = formatMessage(payload);

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });
    if (!res.ok) {
      const errBody = await res.text();
      console.error(`[telegram] Send failed: ${res.status} ${errBody}`);
    }
  } catch (err) {
    console.error('[telegram] Network error:', err);
  }
}

function formatMessage(p: TelegramPaymentPayload): string {
  const amountStr = p.amount.toLocaleString('vi-VN') + 'đ';
  const phoneStr = formatPhoneVN(p.phone);
  const now = new Date().toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const lines = [
    '🎉 <b>ĐƠN HÀNG MỚI</b>',
    '',
    `👤 <b>${escapeHtml(p.name)}</b>`,
    `📞 ${phoneStr}`,
    `📧 ${escapeHtml(p.email)}`,
    `💰 <b>${amountStr}</b> — ${escapeHtml(p.productName)}`,
    `🕐 ${now}`,
  ];
  if (p.referenceCode) {
    lines.push('', `🔗 Mã GD: <code>${escapeHtml(p.referenceCode)}</code>`);
  }
  return lines.join('\n');
}

function formatPhoneVN(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) {
    return digits.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3');
  }
  return raw;
}

function escapeHtml(s: string): string {
  return s.replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' })[c]!);
}
