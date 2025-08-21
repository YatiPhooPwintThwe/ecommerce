// src/components/GiftCouponCard.jsx
import { useEffect, useState } from "react";
import { useMutation, useQuery, useApolloClient } from "@apollo/client";
import toast from "react-hot-toast";
import { GET_MY_COUPON } from "../graphql/query/coupon.query.js";
import { VALIDATE_COUPON } from "../graphql/mutation/coupon.mutation.js";

export default function GiftCouponCard({ onChanged }) {
  const client = useApolloClient();
  const [code, setCode] = useState("");

  const { data, loading, refetch } = useQuery(GET_MY_COUPON, {
    fetchPolicy: "network-only",
  });

  const [validateCoupon, { loading: applying }] = useMutation(VALIDATE_COUPON, {
    onCompleted: async (res) => {
      const r = res?.validateCoupon;
      // handle invalid/used/not found
      if (!r?.code || !r?.discountPercentage) {
        toast.error(r?.message || "Invalid coupon");
        return;
      }

      // success
      toast.success(`${r.discountPercentage}% off applied`);
      const existing = client.readQuery({ query: GET_MY_COUPON })?.myCoupon;
      // prime cache so totals update instantly
      client.writeQuery({
        query: GET_MY_COUPON,
        data: {
          myCoupon: {
            __typename: "Coupon",
            _id: existing?._id ?? "temp",
            code: r.code,
            discountPercentage: r.discountPercentage,
            redeemed: false,
            isActive: true,
          },
        },
      });

      // also refetch from server (best-effort)
      try {
        await refetch();
      } catch (err) {
        console.error("Refetch failed:", err);
      }
      onChanged?.();
    },
    onError: (err) => toast.error(err.message || "Failed to apply coupon"),
  });

  useEffect(() => {
    if (data?.myCoupon?.code) setCode(data.myCoupon.code);
  }, [data]);

  const handleApply = () => {
    const c = (code || "").trim().toUpperCase();
    if (!c) {
      toast.error("Please enter a code");
      return;
    }
    validateCoupon({ variables: { code: c } });
  };

  const disabled = loading || applying;

  return (
    <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <label
        htmlFor="voucher"
        className="block text-sm font-semibold text-slate-800"
      >
        Do you have a voucher or gift card?
      </label>

      <div className="flex gap-3">
        <input
          id="voucher"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="h-10 flex-1 rounded-md border border-gray-300 bg-white px-3 text-sm text-slate-900 placeholder-slate-400
                     focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 disabled:bg-gray-100"
          placeholder="Enter code"
          disabled={disabled}
        />
        <button
          type="button"
          onClick={handleApply}
          disabled={disabled || !code.trim()}
          className="h-10 rounded-md bg-blue-400 px-4 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-60"
          aria-busy={applying}
        >
          {applying ? "Applying…" : "Apply Code"}
        </button>
      </div>

      {data?.myCoupon && (
        <div className="pt-1 text-sm">
          <div className="inline-flex items-center gap-2 rounded-md border border-blue-300 bg-emerald-50 px-2.5 py-1.5 text-blue-700">
            <span className="font-medium">{data.myCoupon.code}</span>
            <span>— {data.myCoupon.discountPercentage}% off</span>
          </div>
        </div>
      )}
    </section>
  );
}
