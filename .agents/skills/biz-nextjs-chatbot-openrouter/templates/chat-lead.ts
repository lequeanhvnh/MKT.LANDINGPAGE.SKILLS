// Auto-extract lead (tên + SĐT + email) từ conversation và lưu vào KV.
// Yêu cầu project có @upstash/redis hoặc @vercel/kv (skill detect, nếu không có sẽ skip file này).
// Dedup theo SĐT — cùng 1 SĐT chat lại sẽ update record cũ.

import { kv } from "@/lib/kv"; // <- nếu project đã có lib/kv.ts (camp pattern)
// Nếu chưa có: tạo file lib/kv.ts với `export const kv = Redis.fromEnv();`

export type ChatLead = {
  phone: string;
  email: string;
  name: string;
  interest?: string;
  source: "chatbot";
  transcript: Array<{ role: "user" | "assistant"; content: string }>;
  createdAt: number;
  updatedAt: number;
};

const CHAT_LEAD_TTL_SECONDS = 60 * 60 * 24 * 90; // 90 ngày

const PHONE_RE = /(?:\+?84|0)(?:\d[\s.-]?){8,10}\d/g;
const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/[\s.-]/g, "");
  if (digits.startsWith("+84")) return "0" + digits.slice(3);
  if (digits.startsWith("84") && digits.length === 11) return "0" + digits.slice(2);
  if (digits.startsWith("0") && digits.length === 10) return digits;
  return null;
}

function extractPhone(text: string): string | null {
  const matches = text.match(PHONE_RE);
  if (!matches) return null;
  for (const m of matches) {
    const normalized = normalizePhone(m);
    if (normalized) return normalized;
  }
  return null;
}

function extractEmail(text: string): string | null {
  const matches = text.match(EMAIL_RE);
  return matches?.[0]?.toLowerCase() ?? null;
}

// VN name heuristic — bắt các pattern "tên X" / "tôi là X" / "tên: X".
function extractName(text: string): string | null {
  const introPatterns = [
    /(?:tên|t[eê]n)\s*(?:tôi|em|anh|chị|mình|của\s+(?:tôi|em|anh|chị|mình))?\s*(?:là\s+|:\s*)?([A-ZÀ-Ỹ][\p{L}.]+(?:\s+[A-ZÀ-Ỹ][\p{L}.]+){0,4})/iu,
    /(?:tôi|em|anh|chị|mình)\s+(?:tên\s+)?là\s+([A-ZÀ-Ỹ][\p{L}.]+(?:\s+[A-ZÀ-Ỹ][\p{L}.]+){0,4})/iu,
    /(?:^|\n)\s*([A-ZÀ-Ỹ][\p{L}.]+(?:\s+[A-ZÀ-Ỹ][\p{L}.]+){1,4})\s*(?:[,-]|$|\n)/u,
  ];
  for (const re of introPatterns) {
    const m = text.match(re);
    if (m && m[1]) {
      const name = m[1].trim().replace(/\s+/g, " ");
      if (name.length >= 2 && name.length <= 50) return name;
    }
  }
  return null;
}

export type ExtractedLead = {
  phone: string;
  email: string;
  name: string;
};

export function extractLeadFromMessages(
  messages: Array<{ role: "user" | "assistant"; content: string }>,
): ExtractedLead | null {
  const userText = messages
    .filter((m) => m.role === "user")
    .map((m) => m.content)
    .join("\n");

  const phone = extractPhone(userText);
  const email = extractEmail(userText);
  const name = extractName(userText);

  if (phone && email && name) {
    return { phone, email, name };
  }
  return null;
}

export const chatLeadKey = (phone: string) => `chat-lead:${phone}`;

export async function saveChatLead(params: {
  extracted: ExtractedLead;
  interest?: string;
  transcript: Array<{ role: "user" | "assistant"; content: string }>;
}): Promise<{ saved: boolean; isNew: boolean }> {
  const key = chatLeadKey(params.extracted.phone);
  const now = Date.now();

  const existing = (await kv.get(key)) as ChatLead | null;
  const lead: ChatLead = {
    phone: params.extracted.phone,
    email: params.extracted.email,
    name: params.extracted.name,
    interest: params.interest ?? existing?.interest,
    source: "chatbot",
    transcript: params.transcript.slice(-20),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  await kv.set(key, lead, { ex: CHAT_LEAD_TTL_SECONDS });

  return { saved: true, isNew: !existing };
}
