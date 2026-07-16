import type { Metadata } from "next";
import { Be_Vietnam_Pro, Fredoka } from "next/font/google";
import "./globals.css";

const fredoka = Fredoka({
  subsets: ["latin", "latin-ext"],
  variable: "--font-heading",
  display: "swap",
});

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "English Zoom Kids | Lớp tiếng Anh nhóm nhỏ tối đa 6 bé",
  description:
    "10 buổi học tiếng Anh trực tuyến theo nhóm nhỏ, giúp bé tăng phản xạ giao tiếp và được sửa phát âm trực tiếp.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" className={`${fredoka.variable} ${beVietnamPro.variable}`}>
      <body>{children}</body>
    </html>
  );
}
