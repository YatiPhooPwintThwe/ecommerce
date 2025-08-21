import { useQuery } from "@apollo/client";
import { GET_ORDERS } from "../graphql/query/order.query.js";
import { Loader } from "lucide-react";
import { useNavigate } from "react-router-dom";

const sgd = (n) =>
  new Intl.NumberFormat("en-SG", { style: "currency", currency: "SGD" }).format(
    Number(n || 0)
  );

export default function OrdersPage() {
  const { data, loading, error } = useQuery(GET_ORDERS, {
    fetchPolicy: "network-only",
  });
  const navigate = useNavigate();
  if (loading)
    return (
      <div className="p-4">
        <Loader className="animate-spin" />
      </div>
    );
  if (error) return <p className="text-red-500">Error: {error.message}</p>;

  const orders = data?.orders ?? [];
  const formatDate = (dateString) => {
    if (!dateString) return "Date not available";
    const date = new Date(dateString);
    return isNaN(date.getTime())
      ? "Date not available"
      : date.toLocaleString("en-SG", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
  };

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
          {orders.map((order) => (
            <div
              key={order._id}
              className="border rounded-lg p-4 shadow-sm bg-white"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="font-semibold">
                  Order #{order._id.slice(-6)}
                </div>
                <div className="text-sm text-gray-600">
                  {formatDate(order.createdAt)}
                </div>
              </div>

              <div className="mt-6  space-y-3">
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
                        <div className="text-sm text-gray-600">
                          Qty: {item.quantity}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm">
                      {sgd((item.price || 0) * (item.quantity || 0))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-10 flex items-center justify-between border-t pt-3">
                <div className="text-sm">
                  Status:{" "}
                  <span className="font-medium">{order.paymentStatus}</span>
                  {order.paymentMethod && (
                    <span className="text-gray-500">
                      {" "}
                      • {order.paymentMethod}
                    </span>
                  )}
                </div>
                <div className="text-base font-semibold">
                  {sgd(order.totalAmount)}
                </div>
              </div>
            </div>
          ))}
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
