// pages/api/checkout.ts — Next.js Pages Router variant
// Same logic as App Router. Xem comment ở `api-checkout-app-router.ts`.

import type { NextApiRequest, NextApiResponse } from 'next';
import { createLead } from '@/lib/leads-store';
import { generateVietQRUrl } from '@/lib/sepay';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, phone, email, productName, amount } = req.body ?? {};

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return res.status(400).json({ error: 'Tên không hợp lệ' });
  }
  if (!phone || !/^0\d{9}$/.test(phone)) {
    return res.status(400).json({ error: 'SĐT phải là 10 số bắt đầu bằng 0' });
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Email không hợp lệ' });
  }
  if (!productName || typeof productName !== 'string') {
    return res.status(400).json({ error: 'Sản phẩm không hợp lệ' });
  }
  if (!Number.isInteger(amount) || amount <= 0) {
    return res.status(400).json({ error: 'Số tiền không hợp lệ' });
  }

  const { orderId, lead } = await createLead({
    name: name.trim(),
    phone,
    email: email.toLowerCase().trim(),
    productName,
    amount,
  });

  const bank = process.env.SEPAY_BANK_NAME!;
  const accountNumber = process.env.SEPAY_BANK_ACCOUNT_NUMBER!;
  const qrUrl = generateVietQRUrl({
    accountNumber,
    bank,
    amount,
    content: orderId,
    template: 'compact',
  });

  return res.status(200).json({
    orderId,
    amount,
    productName: lead.productName,
    bankInfo: { bank, accountNumber, accountName: process.env.SEPAY_ACCOUNT_NAME },
    content: orderId,
    qrUrl,
  });
}
