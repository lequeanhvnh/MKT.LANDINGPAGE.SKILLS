// lib/leads-kv.ts
//
// Vercel KV (Upstash Redis) lead store cho Sepay payment flow.
// Schema:
//   lead:DH000123             → Lead JSON (TTL 7d unpaid, 90d paid)
//   phone:0901234567          → "DH000123" (secondary index, TTL khớp với lead)
//   amount:{amount}:{ts}      → "DH000123" (Strategy 3 lookup index, TTL = pending only)
//   counter:order             → atomic INCR cho order number
//   transactions:{sepay_id}   → "1" (dedup webhook, TTL 7d)
//
// Env vars cần (Vercel auto-inject khi connect KV namespace):
//   KV_REST_API_URL
//   KV_REST_API_TOKEN

import { kv } from '@vercel/kv';

const TTL_PENDING_SECONDS = 7 * 24 * 3600;   // 7 ngày
const TTL_PAID_SECONDS = 90 * 24 * 3600;     // 90 ngày
const TTL_TRANSACTION_SECONDS = 7 * 24 * 3600;
const AMOUNT_WINDOW_BUCKET_SECONDS = 60;     // 1-phút buckets cho amount index

export type LeadStatus = 'pending' | 'paid' | 'expired';

export type Lead = {
  orderId: string;          // "DH000123"
  name: string;
  phone: string;            // 10-digit VN format "0901234567"
  email: string;
  productName: string;
  amount: number;           // VND raw, vd 499000
  status: LeadStatus;
  createdAt: string;        // ISO 8601
  paidAt?: string;
  payment?: PaymentRecord;
};

export type LeadInput = Omit<Lead, 'orderId' | 'status' | 'createdAt' | 'paidAt' | 'payment'>;

export type PaymentRecord = {
  sepayId: number;          // Sepay transaction ID — INTEGER (not string)
  referenceCode: string;
  gateway: string;          // bank name vd "Vietcombank"
  amount: number;           // số tiền thực nhận (có thể >lead.amount nếu overpayment)
  transactionDate: string;
  matchMethod: 'content-orderid' | 'content-phone' | 'amount-timestamp-window';
};

// =============================================================================
// CRUD
// =============================================================================

/**
 * Tạo lead mới với order ID auto-generated. Format: DH + 6-digit zero-padded.
 */
export async function createLead(input: LeadInput): Promise<{ orderId: string; lead: Lead }> {
  const next = await kv.incr('counter:order');
  const orderId = `DH${String(next).padStart(6, '0')}`;
  const now = new Date();

  const lead: Lead = {
    orderId,
    ...input,
    status: 'pending',
    createdAt: now.toISOString(),
  };

  // Primary record
  await kv.set(`lead:${orderId}`, lead, { ex: TTL_PENDING_SECONDS });
  // Secondary index — phone lookup
  await kv.set(`phone:${input.phone}`, orderId, { ex: TTL_PENDING_SECONDS });
  // Tertiary index — amount + timestamp bucket (cho Strategy 3 fallback matching)
  // Bucket = floor(now / 60s) → all leads created trong cùng 1 phút share key
  const bucket = Math.floor(now.getTime() / (AMOUNT_WINDOW_BUCKET_SECONDS * 1000));
  await kv.sadd(`amount:${input.amount}:${bucket}`, orderId);
  await kv.expire(`amount:${input.amount}:${bucket}`, TTL_PENDING_SECONDS);

  return { orderId, lead };
}

export async function getLeadByOrderId(orderId: string): Promise<Lead | null> {
  return await kv.get<Lead>(`lead:${orderId}`);
}

export async function getLeadByPhone(phone: string): Promise<Lead | null> {
  const orderId = await kv.get<string>(`phone:${phone}`);
  if (!orderId) return null;
  return getLeadByOrderId(orderId);
}

/**
 * Strategy 3 fallback: tìm pending leads có cùng amount trong window [start, end].
 * Window thường ±30 phút quanh `transactionDate` của Sepay payload.
 *
 * Return chỉ pending leads (đã filter status). Nếu length === 1 → safe match.
 * Nếu length > 1 → ambiguous, webhook handler nên skip để tránh nhầm khách.
 */
export async function findPendingLeadByAmountAndTime(
  amount: number,
  windowStart: Date,
  windowEnd: Date,
): Promise<Lead[]> {
  const startBucket = Math.floor(windowStart.getTime() / (AMOUNT_WINDOW_BUCKET_SECONDS * 1000));
  const endBucket = Math.floor(windowEnd.getTime() / (AMOUNT_WINDOW_BUCKET_SECONDS * 1000));

  const orderIds = new Set<string>();
  for (let bucket = startBucket; bucket <= endBucket; bucket++) {
    const ids = await kv.smembers(`amount:${amount}:${bucket}`);
    for (const id of ids) orderIds.add(id);
  }

  if (orderIds.size === 0) return [];

  // Fetch full lead records, filter chỉ pending
  const leads: Lead[] = [];
  for (const orderId of orderIds) {
    const lead = await getLeadByOrderId(orderId);
    if (lead && lead.status === 'pending') leads.push(lead);
  }
  return leads;
}

/**
 * Mark lead = paid + persist payment record. Extend TTL lên 90 ngày để có audit log.
 */
export async function markLeadPaid(orderId: string, payment: PaymentRecord): Promise<Lead | null> {
  const lead = await getLeadByOrderId(orderId);
  if (!lead) return null;

  const updated: Lead = {
    ...lead,
    status: 'paid',
    paidAt: new Date().toISOString(),
    payment,
  };

  await kv.set(`lead:${orderId}`, updated, { ex: TTL_PAID_SECONDS });
  await kv.set(`phone:${lead.phone}`, orderId, { ex: TTL_PAID_SECONDS });
  // Note: amount index không cần extend — chỉ phục vụ pending lookup

  return updated;
}

// =============================================================================
// Webhook dedup
// =============================================================================

/**
 * Dedup helper: trả true nếu sepay transaction đã xử lý.
 * Sepay payload.id là number — convert sang string trong handler trước khi pass.
 */
export async function isTransactionProcessed(sepayId: string): Promise<boolean> {
  const exists = await kv.get(`transactions:${sepayId}`);
  return exists !== null;
}

export async function markTransactionProcessed(sepayId: string): Promise<void> {
  await kv.set(`transactions:${sepayId}`, 1, { ex: TTL_TRANSACTION_SECONDS });
}
