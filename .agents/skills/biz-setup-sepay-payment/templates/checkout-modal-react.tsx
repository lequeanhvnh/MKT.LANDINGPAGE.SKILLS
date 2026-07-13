// Pattern A: Modal QR popup — show QR ngay tại trang gốc, không redirect.
// Phù hợp single-product / impulse buy. Wire vào landing page form.

'use client';

import { useState } from 'react';

type CheckoutResponse = {
  orderId: string;
  amount: number;
  productName: string;
  bankInfo: { bank: string; accountNumber: string };
  content: string;
  qrUrl: string;
};

export function CheckoutModalForm({
  productName,
  amount,
}: {
  productName: string;
  amount: number;
}) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<CheckoutResponse | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const body = {
      name: form.get('name') as string,
      phone: form.get('phone') as string,
      email: form.get('email') as string,
      productName,
      amount,
    };

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Lỗi tạo đơn');
      setData(json);
      setOpen(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="mx-auto max-w-md space-y-3">
        <input
          name="name"
          required
          minLength={2}
          placeholder="Họ và tên"
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base"
        />
        <input
          name="phone"
          required
          inputMode="numeric"
          pattern="0\d{9}"
          placeholder="Số điện thoại (10 số)"
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base"
        />
        <input
          name="email"
          type="email"
          required
          placeholder="Email"
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base"
        />
        {error && <div className="text-sm text-red-600">{error}</div>}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-blue-600 py-4 text-base font-bold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? 'Đang xử lý...' : `Đăng ký ngay — ${amount.toLocaleString('vi-VN')}đ`}
        </button>
      </form>

      {open && data && <Modal data={data} onClose={() => setOpen(false)} />}
    </>
  );
}

function Modal({ data, onClose }: { data: CheckoutResponse; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
          aria-label="Đóng"
        >
          ✕
        </button>
        <h3 className="mb-4 text-center text-xl font-bold">Quét QR để thanh toán</h3>
        <img
          src={data.qrUrl}
          alt="VietQR"
          className="mx-auto mb-4 h-64 w-64 rounded-lg border border-gray-200 shadow-md"
        />
        <div className="space-y-1 rounded-lg bg-gray-50 p-3 text-sm">
          <Row label="Số tiền" value={data.amount.toLocaleString('vi-VN') + 'đ'} />
          <Row label="Ngân hàng" value={data.bankInfo.bank} />
          <Row label="Số tài khoản" value={data.bankInfo.accountNumber} />
          <Row label="Nội dung CK" value={data.content} highlight />
        </div>
        <p className="mt-4 text-center text-xs text-gray-500">
          Em sẽ gọi xác nhận sau khi nhận tiền (~2 phút)
        </p>
      </div>
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-600">{label}:</span>
      <span className={highlight ? 'font-mono font-bold text-blue-700' : 'font-medium'}>
        {value}
      </span>
    </div>
  );
}
