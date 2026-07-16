import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Học Viện Sức Khỏe Chủ Động — Khoá huấn luyện 12 tuần",
  description:
    "Lấy lại vóc dáng và năng lượng trong 12 tuần cùng huấn luyện viên cá nhân, không cần ép cân cực đoan.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="antialiased">{children}</body>
    </html>
  );
}
