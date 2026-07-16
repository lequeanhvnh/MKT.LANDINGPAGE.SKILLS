"use client";

import { useState } from "react";

export default function LeadForm() {
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const phone = new FormData(e.currentTarget).get("phone") as string;
    if (!/^(0|\+84)[0-9]{9}$/.test(phone)) {
      setError("Số điện thoại không hợp lệ");
      return;
    }
    setError("");
    alert("Đăng ký thành công, đội ngũ sẽ liên hệ với anh/chị sớm.");
  }

  return (
    <section id="dang-ky" className="py-16">
      <h2 className="text-center text-3xl font-bold">
        Đăng ký nhận tư vấn miễn phí
      </h2>
      <p className="mt-3 text-center text-neutral-600">
        Để lại thông tin, đội ngũ huấn luyện viên sẽ liên hệ trong 24 giờ.
      </p>
      <form onSubmit={handleSubmit} className="mx-auto mt-8 max-w-md space-y-4">
        <label className="block">
          <span className="text-sm font-medium">Họ và tên</span>
          <input
            name="name"
            required
            placeholder="Nguyễn Văn A"
            className="mt-1 w-full rounded-lg border px-3 py-2"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Số điện thoại</span>
          <input
            name="phone"
            required
            placeholder="0901234567"
            className="mt-1 w-full rounded-lg border px-3 py-2"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Email</span>
          <input
            name="email"
            type="email"
            required
            placeholder="email@example.com"
            className="mt-1 w-full rounded-lg border px-3 py-2"
          />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          className="w-full rounded-full bg-emerald-600 py-3 font-semibold text-white"
        >
          Gửi thông tin
        </button>
      </form>
    </section>
  );
}
