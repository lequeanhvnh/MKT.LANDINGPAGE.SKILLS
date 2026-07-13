import Image from "next/image";
import { ArrowRight, BadgeCheck, MessageCircle, Mic2, Users } from "lucide-react";

const teachingPrinciples = [
  {
    icon: Users,
    title: "Quan sát từng bé",
    text: "Quy mô tối đa 6 bé giúp giảng viên theo sát lượt tham gia của từng học viên.",
  },
  {
    icon: Mic2,
    title: "Sửa ngay khi bé nói",
    text: "Bé được nghe hướng dẫn, nói lại và điều chỉnh phát âm ngay trong buổi học.",
  },
  {
    icon: MessageCircle,
    title: "Phản hồi rõ ràng",
    text: "Phụ huynh dễ biết con đang tiến bộ ở đâu và cần luyện thêm điều gì tại nhà.",
  },
] as const;

export function InstructorProfile() {
  return (
    <section id="giang-vien" aria-labelledby="instructor-title" className="overflow-hidden bg-sky-wash py-20 sm:py-28">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-[0.82fr_1.18fr] lg:gap-20">
        <div className="relative mx-auto w-full max-w-md">
          <div className="absolute -left-8 -top-8 size-36 rounded-full bg-sky-200/70 blur-3xl" aria-hidden="true" />
          <div className="absolute -bottom-10 -right-8 size-40 rounded-full bg-orange-200/55 blur-3xl" aria-hidden="true" />
          <figure className="soft-shadow group relative aspect-[4/5] overflow-hidden rounded-[2rem] border-[7px] border-white bg-slate-200">
            <Image
              src="/tony-hoang.webp"
              alt="Giảng viên Tony Hoàng của chương trình English Zoom Kids"
              fill
              sizes="(max-width: 1024px) 100vw, 36vw"
              className="object-cover object-top transition-transform duration-300 group-hover:scale-[1.015]"
            />
            <figcaption className="absolute bottom-4 left-4 right-4 rounded-2xl border border-white/70 bg-white/95 px-4 py-3 shadow-lg backdrop-blur-sm">
              <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-sky-deep">
                <BadgeCheck aria-hidden="true" className="size-4" />
                Giảng viên chương trình
              </span>
              <strong className="mt-1 block font-heading text-xl text-slate-950">Tony Hoàng</strong>
            </figcaption>
          </figure>
        </div>

        <div>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-sky-deep">Giảng viên đồng hành cùng con</p>
          <h2 id="instructor-title" className="mt-3 text-balance text-3xl font-semibold leading-tight text-slate-950 sm:text-4xl lg:text-[2.75rem]">
            Học trong nhóm nhỏ để mỗi bé đều được nhìn thấy và lắng nghe
          </h2>
          <p className="mt-5 max-w-2xl text-pretty text-base leading-7 text-slate-600 sm:text-lg">
            Trong lớp English Zoom Kids, giảng viên Tony Hoàng đồng hành cùng các bé qua từng lượt luyện nói, giúp buổi học không dừng ở việc nghe giảng mà trở thành thời gian thực hành thật sự.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {teachingPrinciples.map(({ icon: Icon, title, text }) => (
              <article key={title} className="rounded-2xl border border-sky-100 bg-white p-5 shadow-sm">
                <span className="grid size-10 place-items-center rounded-xl bg-sky-wash text-sky-deep">
                  <Icon aria-hidden="true" className="size-5" />
                </span>
                <h3 className="mt-4 text-base font-bold text-slate-950">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
              </article>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-orange-200 bg-orange-50 px-5 py-4">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-orange-dark">Triết lý lớp học</p>
            <p className="mt-2 font-heading text-lg font-semibold leading-7 text-orange-950">
              Mỗi bé cần đủ không gian an toàn để dám mở lời, được sửa đúng lúc và nhận ra mình đang tiến bộ.
            </p>
          </div>

          <a
            href="#dang-ky"
            className="cta-shine mt-7 inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-full bg-orange-cta px-6 py-3.5 font-bold text-white shadow-[0_12px_28px_rgba(249,115,22,0.28)] transition-[transform,background-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:bg-orange-dark hover:shadow-[0_16px_34px_rgba(249,115,22,0.34)] active:translate-y-0"
          >
            Đăng ký kiểm tra cùng giảng viên
            <ArrowRight aria-hidden="true" className="size-5" />
          </a>
        </div>
      </div>
    </section>
  );
}
