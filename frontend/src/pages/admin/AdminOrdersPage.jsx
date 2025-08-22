import { useQuery, useMutation } from "@apollo/client";
import { GET_ADMIN_ORDERS } from "../../graphql/query/adminOrder.query.js";
import { DISPATCH_ORDER } from "../../graphql/mutation/adminOrder.mutation.js";
import { useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const sgd = (n) =>
  new Intl.NumberFormat("en-SG", { style: "currency", currency: "SGD" }).format(Number(n || 0));

const formatDate = (dateString) => {
  if (!dateString) return "Date not available";
  const d = new Date(dateString);
  return isNaN(d.getTime())
    ? "Date not available"
    : d.toLocaleString("en-SG", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
};

export default function AdminOrdersPage() {
  const navigate = useNavigate();
  const { data, loading, error, refetch } = useQuery(GET_ADMIN_ORDERS, {
    fetchPolicy: "network-only",
  });

  const [etaDays, setEtaDays] = useState(7);

  const [dispatchOrder, { loading: saving }] = useMutation(DISPATCH_ORDER, {
    optimisticResponse: ({ orderId, etaDays }) => ({
      dispatchOrder: {
        __typename: "DispatchOrderResult",
        success: true,
        message: "Order dispatched",
        order: {
          __typename: "Order",
          _id: orderId,
          fulfillmentStatus: "dispatched",
          dispatchedAt: new Date().toISOString(),
          estimatedDeliveryDate: new Date(Date.now() + (etaDays ?? 7) * 86400000).toISOString(),
        },
      },
    }),
    update(cache, { data: res }) {
      const updated = res?.dispatchOrder?.order;
      if (!updated?._id) return;
      const existing = cache.readQuery({ query: GET_ADMIN_ORDERS });
      if (!existing?.adminOrders) return;
      cache.writeQuery({
        query: GET_ADMIN_ORDERS,
        data: {
          adminOrders: existing.adminOrders.map((o) =>
            o._id === updated._id ? { ...o, ...updated } : o
          ),
        },
      });
    },
    onCompleted: (r) => {
      if (r?.dispatchOrder?.success) {
        toast.success(r.dispatchOrder.message || "Order dispatched");
        refetch();
      } else {
        toast.error(r?.dispatchOrder?.message || "Failed to dispatch");
      }
    },
    onError: (e) => toast.error(e.message),
  });

  if (loading) return <div className="p-4">Loading…</div>;
  if (error) return <div className="p-4 text-red-600">{error.message}</div>;

  const orders = data?.adminOrders ?? [];

  const handleDispatch = async (id) => {
    await dispatchOrder({
      variables: { orderId: id, etaDays: parseInt(etaDays, 10) || 7 },
    });
  };

  return (
    <div className="mx-auto max-w-5xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Orders</h1>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">ETA (days)</label>
          <input
            type="number"
            min={1}
            className="h-9 w-20 rounded-md border px-2"
            value={etaDays}
            onChange={(e) => setEtaDays(e.target.value)}
          />
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-lg border bg-white p-6 text-gray-600">No orders yet.</div>
      ) : (
        <div className="space-y-6">
          {orders.map((o) => {
            const isPending = o.fulfillmentStatus === "pending";
            const isDispatched = o.fulfillmentStatus === "dispatched";

            return (
              <div key={o._id} className="rounded-lg border bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="font-semibold">Order #{o._id.slice(-6)}</div>
                  {/* header right timestamp */}
                  <div className="text-sm text-gray-500">{formatDate(o.createdAt)}</div>
                </div>

                {/* details */}
                <div className="mt-2 text-sm text-gray-700">
                  <div>
                    User: {o.user?.name} · {o.user?.email}
                  </div>
                  <div>
                    Ship to: {o.user?.address?.postalCode || "-"},{" "}
                    {o.user?.address?.country || "-"}
                  </div>
                  <div>
                    Status: <b className="capitalize">{o.fulfillmentStatus}</b>
                  </div>

                  {isDispatched && (
                    <div>
                      Dispatched: {formatDate(o.dispatchedAt)} · ETA:{" "}
                      {formatDate(o.estimatedDeliveryDate)}
                    </div>
                  )}
                </div>

                <div className="mt-4 divide-y">
                  {o.products.map((it, i) => (
                    <div key={i} className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-3">
                        {it.product?.image && (
                          <img
                            src={it.product.image}
                            alt={it.product.name}
                            className="h-10 w-10 rounded object-cover"
                          />
                        )}
                        <div className="font-medium">{it.product?.name}</div>
                        <div className="text-sm text-gray-500">× {it.quantity}</div>
                      </div>
                      <div className="text-sm">
                        {sgd((it.price || 0) * (it.quantity || 0))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex items-center justify-between border-t pt-3">
                  <div className="text-sm text-gray-600">
                    {o.paymentMethod} · {o.paymentStatus}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-base font-semibold">{sgd(o.totalAmount)}</div>
                    <button
                      onClick={() => handleDispatch(o._id)}
                      disabled={saving || !isPending}
                      className="rounded-md bg-blue-500 px-4 py-2 text-white disabled:opacity-50"
                    >
                      {isDispatched ? "Dispatched" : isPending ? "Dispatch" : "Not Dispatchable"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* back button bottom-left with spacing */}
      <div className="pt-8">
        <button
          onClick={() => navigate("/admin/products")}
          className="px-6 py-2 bg-blue-400 text-white rounded-lg hover:bg-blue-500 text-sm shadow"
        >
          Back
        </button>
      </div>
    </div>
  );
}
