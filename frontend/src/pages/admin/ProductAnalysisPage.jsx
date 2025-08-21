// src/pages/admin/ProductAnalysisPage.jsx
import { useNavigate } from "react-router-dom";
import { useQuery } from "@apollo/client";
import { GET_PRODUCTS } from "../../graphql/query/product.query.js";

const sgd = (n) =>
  new Intl.NumberFormat("en-SG", { style: "currency", currency: "SGD" }).format(
    Number(n || 0)
  );

export default function ProductAnalysisPage() {
  const navigate = useNavigate();

  // pulls _id, name, image, price, category, sold (via your Product fragment)
  const { data, loading, error } = useQuery(GET_PRODUCTS, {
    fetchPolicy: "cache-and-network",
  });

  const rows = (data?.products ?? [])
    .slice()
    .sort((a, b) => (b.sold ?? 0) - (a.sold ?? 0));

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-semibold">Product Analysis</h1>
          <button
            onClick={() => navigate("/admin/dashboard")}
            className="rounded-xl border bg-white px-4 py-2 text-sm font-medium hover:shadow"
          >
            Back to Dashboard
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Failed to load products. {error.message}
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
          <div className="px-5 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">All Products</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="px-6 py-3 font-medium text-gray-600">Product</th>
                  <th className="px-6 py-3 font-medium text-gray-600">Price</th>
                  <th className="px-6 py-3 font-medium text-gray-600">Category</th>
                  <th className="px-6 py-3 font-medium text-gray-600 text-center">Units Sold</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  <tr>
                    <td className="px-6 py-4" colSpan={4}>
                      Loading…
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td className="px-6 py-6 text-gray-600" colSpan={4}>
                      No products yet.
                    </td>
                  </tr>
                ) : (
                  rows.map((p) => (
                    <tr key={p._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.image || "https://via.placeholder.com/80x80?text=No+Image"}
                            alt={p.name}
                            className="h-12 w-12 rounded object-cover"
                          />
                          <div className="font-medium text-gray-900">{p.name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">{sgd(p.price)}</td>
                      <td className="px-6 py-4">{p.category || "-"}</td>
                      <td className="px-6 py-4 font-semibold text-center tabular-nums">{p.sold ?? 0}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="pt-4">
          <button
            onClick={() => navigate("/admin/dashboard")}
            className="px-6 py-2 bg-blue-400 text-white rounded-lg hover:bg-blue-500 text-sm shadow"
          >
            Back to Dashboard
          </button>
        </div>
      </main>
    </div>
  );
}
