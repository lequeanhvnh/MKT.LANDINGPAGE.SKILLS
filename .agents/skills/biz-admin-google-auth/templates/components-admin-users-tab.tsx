// components/AdminUsersTab.tsx
//
// Tab "Quản trị viên" trong dashboard /admin — quản lý allowlist admin_users.
// Mọi admin xem được danh sách; CHỈ super admin (SUPER_ADMIN_EMAIL) mới
// thêm / xoá được quản trị viên. Dùng chung phiên đăng nhập Google của /admin.
// Style khớp theme dashboard 1CRM (cùng token màu / card / table / badge).

"use client";

import {
  useCallback,
  useEffect,
  useState,
  type CSSProperties,
  type FormEvent,
  type ReactNode,
} from "react";
import { adminFetch } from "@/lib/admin-client";

// =============================================================================
// Types — khớp response /api/admin/admin-users
// =============================================================================

type AdminUser = {
  email: string;
  note: string | null;
  createdAt: string;
  isSuper: boolean;
};

type ApiData = {
  admins: AdminUser[];
  superAdminEmail: string;
  isSuperAdmin: boolean;
};

// =============================================================================
// Helpers
// =============================================================================

function formatDateTime(iso: string): string {
  try {
    const d = new Date(iso);
    if (!Number.isFinite(d.getTime())) return "—";
    return d.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

const ERROR_LABEL: Record<string, string> = {
  email_exists: "Email này đã có trong danh sách quản trị viên.",
  invalid_email: "Email không hợp lệ.",
  missing_email: "Anh/chị nhập email.",
  is_super: "Không thể xoá super admin.",
  not_found: "Không tìm thấy quản trị viên này.",
  not_allowed: "Chỉ super admin mới có quyền này.",
};

function errorMessage(code: string | undefined, fallback: string): string {
  return (code && ERROR_LABEL[code]) || fallback;
}

// =============================================================================
// Main tab
// =============================================================================

export default function AdminUsersTab({
  currentEmail,
  isSuper,
}: {
  currentEmail: string;
  isSuper: boolean;
}) {
  const [data, setData] = useState<ApiData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminFetch("/api/admin/admin-users");
      if (!res.ok) throw new Error("Lỗi tải danh sách quản trị viên");
      setData((await res.json()) as ApiData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi không xác định");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function remove(email: string) {
    if (
      !window.confirm(
        `Xoá quyền quản trị của ${email}?\n\nTài khoản này sẽ không vào được trang /admin nữa.`,
      )
    )
      return;
    setRemoving(email);
    setError(null);
    setFlash(null);
    try {
      const res = await adminFetch(
        `/api/admin/admin-users?email=${encodeURIComponent(email)}`,
        { method: "DELETE" },
      );
      if (res.ok) {
        setFlash(`Đã xoá quyền quản trị của ${email}.`);
        await load();
        return;
      }
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      setError(errorMessage(j.error, "Xoá thất bại. Anh/chị thử lại."));
    } catch {
      setError("Xoá thất bại. Anh/chị thử lại.");
    } finally {
      setRemoving(null);
    }
  }

  const admins = data?.admins ?? [];

  return (
    <>
      <PageHeader
        title="Quản trị viên"
        subtitle="Danh sách tài khoản Google được phép đăng nhập trang /admin"
      >
        <button onClick={load} style={S.btnGhost} disabled={loading}>
          {loading ? "Đang tải…" : "⟳ Làm mới"}
        </button>
        {isSuper && (
          <button
            onClick={() => {
              setShowForm((v) => !v);
              setError(null);
              setFlash(null);
            }}
            style={S.btnPrimary}
          >
            {showForm ? "✕ Đóng" : "+ Thêm quản trị viên"}
          </button>
        )}
      </PageHeader>

      {error && <Banner kind="error">{error}</Banner>}
      {flash && <Banner kind="success">{flash}</Banner>}

      {!isSuper && (
        <Banner kind="info">
          Anh/chị đang đăng nhập với quyền quản trị viên thường — xem được danh
          sách nhưng <strong>không thêm/xoá được</strong>. Chỉ super admin{" "}
          <strong>{data?.superAdminEmail ?? "super admin"}</strong> mới quản lý
          được quản trị viên.
        </Banner>
      )}

      {isSuper && showForm && (
        <Card>
          <AddAdminForm
            onClose={() => setShowForm(false)}
            onSaved={async (email) => {
              setShowForm(false);
              setFlash(`Đã thêm ${email} vào danh sách quản trị viên.`);
              await load();
            }}
          />
        </Card>
      )}

      <Card title={`Quản trị viên (${admins.length})`}>
        {loading && !data ? (
          <div style={S.empty}>Đang tải…</div>
        ) : admins.length === 0 ? (
          <div style={S.empty}>Chưa có quản trị viên nào.</div>
        ) : (
          <div style={{ overflow: "auto" }}>
            <table style={S.table}>
              <thead>
                <tr>
                  {["Email", "Vai trò", "Ghi chú", "Ngày thêm", ""].map((h, i) => (
                    <th key={i} style={S.th}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {admins.map((a) => {
                  const isMe =
                    a.email.toLowerCase() === currentEmail.toLowerCase();
                  return (
                    <tr key={a.email} style={S.tr}>
                      <td style={S.td}>
                        <span style={{ fontWeight: 600 }}>{a.email}</span>
                        {isMe && <span style={S.youTag}>bạn</span>}
                      </td>
                      <td style={S.td}>
                        <span
                          style={{
                            ...S.badge,
                            ...(a.isSuper ? S.badgeSuper : S.badgeAdmin),
                          }}
                        >
                          {a.isSuper ? "Super admin" : "Quản trị viên"}
                        </span>
                      </td>
                      <td style={S.tdMuted}>{a.note || "—"}</td>
                      <td style={S.tdMuted}>{formatDateTime(a.createdAt)}</td>
                      <td style={S.td}>
                        {a.isSuper ? (
                          <span style={S.lockHint} title="Super admin không thể xoá">
                            🔒 cố định
                          </span>
                        ) : isSuper ? (
                          <button
                            style={{ ...S.smallBtn, ...S.smallBtnRed }}
                            onClick={() => remove(a.email)}
                            disabled={removing === a.email}
                          >
                            {removing === a.email ? "Đang xoá…" : "Xoá"}
                          </button>
                        ) : (
                          <span style={S.tdSubtle}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div style={S.footHint}>
        Quản trị viên đăng nhập trang <code style={S.code}>/admin</code> bằng tài
        khoản Google trùng email trong danh sách này. Email phải khớp chính xác
        tài khoản Google của họ.
      </div>
    </>
  );
}

// =============================================================================
// Add admin form
// =============================================================================

function AddAdminForm({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: (email: string) => void;
}) {
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErr("");
    const value = email.trim().toLowerCase();
    if (!value) {
      setErr("Anh/chị nhập email tài khoản Google của quản trị viên.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setErr("Email không hợp lệ.");
      return;
    }
    setBusy(true);
    try {
      const res = await adminFetch("/api/admin/admin-users", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: value, note: note.trim() || undefined }),
      });
      if (res.ok) {
        onSaved(value);
        return;
      }
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      setErr(errorMessage(j.error, "Thêm thất bại. Anh/chị thử lại."));
    } catch {
      setErr("Thêm thất bại. Anh/chị thử lại.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} style={S.formBox}>
      <div style={S.formTitle}>Thêm quản trị viên mới</div>
      <div style={S.formGrid}>
        <Field
          label="Email tài khoản Google *"
          hint="Phải trùng email Google mà người đó dùng để đăng nhập /admin"
        >
          <input
            style={S.input}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nguoimoi@gmail.com"
            autoFocus
          />
        </Field>
        <Field label="Ghi chú (tuỳ chọn)">
          <input
            style={S.input}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="vd: Trợ lý kinh doanh"
          />
        </Field>
      </div>
      {err && <div style={S.formErr}>{err}</div>}
      <div style={S.formActions}>
        <button type="button" style={S.btnGhost} onClick={onClose} disabled={busy}>
          Huỷ
        </button>
        <button type="submit" style={S.btnPrimary} disabled={busy}>
          {busy ? "Đang thêm…" : "Thêm quản trị viên"}
        </button>
      </div>
    </form>
  );
}

// =============================================================================
// Shared subcomponents — khớp dashboard /admin
// =============================================================================

function PageHeader({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: ReactNode;
}) {
  return (
    <div style={S.pageHeader}>
      <div>
        <h1 style={S.pageTitle}>{title}</h1>
        {subtitle && <div style={S.pageSub}>{subtitle}</div>}
      </div>
      <div style={S.pageActions}>{children}</div>
    </div>
  );
}

function Card({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div style={S.card}>
      {title && <div style={S.cardTitle}>{title}</div>}
      {children}
    </div>
  );
}

function Banner({
  kind,
  children,
}: {
  kind: "error" | "success" | "info";
  children: ReactNode;
}) {
  const palette =
    kind === "error"
      ? { background: "#fee2e2", color: "#991b1b", borderColor: "#fecaca" }
      : kind === "success"
        ? { background: "#dcfce7", color: "#14532d", borderColor: "#bbf7d0" }
        : { background: "#eff6ff", color: "#1e3a8a", borderColor: "#bfdbfe" };
  return <div style={{ ...S.banner, ...palette }}>{children}</div>;
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label style={S.field}>
      <span style={S.fieldLabel}>{label}</span>
      {children}
      {hint && <span style={S.fieldHint}>{hint}</span>}
    </label>
  );
}

// =============================================================================
// Styles — cùng token với dashboard /admin/page.tsx
// =============================================================================

const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, sans-serif';
const CARD_BG = "#ffffff";
const BORDER = "#e5e7eb";
const TEXT = "#111827";
const MUTED = "#6b7280";
const SUBTLE = "#9ca3af";
const PRIMARY = "#1e40af";

const S: Record<string, CSSProperties> = {
  pageHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 20,
    gap: 16,
    flexWrap: "wrap",
  },
  pageTitle: { margin: 0, fontSize: 22, fontWeight: 700, color: TEXT },
  pageSub: { fontSize: 13, color: MUTED, marginTop: 4 },
  pageActions: { display: "flex", gap: 8, alignItems: "center" },

  card: {
    background: CARD_BG,
    borderRadius: 12,
    border: `1px solid ${BORDER}`,
    padding: 18,
    marginBottom: 16,
  },
  cardTitle: { fontSize: 14, fontWeight: 700, marginBottom: 14, color: TEXT },

  btnPrimary: {
    padding: "9px 16px",
    fontSize: 13,
    fontWeight: 600,
    color: "#fff",
    background: PRIMARY,
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
  },
  btnGhost: {
    padding: "8px 14px",
    fontSize: 12.5,
    color: TEXT,
    background: "#fff",
    border: `1px solid ${BORDER}`,
    borderRadius: 8,
    cursor: "pointer",
  },
  smallBtn: {
    background: "#fff",
    border: `1px solid ${BORDER}`,
    borderRadius: 6,
    padding: "4px 12px",
    fontSize: 11.5,
    fontWeight: 600,
    cursor: "pointer",
    color: "#1d4ed8",
    whiteSpace: "nowrap",
  },
  smallBtnRed: { color: "#b91c1c", borderColor: "#fecaca" },

  table: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  tr: { borderBottom: "1px solid #f3f4f6" },
  th: {
    textAlign: "left",
    padding: "10px 12px",
    fontSize: 11.5,
    fontWeight: 600,
    color: MUTED,
    background: "#f9fafb",
    whiteSpace: "nowrap",
    borderBottom: `1px solid ${BORDER}`,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  td: { padding: "12px 12px", color: TEXT, verticalAlign: "middle" },
  tdMuted: {
    padding: "12px 12px",
    color: MUTED,
    fontSize: 12,
    verticalAlign: "middle",
  },
  tdSubtle: { fontSize: 11, color: SUBTLE },

  badge: {
    display: "inline-block",
    padding: "3px 10px",
    fontSize: 11,
    fontWeight: 700,
    borderRadius: 12,
    whiteSpace: "nowrap",
  },
  badgeSuper: { background: "#fef3c7", color: "#a16207" },
  badgeAdmin: { background: "#dbeafe", color: "#1d4ed8" },

  youTag: {
    marginLeft: 8,
    padding: "2px 7px",
    fontSize: 10,
    fontWeight: 700,
    borderRadius: 10,
    background: "#f3f4f6",
    color: MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  lockHint: { fontSize: 11.5, color: SUBTLE },

  empty: { padding: 32, textAlign: "center", color: MUTED, fontSize: 13.5 },
  banner: {
    padding: "12px 16px",
    borderRadius: 8,
    marginBottom: 14,
    fontSize: 13,
    border: "1px solid",
    fontWeight: 500,
    lineHeight: 1.55,
  },

  formBox: {
    background: "#f9fafb",
    border: `1px solid ${BORDER}`,
    borderRadius: 10,
    padding: 16,
  },
  formTitle: { fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 12 },
  formGrid: {
    display: "grid",
    gap: 12,
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  },
  formActions: { display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 12 },
  formErr: {
    background: "#fee2e2",
    color: "#991b1b",
    padding: "8px 12px",
    borderRadius: 6,
    fontSize: 12.5,
    marginTop: 10,
    fontWeight: 500,
  },

  field: { display: "flex", flexDirection: "column", gap: 6 },
  fieldLabel: { fontSize: 12, fontWeight: 600, color: TEXT },
  fieldHint: { fontSize: 11, color: SUBTLE },
  input: {
    padding: "9px 12px",
    fontSize: 13.5,
    border: `1px solid ${BORDER}`,
    borderRadius: 8,
    outline: "none",
    fontFamily: FONT,
    background: "#fff",
    width: "100%",
    boxSizing: "border-box",
  },

  footHint: { fontSize: 11.5, color: SUBTLE, lineHeight: 1.6, padding: "0 2px" },
  code: {
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
    fontSize: 11,
    background: "#f3f4f6",
    padding: "1px 5px",
    borderRadius: 4,
  },
};
