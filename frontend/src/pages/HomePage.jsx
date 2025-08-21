import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import toast from "react-hot-toast";
import Navigation from "../components/Navigation.jsx";
import { GET_PRODUCTS } from "../graphql/query/product.query.js";
import { ADD_TO_CART } from "../graphql/mutation/cart.mutation.js";
import { GET_CART_PRODUCTS } from "../graphql/query/cart.query.js";

const sgd = (n) =>
  new Intl.NumberFormat("en-SG", { style: "currency", currency: "SGD" }).format(
    Number(n || 0)
  );

export default function HomePage() {
  const { data, loading } = useQuery(GET_PRODUCTS);
  const products = data?.products ?? [];

  // server-side add-to-cart
  const [mutateAddToCart] = useMutation(ADD_TO_CART, {
    refetchQueries: [{ query: GET_CART_PRODUCTS }],
  });

  // search
  const [search, setSearch] = useState("");
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearch((s) => s.trim());
  };
  const filteredProducts = products.filter((p) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      p.name?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q)
    );
  });

  // quantity per product (UI only)
  const [qtyById, setQtyById] = useState({});
  const dec = (id) =>
    setQtyById((m) => ({ ...m, [id]: Math.max(0, (m[id] || 0) - 1) }));
  const inc = (id, max) =>
    setQtyById((m) => ({ ...m, [id]: Math.min(max, (m[id] || 0) + 1) }));

  const handleAdd = async (product, qty) => {
    if (!qty || qty < 1) return;
    try {
      // Backend increments by 1, so call it 'qty' times
      for (let i = 0; i < qty; i++) {
        await mutateAddToCart({ variables: { productId: product._id } });
      }
      toast.success(`Added ${qty} × “${product.name}” to cart`);
      setQtyById((m) => ({ ...m, [product._id]: 0 }));
    } catch (err) {
      console.error(err);
      toast.error("Could not add to cart");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Products</h1>
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="mt-8 mb-8 flex items-center gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or category…"
            className="flex-1 max-w-3xl h-12 border rounded-lg px-4 text-base"
          />
          <button type="submit" className="h-12 px-5 rounded-lg border text-sm font-medium bg-white">
            Search
          </button>
        </form>

        {/* Results */}
        <section className="mt-10">
          {loading ? (
            <div className="text-sm text-gray-600">Loading…</div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-sm text-gray-600">
              {products.length === 0 ? (
                <>No products yet. Please check back later.</>
              ) : (
                <>No matches for “{search}”.</>
              )}
            </div>
          ) : (
            <div className="grid gap-x-10 gap-y-24 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProducts.map((p) => {
                const stock = typeof p.stock === "number" ? p.stock : Infinity;
                const SOLD_OUT = stock !== Infinity && stock <= 0;
                const qty = qtyById[p._id] ?? 0;
                const maxSelectable = stock === Infinity ? 99 : Math.max(0, stock);

                return (
                  <div key={p._id} className="rounded-xl border bg-white overflow-hidden shadow-sm">
                    <div className="aspect-[4/3] bg-gray-100">
                      <img
                        src={p.image || "https://via.placeholder.com/640x480?text=No+Image"}
                        alt={p.name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </div>

                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-semibold line-clamp-1">{p.name}</h3>
                        <span className="shrink-0 text-lg font-bold text-gray-900 sm:text-xl">
                          {sgd(p.price)}
                        </span>
                      </div>

                      <div className="mt-1 text-xs text-gray-600 line-clamp-1">{p.category}</div>
                      <p className="mt-2 text-sm text-gray-700 whitespace-pre-line">{p.description}</p>

                      {stock !== Infinity && (
                        <div className="mt-1 text-xs text-red-600">
                          {SOLD_OUT ? "Sold out" : `${stock} in stock`}
                        </div>
                      )}

                      <div className="mt-4 flex items-center justify-between">
                        {SOLD_OUT ? (
                          <span className="px-3 py-1.5 text-sm rounded-md bg-gray-200 text-gray-600 select-none">
                            Sold out
                          </span>
                        ) : (
                          <>
                            <div className="inline-flex items-center rounded-md border">
                              <button
                                type="button"
                                onClick={() => dec(p._id)}
                                className="px-3 py-1.5 text-sm disabled:opacity-40"
                                disabled={qty <= 0}
                                aria-label={`Decrease ${p.name} quantity`}
                              >
                                –
                              </button>
                              <input
                                readOnly
                                value={qty}
                                className="w-12 text-center text-sm border-l border-r py-1.5"
                                aria-label={`${p.name} quantity`}
                              />
                              <button
                                type="button"
                                onClick={() => inc(p._id, maxSelectable)}
                                className="px-3 py-1.5 text-sm disabled:opacity-40"
                                disabled={qty >= maxSelectable}
                                aria-label={`Increase ${p.name} quantity`}
                              >
                                +
                              </button>
                            </div>

                            <button
                              onClick={() => handleAdd(p, qty)}
                              disabled={qty < 1}
                              className="inline-flex items-center gap-2 rounded-md bg-blue-400 text-white px-3 py-1.5 text-sm disabled:opacity-60"
                            >
                              Add to cart
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
