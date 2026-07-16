// lib/telegram.js — vanilla JS variant (Next.js JS hoặc Vite/static project)
//
// Same shape as lib-telegram.ts. Xem comment ở bản TypeScript cho rationale chi tiết.

/**
 * @typedef {Object} TelegramPaymentPayload
 * @property {string} name
 * @property {string} phone
 * @property {string} email
 * @property {number} amount  - VND raw (vd: 499000)
 * @property {string} productName
 * @property {string} [referenceCode]
 */

/**
 * @param {TelegramPaymentPayload} payload
 * @returns {Promise<void>}
 */
export async function sendTelegramNotification(payload) {
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

function formatMessage(p) {
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

function formatPhoneVN(raw) {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) {
    return digits.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3');
  }
  return raw;
}

function escapeHtml(s) {
  return s.replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));
}
