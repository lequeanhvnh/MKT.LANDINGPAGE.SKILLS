/**
 * EXAMPLE — the source-of-truth dictionary (e.g. app/i18n/dictionaries/vi.ts).
 *
 * This is a SHAPE GUIDE, not a file to copy verbatim. Build the real one from
 * the actual strings on the landing page.
 *
 * Rules:
 *  - One key per visible string, grouped by the component it belongs to
 *    (Hero.tsx -> `hero`, Pricing.tsx -> `pricing`, FAQ.tsx -> `faq`).
 *  - Copy the original strings in EXACTLY — character for character. After
 *    rewiring, the page in this language must look byte-identical to before.
 *  - Keep repeated structures (pricing tiers, FAQ items, feature lists) as
 *    arrays of objects; every element gets translated in the other languages.
 *  - Note there is NO `as const` — that keeps value types as plain `string`,
 *    so the other language files only have to match KEYS, not the exact text.
 *
 * Do NOT export a type from here — `Dictionary` is derived in ./index.ts as
 * `typeof vi`.
 */

export const vi = {
  // layout.tsx <metadata> — also synced to the browser tab title client-side.
  meta: {
    title: "Tiêu đề trang — hiện trên tab trình duyệt",
    description: "Mô tả ngắn cho SEO và khi chia sẻ link.",
  },

  // Header / nav.
  nav: {
    cta: "Đăng ký ngay",
  },

  hero: {
    title: "Tiêu đề lớn của khối hero",
    subtitle: "Câu mô tả phụ ngay bên dưới tiêu đề.",
    cta: "Nhận tư vấn miễn phí",
  },

  pricing: {
    heading: "Bảng giá",
    tiers: [
      {
        name: "Gói Cơ Bản",
        price: "499K", // giá VND giữ nguyên ở mọi ngôn ngữ — không quy đổi
        features: ["Quyền lợi thứ nhất", "Quyền lợi thứ hai"],
      },
    ],
  },

  faq: {
    heading: "Câu hỏi thường gặp",
    items: [{ q: "Một câu hỏi?", a: "Câu trả lời tương ứng." }],
  },

  // Lead form — mọi landing page đều có (tên / SĐT / email).
  form: {
    nameLabel: "Họ và tên",
    phoneLabel: "Số điện thoại",
    emailLabel: "Email",
    submit: "Gửi thông tin",
    errorPhone: "Số điện thoại không hợp lệ",
    success: "Cảm ơn anh/chị, bộ phận tư vấn sẽ liên hệ sớm.",
  },

  footer: {
    rights: "© 2026 Tên thương hiệu. Bảo lưu mọi quyền.",
  },
};
