"use client";

// lib/admin-client.ts
//
// Phía browser — đăng nhập trang /admin bằng Google (Supabase Auth).
// Phiên đăng nhập lưu ở localStorage, tự refresh token. Mọi lệnh gọi API
// /admin đi qua adminFetch() để đính kèm Bearer token cho server verify.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    "Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc NEXT_PUBLIC_SUPABASE_ANON_KEY trong .env.local",
  );
}

// Publishable/anon key — an toàn để lộ ra browser.
export const supabaseBrowser: SupabaseClient = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true, // tự đổi ?code= sau khi Google redirect về
    flowType: "pkce",
  },
});

/** Mở luồng đăng nhập Google. Sau khi xong, Google redirect về /admin. */
export async function loginWithGoogle(): Promise<void> {
  const { error } = await supabaseBrowser.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/admin`,
      queryParams: { prompt: "select_account" },
    },
  });
  if (error) throw error;
}

/** Đăng xuất phiên Google hiện tại. */
export async function logout(): Promise<void> {
  await supabaseBrowser.auth.signOut();
}

/**
 * fetch() tới API /admin kèm Bearer token của phiên Google hiện tại.
 * Server (requireAdmin) verify token + đối chiếu allowlist admin_users.
 */
export async function adminFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const { data } = await supabaseBrowser.auth.getSession();
  const token = data.session?.access_token;
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(path, { ...init, headers, cache: init.cache ?? "no-store" });
}
