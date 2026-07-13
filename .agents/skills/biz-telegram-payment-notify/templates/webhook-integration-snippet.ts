// Snippet wire sendTelegramNotification VÀO existing Sepay webhook handler.
// Có 2 variant tuỳ stack: App Router vs Pages Router.
//
// Quy tắc chung:
//   - CHỈ trigger khi transferType === 'in' (incoming) — bỏ qua outgoing
//   - Dùng Promise.allSettled — Telegram fail không block 200 response
//   - Lookup lead theo content (chứa order ID khách dán vào nội dung CK) hoặc referenceCode
//   - Trả { success: true } để Sepay không retry

// =============================================================================
// VARIANT 1 — Next.js App Router  (app/api/payment-success/route.ts)
// =============================================================================

import { sendTelegramNotification } from '@/lib/telegram';
import { getLeadByOrderId, getLeadByPhone } from '@/lib/leads-kv'; // từ /biz-setup-sepay-payment
// import { sendCustomerEmail, sendOwnerEmail } from '@/lib/resend'; // nếu đã có

type SepayPayload = {
  id: string;
  gateway: string;
  transactionDate: string;
  accountNumber: string;
  code: string | null;
  content: string;
  transferType: 'in' | 'out';
  transferAmount: number;
  accumulated: number;
  subAccount: string | null;
  referenceCode: string;
  description: string;
};

export async function POST(req: Request) {
  // [Existing] Verify Sepay auth header (nếu user setup Apikey hoặc HMAC)
  const apiKey = req.headers.get('authorization');
  if (apiKey !== `Apikey ${process.env.SEPAY_API_KEY}`) {
    return Response.json({ success: false, error: 'unauthorized' }, { status: 401 });
  }

  const payload = (await req.json()) as SepayPayload;

  // Bỏ qua outgoing transfers (anh/chị chuyển TIỀN RA — không phải khách thanh toán)
  if (payload.transferType !== 'in') {
    return Response.json({ success: true });
  }

  // Lookup lead từ Vercel KV theo content (vd: "DH001 0901234567")
  // Convention: content = "DH<order_id> <phone>" — extract DH<id> trước, fallback phone
  const lead = await lookupLead(payload.content);
  if (!lead) {
    console.warn('[sepay] No lead found for content:', payload.content);
    // Vẫn trả 200 để Sepay không retry. Optional: gửi Telegram alert "raw" cho admin biết
    await sendTelegramNotification({
      name: '(không tra được)',
      phone: '(không tra được)',
      email: '(không tra được)',
      amount: payload.transferAmount,
      productName: `[RAW] ${payload.content}`,
      referenceCode: payload.referenceCode,
    });
    return Response.json({ success: true });
  }

  // Fan-out side effects parallel — Telegram fail KHÔNG block email + payment record
  await Promise.allSettled([
    // sendCustomerEmail(lead),       // uncomment nếu đã có Resend
    // sendOwnerEmail(lead),
    sendTelegramNotification({
      name: lead.name,
      phone: lead.phone,
      email: lead.email,
      amount: payload.transferAmount,
      productName: lead.productName,
      referenceCode: payload.referenceCode,
    }),
  ]);

  return Response.json({ success: true });
}

async function lookupLead(content: string) {
  // Pattern 1: "DH<digits>" — primary key
  const orderMatch = content.match(/DH\s*(\d+)/i);
  if (orderMatch) {
    const lead = await getLeadByOrderId(`DH${orderMatch[1]}`);
    if (lead) return lead;
  }
  // Pattern 2: phone "0\d{9}" — fallback
  const phoneMatch = content.match(/0\d{9}/);
  if (phoneMatch) {
    return await getLeadByPhone(phoneMatch[0]);
  }
  return null;
}

// =============================================================================
// VARIANT 2 — Next.js Pages Router  (pages/api/payment-success.ts)
// =============================================================================

/*
import type { NextApiRequest, NextApiResponse } from 'next';
import { sendTelegramNotification } from '@/lib/telegram';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false });
  }

  const apiKey = req.headers.authorization;
  if (apiKey !== `Apikey ${process.env.SEPAY_API_KEY}`) {
    return res.status(401).json({ success: false, error: 'unauthorized' });
  }

  const payload = req.body;

  if (payload.transferType !== 'in') {
    return res.status(200).json({ success: true });
  }

  const lead = await lookupLeadByTransferContent(payload.content);
  if (!lead) {
    return res.status(200).json({ success: true });
  }

  await Promise.allSettled([
    sendTelegramNotification({
      name: lead.name,
      phone: lead.phone,
      email: lead.email,
      amount: payload.transferAmount,
      productName: lead.productName,
      referenceCode: payload.referenceCode,
    }),
  ]);

  return res.status(200).json({ success: true });
}
*/
