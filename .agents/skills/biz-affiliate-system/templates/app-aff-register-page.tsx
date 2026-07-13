// app/aff-register/page.tsx
//
// Trang đăng ký làm Đối tác giới thiệu (affiliate) — CÔNG KHAI, tự phục vụ.
// Khách điền họ tên + email + SĐT → POST /api/affiliate/register → nhận NGAY
// mã đối tác + link giới thiệu. Mặc định nhóm Pro, hoa hồng 30% mỗi đơn.
// Sau đó đăng nhập cổng đối tác /affiliate bằng mã + email để theo dõi.

"use client";

import {
  useEffect,
  useState,
  type CSSProperties,
  type FormEvent,
} from "react";

// SĐT Việt Nam — 0xxxxxxxxx hoặc +84xxxxxxxxx.
const PHONE_RE = /^(0|\+84)[0-9]{9}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const COMMISSION_RATE = 30;

type SuccessData = {
  affCode: string;
  name: string;
  commissionRate: number;
};

const ERROR_LABEL: Record<string, string> = {
  invalid_name: "Anh/chị nhập họ tên đầy đủ giúp em.",
  invalid_email: "Email chưa đúng định dạng. Anh/chị kiểm tra lại.",
  invalid_phone: "Số điện thoại chưa hợp lệ. VD: 0901234567.",
  email_exists: "Email này đã đăng ký làm đối tác rồi.",
  internal_error: "Có lỗi xảy ra. Anh/chị thử lại sau ít phút giúp em.",
  network: "Không kết nối được. Anh/chị kiểm tra mạng rồi thử lại.",
};

const BENEFITS: Array<{ icon: string; title: string; desc: string }> = [
  {
    icon: "💰",
    title: `Hoa hồng ${COMMISSION_RATE}% mỗi đơn`,
    desc: "Khách anh/chị giới thiệu thanh toán thành công, anh/chị nhận ngay 30% giá trị đơn.",
  },
  {
    icon: "🔗",
    title: "Link giới thiệu riêng",
    desc: "Nhận link cá nhân ngay sau khi đăng ký — chia sẻ lên Zalo, Facebook, hội nhóm.",
  },
  {
    icon: "📊",
    title: "Cổng đối tác minh bạch",
    desc: "Tự theo dõi lượt click, đơn giới thiệu và hoa hồng theo thời gian thực.",
  },
  {
    icon: "🗓️",
    title: "Ghi nhận trong 30 ngày",
    desc: "Khách bấm link rồi đăng ký trong vòng 30 ngày vẫn được tính cho anh/chị.",
  },
];

export default function AffRegisterPage() {
  const [done, setDone] = useState<SuccessData | null>(null);
  if (done) return <SuccessView data={done} />;
  return <RegisterView onSuccess={setDone} />;
}

function RegisterView({ onSuccess }: { onSuccess: (d: SuccessData) => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [err, setErr] = useState("");
  const [emailExists, setEmailExists] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErr("");
    setEmailExists(false);

    if (name.trim().length < 2) return setErr(ERROR_LABEL.invalid_name);
    if (!EMAIL_RE.test(email.trim())) return setErr(ERROR_LABEL.invalid_email);
    if (!PHONE_RE.test(phone.replace(/\s+/g, ""))) return setErr(ERROR_LABEL.invalid_phone);

    setBusy(true);
    try {
      const res = await fetch("/api/affiliate/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.replace(/\s+/g, ""),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        affCode?: string;
        name?: string;
        commissionRate?: number;
        error?: string;
      };

      if (res.ok && data.ok && data.affCode) {
        onSuccess({
          affCode: data.affCode,
          name: data.name ?? name.trim(),
          commissionRate: data.commissionRate ?? COMMISSION_RATE,
        });
        return;
      }
      if (data.error === "email_exists") setEmailExists(true);
      setErr(ERROR_LABEL[data.error ?? "internal_error"] ?? ERROR_LABEL.internal_error);
    } catch {
      setErr(ERROR_LABEL.network);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={S.wrap}>
      <div style={S.card}>
        <span style={S.eyebrow}>Chương trình đối tác</span>
        <h1 style={S.title}>Đăng ký làm Đối tác giới thiệu</h1>
        <p style={S.sub}>
          Giới thiệu khách đăng ký — nhận hoa hồng <strong>{COMMISSION_RATE}%</strong>{" "}
          mỗi đơn thành công. Đăng ký miễn phí, nhận link riêng ngay lập tức.
        </p>

        <ul style={S.benefitList}>
          {BENEFITS.map((b) => (
            <li key={b.title} style={S.benefitItem}>
              <span style={S.benefitIcon}>{b.icon}</span>
              <span>
                <span style={S.benefitTitle}>{b.title}</span>
                <span style={S.benefitDesc}>{b.desc}</span>
              </span>
            </li>
          ))}
        </ul>

        <form onSubmit={submit} style={S.form} noValidate>
          <label style={S.field}>
            <span style={S.fieldLabel}>Họ và tên</span>
            <input style={S.input} value={name} onChange={(e) => setName(e.target.value)} placeholder="VD: Nguyễn Thị Linh" autoComplete="name" autoFocus />
          </label>
          <label style={S.field}>
            <span style={S.fieldLabel}>Email</span>
            <input style={S.input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@vidu.com" autoComplete="email" inputMode="email" />
            <span style={S.fieldHint}>Dùng email này để đăng nhập cổng đối tác.</span>
          </label>
          <label style={S.field}>
            <span style={S.fieldLabel}>Số điện thoại</span>
            <input style={S.input} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0901234567" autoComplete="tel" inputMode="tel" />
            <span style={S.fieldHint}>Để ban quản trị liên hệ chi trả hoa hồng.</span>
          </label>

          {err && <div style={S.errBox}>{err}</div>}
          {emailExists && (
            <a href="/affiliate" style={S.altLink}>→ Đăng nhập cổng đối tác</a>
          )}

          <button type="submit" style={S.primaryBtn} disabled={busy}>
            {busy ? "Đang tạo tài khoản…" : "Đăng ký làm đối tác"}
          </button>
        </form>

        <p style={S.footNote}>
          Đã là đối tác?{" "}
          <a href="/affiliate" style={S.footLink}>Đăng nhập tại đây</a>
        </p>
      </div>
    </div>
  );
}

function SuccessView({ data }: { data: SuccessData }) {
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const refLink = origin ? `${origin}/?aff=${data.affCode}` : "";

  const copy = () => {
    if (!refLink) return;
    void navigator.clipboard.writeText(refLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div style={S.wrap}>
      <div style={S.card}>
        <div style={S.successIcon}>🎉</div>
        <h1 style={S.title}>Chúc mừng anh/chị {data.name}!</h1>
        <p style={S.sub}>
          Anh/chị đã trở thành Đối tác giới thiệu — nhóm Pro, hoa hồng{" "}
          <strong>{data.commissionRate}%</strong> mỗi đơn thành công.
        </p>

        <div style={S.codeCard}>
          <div style={S.codeLabel}>Mã đối tác của anh/chị</div>
          <div style={S.codeValue}>{data.affCode}</div>
        </div>

        <div style={S.linkCard}>
          <div style={S.linkLabel}>Link giới thiệu — chia sẻ link này</div>
          <div style={S.linkRow}>
            <code style={S.linkValue}>{refLink || `…/?aff=${data.affCode}`}</code>
            <button style={S.primaryBtn} onClick={copy} disabled={!refLink}>
              {copied ? "✓ Đã sao chép" : "Sao chép"}
            </button>
          </div>
        </div>

        <ol style={S.steps}>
          <li style={S.step}><strong>Chia sẻ link giới thiệu</strong> bên trên lên Zalo, Facebook, hội nhóm của anh/chị.</li>
          <li style={S.step}><strong>Khách bấm link</strong> rồi đăng ký + thanh toán trong vòng 30 ngày sẽ được tính hoa hồng cho anh/chị.</li>
          <li style={S.step}><strong>Theo dõi hoa hồng</strong> tại cổng đối tác — đăng nhập bằng email này, xem click, khách giới thiệu và hoa hồng cập nhật tự động.</li>
        </ol>

        <a href="/affiliate" style={{ ...S.primaryBtn, ...S.blockBtn }}>Vào cổng đối tác →</a>
      </div>
    </div>
  );
}

// Styles — indigo + slate, đồng bộ portal /affiliate
const S: Record<string, CSSProperties> = {
  wrap: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0f172a", padding: "32px 16px", fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif" },
  card: { background: "#fff", borderRadius: 20, padding: "32px clamp(20px, 5vw, 40px)", width: "100%", maxWidth: 520, color: "#0f172a", boxShadow: "0 24px 60px rgba(0,0,0,.35)" },
  eyebrow: { display: "inline-block", fontSize: 12, fontWeight: 800, color: "#4338ca", background: "#eef2ff", borderRadius: 999, padding: "5px 12px", textTransform: "uppercase", letterSpacing: 0.6 },
  title: { margin: "12px 0 0", fontSize: 24, fontWeight: 800, lineHeight: 1.25 },
  sub: { margin: "8px 0 0", fontSize: 14, color: "#64748b", lineHeight: 1.6 },
  benefitList: { listStyle: "none", margin: "20px 0 0", padding: 16, display: "flex", flexDirection: "column", gap: 14, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 14 },
  benefitItem: { display: "flex", gap: 12, alignItems: "flex-start" },
  benefitIcon: { fontSize: 20, flex: "0 0 auto", lineHeight: 1.4 },
  benefitTitle: { display: "block", fontSize: 14, fontWeight: 700, color: "#0f172a" },
  benefitDesc: { display: "block", fontSize: 13, color: "#64748b", lineHeight: 1.55, marginTop: 2 },
  form: { marginTop: 20, display: "flex", flexDirection: "column", gap: 14 },
  field: { display: "flex", flexDirection: "column", gap: 5 },
  fieldLabel: { fontSize: 13, fontWeight: 700, color: "#334155" },
  fieldHint: { fontSize: 12, color: "#94a3b8" },
  input: { border: "1px solid #cbd5e1", borderRadius: 10, padding: "11px 13px", fontSize: 15, width: "100%", boxSizing: "border-box", background: "#fff", color: "#0f172a" },
  errBox: { background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", fontSize: 13, fontWeight: 600, borderRadius: 10, padding: "10px 12px", lineHeight: 1.5 },
  altLink: { fontSize: 13, fontWeight: 700, color: "#4338ca", textDecoration: "none" },
  primaryBtn: { background: "#4f46e5", color: "#fff", border: "none", borderRadius: 10, padding: "13px 18px", fontSize: 15, fontWeight: 800, cursor: "pointer" },
  blockBtn: { display: "block", width: "100%", marginTop: 22, textAlign: "center", textDecoration: "none", boxSizing: "border-box" },
  footNote: { margin: "16px 0 0", fontSize: 13, color: "#94a3b8", textAlign: "center" },
  footLink: { color: "#4338ca", fontWeight: 700, textDecoration: "none" },
  successIcon: { fontSize: 44, lineHeight: 1 },
  codeCard: { marginTop: 20, background: "#0f172a", borderRadius: 14, padding: "16px 18px", textAlign: "center" },
  codeLabel: { fontSize: 12, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.6 },
  codeValue: { marginTop: 6, fontSize: 30, fontWeight: 800, letterSpacing: 3, color: "#fff", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" },
  linkCard: { marginTop: 14, background: "#eef2ff", border: "1px solid #c7d2fe", borderRadius: 14, padding: 16 },
  linkLabel: { fontSize: 13, fontWeight: 700, color: "#4338ca", marginBottom: 8 },
  linkRow: { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" },
  linkValue: { flex: "1 1 220px", background: "#fff", border: "1px solid #c7d2fe", borderRadius: 8, padding: "10px 12px", fontSize: 13, wordBreak: "break-all", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" },
  steps: { margin: "20px 0 0", paddingLeft: 20, display: "flex", flexDirection: "column", gap: 10 },
  step: { fontSize: 13, color: "#475569", lineHeight: 1.6 },
};
