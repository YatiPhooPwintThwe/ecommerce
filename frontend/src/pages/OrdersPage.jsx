import { useQuery } from "@apollo/client";
import { GET_ORDERS } from "../graphql/query/order.query.js";
import { Loader } from "lucide-react";
import { useNavigate } from "react-router-dom";

const sgd = (n) =>
  new Intl.NumberFormat("en-SG", { style: "currency", currency: "SGD" }).format(Number(n || 0));

const formatDate = (s) => {
  if (!s) return "Date not available";
  const d = new Date(s);
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

export default function OrdersPage() {
  const { data, loading, error } = useQuery(GET_ORDERS, { fetchPolicy: "network-only" });
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="p-6">
        <Loader className="animate-spin" />
      </div>
    );
  }
  if (error) return <p className="p-6 text-red-500">Error: {error.message}</p>;

  const orders = data?.orders ?? [];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-10">My Orders</h1>

      {orders.length === 0 ? (
        <div className="space-y-6">
          <p>You haven’t placed any orders yet.</p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-2 bg-blue-400 text-white rounded-lg hover:bg-blue-500 text-sm"
          >
            Back to Home
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {orders.map((order) => {
            const isDispatched = order.fulfillmentStatus === "dispatched";

            return (
              <div key={order._id} className="border rounded-lg p-4 shadow-sm bg-white">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="font-semibold">Order #{order._id.slice(-6)}</div>
                  <div className="text-sm text-gray-600">{formatDate(order.createdAt)}</div>
                </div>

                {/* Items */}
                <div className="mt-6 space-y-3">
                  {order.products.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {item.product?.image && (
                          <img
                            src={item.product.image}
                            alt={item.product.name}
                            className="h-12 w-12 rounded object-cover"
                          />
                        )}
                        <div>
                          <div className="font-medium">{item.product?.name}</div>
                          <div className="text-sm text-gray-600">Qty: {item.quantity}</div>
                        </div>
                      </div>
                      <div className="text-sm">
                        {sgd((item.price || 0) * (item.quantity || 0))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Fulfillment status + dates */}
                <div className="mt-6 text-sm text-gray-700">
                  <div>
                    Fulfillment:{" "}
                    <b className="capitalize">{order.fulfillmentStatus || "pending"}</b>
                  </div>
                  {isDispatched && (
                    <div>
                      Dispatched: {formatDate(order.dispatchedAt)} · ETA:{" "}
                      {formatDate(order.estimatedDeliveryDate)}
                    </div>
                  )}
                </div>

                {/* Charges + total */}
                <div className="mt-6 border-t pt-3 text-sm text-gray-700 space-y-1">
                  <div className="flex items-center justify-between">
                    <span>Delivery</span>
                    <span>{sgd(order.shippingFee || 0)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>GST</span>
                    <span>{sgd(order.gst || 0)}</span>
                  </div>
                  <div className="flex items-center justify-between font-semibold pt-2">
                    <span>Total</span>
                    <span>{sgd(order.totalAmount)}</span>
                  </div>
                </div>

                {/* Payment info */}
                <div className="mt-3 text-sm text-gray-700">
                  Payment: <span className="font-medium">{order.paymentStatus}</span>
                  {order.paymentMethod && (
                    <span className="text-gray-500"> • {order.paymentMethod}</span>
                  )}
                </div>
              </div>
            );
          })}

          <div className="mt-6">
            <button
              onClick={() => navigate("/home")}
              className="px-6 py-2 bg-blue-400 text-white rounded-lg hover:bg-blue-500 text-sm"
            >
              Back to Home
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
