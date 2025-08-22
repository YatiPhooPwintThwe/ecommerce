// frontend/src/components/OrderSummary.jsx
export default function OrderSummary({
  subtotal,
  savings,
  delivery = 0,   // NEW
  gst = 0,        // NEW
  total,
  format,
  onCheckout,
  loading,
}) {
  const fmt = format || ((n) => n);

  return (
    <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-xl font-bold text-black-300">Order summary</p>

      <div className="space-y-2">
        <Row label="Original price" value={fmt(subtotal)} />
        {savings > 0 && <Row label="Savings" value={`-${fmt(savings)}`} dim />}
        <Row label="Delivery" value={fmt(delivery)} />     {/* NEW */}
        <Row label="GST" value={fmt(gst)} />               {/* NEW */}
        <div className="border-t border-gray-200 pt-2">
          <Row label="Total" value={fmt(total)} bold />
        </div>
      </div>

      <button
        onClick={onCheckout}
        disabled={loading}
        className="w-full rounded-lg bg-blue-400 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Redirecting…" : "Proceed to Checkout"}
      </button>

      <div className="text-center">
        <a href="/" className="text-sm text-black-700 underline hover:no-underline">
          Continue Shopping →
        </a>
      </div>
    </div>
  );
}

function Row({ label, value, bold, dim }) {
  return (
    <dl className="flex items-center justify-between">
      <dt className={`text-sm ${bold ? "font-semibold" : dim ? "text-slate-500" : "text-slate-700"}`}>
        {label}
      </dt>
      <dd className={`text-sm ${bold ? "font-semibold" : ""}`}>{value}</dd>
    </dl>
  );
}
