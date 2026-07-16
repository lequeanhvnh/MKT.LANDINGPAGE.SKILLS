-- =============================================================================
-- Allowlist đăng nhập trang /admin qua Google OAuth (Supabase Auth).
-- Thay __SUPER_ADMIN_EMAIL__ bằng email Google của super admin TRƯỚC KHI chạy.
-- Idempotent — chạy lại an toàn.
-- =============================================================================

-- 1. Bảng allowlist ---------------------------------------------------------
create table if not exists public.admin_users (
  email      text primary key check (email = lower(email)),
  note       text,
  created_at timestamptz not null default now()
);

comment on table public.admin_users is
  'Allowlist email đăng nhập /admin qua Google OAuth. Thêm admin = insert 1 dòng email (viết thường).';

alter table public.admin_users enable row level security;
-- Cố ý KHÔNG tạo policy nào: chỉ service_role (API server) đọc được;
-- anon/publishable key phía browser bị RLS chặn hoàn toàn.

-- 2. Seed super admin -------------------------------------------------------
insert into public.admin_users (email, note)
values ('__SUPER_ADMIN_EMAIL__', 'Super admin (chủ tài khoản)')
on conflict (email) do nothing;

-- 3. Hàm kiểm tra email có trong allowlist ----------------------------------
-- SECURITY DEFINER → chạy với quyền owner (postgres) → bỏ qua RLS,
-- nên gọi được từ API bất kể request authenticate dưới role nào.
create or replace function public.is_admin_email(p_email text)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_users
    where email = lower(p_email)
  );
$$;

grant execute on function public.is_admin_email(text) to anon, authenticated, service_role;

-- 4. Verify -----------------------------------------------------------------
select count(*) as admin_count from public.admin_users;
select public.is_admin_email('__SUPER_ADMIN_EMAIL__') as super_admin_ok;  -- phải = true
