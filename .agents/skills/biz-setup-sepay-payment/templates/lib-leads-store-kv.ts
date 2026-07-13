// lib/leads-store.ts
//
// Provider abstraction — re-export từ Vercel KV impl.
// API routes (/api/checkout, /api/sepay-webhook) import từ file này, không biết
// underlying là KV hay Postgres. Đổi provider sau = sửa 1 dòng dưới đây.

export * from './leads-kv';
