import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { GET_PRODUCTS } from "../graphql/query/product.query.js";
import { ADD_TO_CART } from "../graphql/mutation/cart.mutation.js";
import { GET_CART_PRODUCTS } from "../graphql/query/cart.query.js";

const sgd = (n) =>
  new Intl.NumberFormat("en-SG", { style: "currency", currency: "SGD" }).format(
    Number(n || 0)
  );

function seededShuffle(arr, seed = 1) {
  let s = Number(seed) || 1;
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) % 4294967296;
    const j = s % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function pick3(arr, seed) {
  return seededShuffle(arr, seed).slice(0, Math.min(3, arr.length));
}

export default function PeopleAlsoBought({ onAdded }) {
  const { data, loading, error } = useQuery(GET_PRODUCTS, {
    fetchPolicy: "cache-first",
  });
  const [seed, setSeed] = useState(0);

  const [addToCart] = useMutation(ADD_TO_CART, {
    refetchQueries: [{ query: GET_CART_PRODUCTS }],
    onCompleted: () => {
      setSeed((s) => s + 1);
      onAdded?.();
    },
  });

  const items = useMemo(
    () => pick3(data?.products ?? [], seed),
    [data?.products, seed]
  );

  if (loading || error || items.length === 0) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((p) => (
        <div
          key={p._id}
          className="rounded-lg border border-gray-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="aspect-[4/3] bg-gray-100">
            <img
              src={p.image || "https://via.placeholder.com/640x480?text=No+Image"}
              alt={p.name}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
          <div className="p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="font-medium truncate text-slate-900">{p.name}</p>
              <span className="font-bold text-slate-900">{sgd(p.price)}</span>
            </div>
            <button
              onClick={() => addToCart({ variables: { productId: p._id } })}
              className="mt-3 w-full rounded-md bg-blue-400 px-3 py-2 text-sm font-medium text-white hover:bg-blue-600"
            >
              Add to cart
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
