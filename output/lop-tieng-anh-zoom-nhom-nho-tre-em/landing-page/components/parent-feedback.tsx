import { CarFront, MessageCircleMore, Speech, UserRoundCheck } from "lucide-react";
import Image from "next/image";

const feedbackItems = [
  {
    icon: Speech,
    title: "Con chủ động mở lời hơn",
    content:
      "“Trước đây con thường né khi được hỏi bằng tiếng Anh. Sau khóa học, con đã chủ động dùng những câu ngắn để chào hỏi và kể về một ngày của mình.”",
  },
  {
    icon: CarFront,
    title: "Ba mẹ không còn mất thời gian đưa đón",
    content:
      "“Con học ngay tại nhà nên gia đình dễ sắp xếp lịch hơn. Ba mẹ vẫn theo dõi được buổi học mà không phải di chuyển hoặc chờ đợi ngoài lớp.”",
  },
  {
    icon: UserRoundCheck,
    title: "Con được giáo viên theo sát",
    content:
      "“Nhóm nhỏ giúp giáo viên gọi từng bé thực hành, sửa phát âm và phản hồi cụ thể. Ba mẹ biết rõ con đang tiến bộ ở đâu và cần luyện thêm điều gì.”",
  },
];

export function ParentFeedback() {
  return (
    <section
      aria-labelledby="parent-feedback-title"
      className="relative overflow-hidden bg-white py-20 sm:py-28"
    >
      <div
        aria-hidden="true"
        className="absolute -left-28 top-16 size-72 rounded-full bg-sky-100/70 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute -right-24 bottom-0 size-72 rounded-full bg-orange-100/60 blur-3xl"
      />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid items-center gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:gap-12">
          <div className="soft-shadow relative aspect-[1.72/1] overflow-hidden rounded-[2rem] border-[6px] border-white bg-sky-wash">
            <Image
              src="/parent-child-app.webp"
              alt="Phụ huynh đồng hành cùng bé luyện nói tiếng Anh trên ứng dụng tại nhà"
              fill
              sizes="(max-width: 1024px) 100vw, 54vw"
              className="object-cover"
            />
          </div>
          <div>
            <p className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-sky-deep">
              Góc nhìn của phụ huynh
            </p>
            <h2
              id="parent-feedback-title"
              className="text-balance text-3xl font-semibold leading-tight text-slate-950 sm:text-4xl lg:text-[2.75rem]"
            >
              Phụ huynh yêu thích điều gì sau khóa học?
            </h2>
            <p className="mt-4 text-pretty text-base leading-7 text-slate-600 sm:text-lg">
              Ba thay đổi gần gũi mà gia đình có thể quan sát trong quá trình con học
              tiếng Anh trực tuyến theo nhóm nhỏ.
            </p>
            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-wash px-4 py-2 text-sm font-bold text-sky-ink">
              <MessageCircleMore aria-hidden="true" className="size-4 text-orange-cta" />
              Theo dõi được tiến bộ ngay tại nhà
            </div>
          </div>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {feedbackItems.map(({ icon: Icon, title, content }) => (
            <article
              key={title}
              className="card-shadow flex h-full flex-col rounded-3xl border border-sky-100 bg-white p-6 transition-colors duration-200 hover:border-sky-300 sm:p-7"
            >
              <div className="flex items-center justify-between gap-4">
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-sky-wash text-sky-deep">
                  <Icon aria-hidden="true" className="size-6" />
                </span>
                <MessageCircleMore
                  aria-hidden="true"
                  className="size-6 shrink-0 text-orange-400"
                />
              </div>

              <h3 className="mt-6 text-xl font-semibold leading-snug text-slate-950">
                {title}
              </h3>
              <p className="mt-3 flex-1 leading-7 text-slate-600">{content}</p>

              <p className="mt-6 rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-bold leading-5 text-orange-900">
                Nội dung minh họa — thay bằng phản hồi thật
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
