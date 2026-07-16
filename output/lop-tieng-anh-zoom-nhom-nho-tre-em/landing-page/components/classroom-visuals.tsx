import Image from "next/image";
import { CheckCircle2, Mic2, Users } from "lucide-react";

export function ClassroomVisuals() {
  return (
    <section aria-labelledby="classroom-visuals-title" className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-sky-deep">
            Một buổi học diễn ra như thế nào?
          </p>
          <h2
            id="classroom-visuals-title"
            className="text-balance text-3xl font-semibold leading-tight text-slate-950 sm:text-4xl lg:text-[2.75rem]"
          >
            Không chỉ ngồi xem — mỗi bé đều có lượt để nói
          </h2>
          <p className="mt-4 text-pretty text-base leading-7 text-slate-600 sm:text-lg">
            Lớp học được giữ ở quy mô tối đa 6 bé để giáo viên dễ quan sát,
            gọi từng bé thực hành và sửa phát âm ngay trong buổi học.
          </p>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-12">
          <figure className="soft-shadow group relative overflow-hidden rounded-[2rem] border-[6px] border-white bg-sky-wash lg:col-span-7">
            <div className="relative aspect-[16/9]">
              <Image
                src="/classroom-speaking.webp"
                alt="Lớp tiếng Anh trực tuyến gồm một giáo viên và năm bé đang luyện hội thoại"
                fill
                sizes="(max-width: 1024px) 100vw, 58vw"
                className="object-cover transition-opacity duration-200 group-hover:opacity-95"
              />
            </div>
            <figcaption className="absolute bottom-4 left-4 right-4 flex items-center gap-3 rounded-2xl bg-slate-950/85 px-4 py-3 text-white backdrop-blur-sm sm:right-auto sm:max-w-md">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-sky-brand">
                <Users aria-hidden="true" className="size-5" />
              </span>
              <span>
                <strong className="block font-heading text-lg">6 ô hình, 6 cơ hội được nói</strong>
                <span className="text-sm text-slate-200">Không có bé nào bị chìm trong lớp đông</span>
              </span>
            </figcaption>
          </figure>

          <figure className="card-shadow group relative overflow-hidden rounded-[2rem] border border-sky-100 bg-sky-wash lg:col-span-5">
            <div className="relative aspect-[16/9] lg:h-full lg:min-h-[360px] lg:aspect-auto">
              <Image
                src="/classroom-feedback.webp"
                alt="Giáo viên hướng dẫn khẩu hình và sửa phát âm trực tiếp cho bé trong lớp trực tuyến"
                fill
                sizes="(max-width: 1024px) 100vw, 42vw"
                className="object-cover transition-opacity duration-200 group-hover:opacity-95"
              />
            </div>
            <figcaption className="absolute bottom-4 left-4 right-4 flex items-center gap-3 rounded-2xl bg-white/95 px-4 py-3 text-slate-950 shadow-lg backdrop-blur-sm">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-orange-100 text-orange-dark">
                <Mic2 aria-hidden="true" className="size-5" />
              </span>
              <span>
                <strong className="block font-heading text-lg">Sửa khẩu hình ngay tại chỗ</strong>
                <span className="text-sm text-slate-600">Bé nghe, nói lại và nhận phản hồi trực tiếp</span>
              </span>
            </figcaption>
          </figure>
        </div>

        <div className="mx-auto mt-7 flex max-w-4xl flex-col items-center justify-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-center text-sm font-semibold text-emerald-900 sm:flex-row">
          <CheckCircle2 aria-hidden="true" className="size-5 shrink-0 text-emerald-700" />
          Mỗi bé được gọi thực hành tối thiểu 2 lần trong một buổi học 60–75 phút.
          <span className="font-normal text-emerald-700">Hình ảnh minh họa cho mô hình lớp học.</span>
        </div>
      </div>
    </section>
  );
}
