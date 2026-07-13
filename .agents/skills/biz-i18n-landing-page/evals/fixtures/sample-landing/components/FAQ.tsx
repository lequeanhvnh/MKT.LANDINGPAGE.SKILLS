export default function FAQ() {
  const faqs = [
    {
      q: "Em chưa từng tập gym bao giờ có theo được không?",
      a: "Hoàn toàn được. Lộ trình được thiết kế từ mức cơ bản nhất rồi tăng dần theo thể trạng của anh/chị.",
    },
    {
      q: "Nếu tập mà không có kết quả thì sao?",
      a: "Anh/chị được hoàn 100% học phí nếu tập đủ buổi trong 4 tuần đầu mà không giảm được cân nào.",
    },
  ];

  return (
    <section className="py-16">
      <h2 className="text-center text-3xl font-bold">Câu hỏi thường gặp</h2>
      <div className="mt-8 space-y-5">
        {faqs.map((item) => (
          <div key={item.q} className="rounded-xl border p-5">
            <p className="font-semibold">{item.q}</p>
            <p className="mt-2 text-neutral-600">{item.a}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
