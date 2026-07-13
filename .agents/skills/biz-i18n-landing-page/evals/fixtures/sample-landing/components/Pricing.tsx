export default function Pricing() {
  const tiers = [
    {
      name: "Tự Học",
      price: "1.990.000đ",
      tag: "Cho người muốn bắt đầu chậm rãi",
      features: [
        "Giáo trình video 12 tuần",
        "Nhóm cộng đồng hỗ trợ",
        "Thực đơn mẫu theo tuần",
      ],
    },
    {
      name: "Đồng Hành",
      price: "4.990.000đ",
      tag: "Lựa chọn của 78% học viên",
      features: [
        "Tất cả quyền lợi gói Tự Học",
        "Huấn luyện viên riêng kèm cặp 1-1",
        "Gọi video kiểm tra tiến độ mỗi tuần",
      ],
    },
  ];

  return (
    <section className="py-16">
      <h2 className="text-center text-3xl font-bold">
        Chọn gói phù hợp với anh/chị
      </h2>
      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        {tiers.map((t) => (
          <div key={t.name} className="rounded-2xl border p-6">
            <h3 className="text-xl font-bold">{t.name}</h3>
            <p className="mt-1 text-sm text-neutral-500">{t.tag}</p>
            <p className="mt-4 text-2xl font-bold text-emerald-600">
              {t.price}
            </p>
            <ul className="mt-4 space-y-2 text-sm text-neutral-700">
              {t.features.map((f) => (
                <li key={f}>• {f}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
