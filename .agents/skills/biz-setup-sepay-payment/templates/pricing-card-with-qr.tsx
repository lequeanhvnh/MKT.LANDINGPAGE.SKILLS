// Pattern C: Inline pricing card với QR hardcoded amount.
// Phù hợp khi không cần thu lead trước (kém personalized, dùng cho tier display).
// Không tạo lead trong KV → webhook không lookup được khách → chỉ phù hợp cho impulse buy donation/tip.

export function PricingCardWithQR({
  planName,
  amount,
  features,
}: {
  planName: string;
  amount: number;
  features: string[];
}) {
  const bank = process.env.NEXT_PUBLIC_SEPAY_BANK_NAME ?? 'Vietcombank';
  const accountNumber = process.env.NEXT_PUBLIC_SEPAY_ACCOUNT_NUMBER ?? '';
  // Note: pricing card không có order_id riêng — content sẽ là tên plan
  const content = planName.toUpperCase().replace(/\s+/g, '_');
  const qrUrl = `https://qr.sepay.vn/img?acc=${accountNumber}&bank=${bank}&amount=${amount}&des=${content}&template=compact`;

  return (
    <div className="mx-auto max-w-sm rounded-2xl border-2 border-blue-500 bg-white p-8 shadow-xl">
      <div className="mb-6 text-center">
        <h3 className="text-xl font-bold text-gray-900">{planName}</h3>
        <div className="mt-3">
          <span className="text-4xl font-bold text-blue-600">
            {amount.toLocaleString('vi-VN')}
          </span>
          <span className="ml-1 text-gray-500">đ</span>
        </div>
      </div>

      <ul className="mb-6 space-y-2">
        {features.map((f, i) => (
          <li key={i} className="flex items-center gap-2 text-gray-700">
            <span className="text-green-500">✓</span> {f}
          </li>
        ))}
      </ul>

      <div className="border-t border-gray-200 pt-6 text-center">
        <img
          src={qrUrl}
          alt={`Quét QR thanh toán ${planName}`}
          className="mx-auto h-44 w-44 rounded-lg shadow-md"
        />
        <p className="mt-3 text-sm text-gray-600">Quét QR để thanh toán</p>
        <p className="mt-1 text-xs text-gray-500">
          Nội dung CK: <span className="font-mono font-bold">{content}</span>
        </p>
      </div>
    </div>
  );
}
