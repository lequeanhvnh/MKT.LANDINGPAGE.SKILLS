import Image from "next/image";
import { BookOpen, CheckCircle2, Infinity, Mic2, Sparkles } from "lucide-react";

const appBenefits = [
  "Luyện từ vựng theo lộ trình ngắn, dễ duy trì mỗi ngày",
  "Tự thu âm và nhận phản hồi khi luyện câu giao tiếp",
  "Theo dõi tiến độ để ba mẹ biết bé đang học tới đâu",
];

export function PracticeAppShowcase() {
  return (
    <section aria-labelledby="practice-app-title" className="overflow-hidden bg-sky-deep py-20 text-white sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid items-end gap-8 lg:grid-cols-[1fr_0.72fr]">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-sky-200">
              Học xong vẫn tiếp tục luyện
            </p>
            <h2
              id="practice-app-title"
              className="mt-3 max-w-3xl text-balance text-3xl font-semibold leading-tight sm:text-4xl lg:text-[2.75rem]"
            >
              Một app học tiếng Anh để bé tự luyện mỗi ngày
            </h2>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-sky-100">
              Sau giờ học live, bé tiếp tục ôn từ vựng và luyện nói trên điện thoại.
              Quyền sử dụng được tặng trọn đời, không phát sinh phí gia hạn.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-sky-50 ring-1 ring-white/20">
              <Infinity aria-hidden="true" className="size-5 text-orange-300" />
              Sử dụng trọn đời
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-orange-cta px-4 py-2 text-sm font-bold text-white">
              <Sparkles aria-hidden="true" className="size-5" />
              Trị giá 2.500.000đ
            </span>
          </div>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-12">
          <div className="group relative overflow-hidden rounded-[2rem] border border-white/15 bg-white/10 p-2 lg:col-span-7">
            <div className="relative aspect-[1.9/1] overflow-hidden rounded-[1.55rem]">
              <Image
                src="/app-learning-dashboard.webp"
                alt="Minh họa dashboard ứng dụng học tiếng Anh với bài học, chuỗi ngày học và tiến độ từ vựng"
                fill
                sizes="(max-width: 1024px) 100vw, 58vw"
                className="object-cover transition-opacity duration-200 group-hover:opacity-95"
              />
            </div>
            <div className="p-5 sm:p-6">
              <h3 className="text-2xl font-semibold">Biết hôm nay cần học gì</h3>
              <p className="mt-2 leading-7 text-sky-100">
                Bài học ngắn, tiến độ rõ ràng và lời nhắc nhẹ giúp bé dễ tạo thói quen.
              </p>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-[2rem] border border-orange-300/40 bg-orange-cta p-2 lg:col-span-5">
            <div className="relative aspect-[1.8/1] overflow-hidden rounded-[1.55rem] bg-white">
              <Image
                src="/app-speaking-practice.webp"
                alt="Minh họa ứng dụng luyện nói tiếng Anh với micro, sóng âm và phản hồi phát âm"
                fill
                sizes="(max-width: 1024px) 100vw, 42vw"
                className="object-cover transition-opacity duration-200 group-hover:opacity-95"
              />
            </div>
            <div className="p-5 sm:p-6">
              <h3 className="text-2xl font-semibold">Dám nói và thử lại nhiều lần</h3>
              <p className="mt-2 leading-7 text-orange-50">
                Micro luyện nói tạo không gian riêng để bé tập câu mới mà không sợ sai.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-7 grid gap-5 rounded-[2rem] border border-white/15 bg-white/10 p-6 backdrop-blur-sm lg:grid-cols-[0.72fr_1.28fr] sm:p-8">
          <div className="flex gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white text-sky-deep">
              <BookOpen aria-hidden="true" className="size-6" />
            </span>
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-sky-200">Tặng thêm · Trị giá 300.000đ</p>
              <h3 className="mt-1 text-xl font-semibold">Trọn bộ sách tiếng Anh điện tử</h3>
              <p className="mt-2 leading-7 text-sky-100">Từ vựng, ngữ pháp và bài tập đi theo từng buổi học.</p>
            </div>
          </div>
          <ul className="grid gap-3 sm:grid-cols-3">
            {appBenefits.map((benefit, index) => (
              <li key={benefit} className="flex gap-2 rounded-2xl bg-sky-950/30 p-4 text-sm leading-6 text-sky-50">
                {index === 1 ? (
                  <Mic2 aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-orange-300" />
                ) : (
                  <CheckCircle2 aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-emerald-300" />
                )}
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-5 text-center text-xs leading-5 text-sky-300">
          Hình ảnh màn hình app mang tính minh họa; giao diện thực tế có thể thay đổi theo phiên bản phần mềm.
        </p>
      </div>
    </section>
  );
}
