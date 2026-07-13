export default function Hero() {
  const stats = [
    { value: "1.200+", label: "học viên đã tốt nghiệp" },
    { value: "92%", label: "duy trì kết quả sau 6 tháng" },
  ];

  return (
    <section className="py-16 text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">
        Khoá huấn luyện 12 tuần
      </p>
      <h1 className="mt-3 text-4xl font-bold leading-tight">
        Lấy lại vóc dáng và năng lượng — không cần ép cân cực đoan
      </h1>
      <p className="mt-4 text-lg text-neutral-600">
        Anh/chị sẽ có lộ trình tập luyện và dinh dưỡng riêng, kèm huấn luyện
        viên đồng hành kiểm tra tiến độ mỗi tuần.
      </p>
      <a
        href="#dang-ky"
        className="mt-6 inline-block rounded-full bg-emerald-600 px-7 py-3 font-semibold text-white"
      >
        Nhận tư vấn miễn phí
      </a>
      <div className="mt-10 flex justify-center gap-12">
        {stats.map((s) => (
          <div key={s.label}>
            <div className="text-3xl font-bold text-emerald-600">
              {s.value}
            </div>
            <div className="mt-1 text-sm text-neutral-500">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
