import { Minus, Plus, Trash } from "lucide-react";
import { useMutation } from "@apollo/client";
import {
  UPDATE_CART_QUANTITY,
  REMOVE_ALL_FROM_CART,
} from "../graphql/mutation/cart.mutation.js";
import { GET_CART_PRODUCTS } from "../graphql/query/cart.query.js";

export default function CartItem({ item, onChanged }) {
  const [updateQty, { loading: updating }] = useMutation(UPDATE_CART_QUANTITY, {
    refetchQueries: [{ query: GET_CART_PRODUCTS }],
    onCompleted: onChanged,
  });

  const [removeAll, { loading: removing }] = useMutation(REMOVE_ALL_FROM_CART, {
    refetchQueries: [{ query: GET_CART_PRODUCTS }],
    onCompleted: onChanged,
  });

  const dec = () =>
    updateQty({
      variables: {
        productId: item._id,
        quantity: Math.max(0, (item.quantity || 0) - 1),
      },
    });
  const inc = () =>
    updateQty({
      variables: {
        productId: item._id,
        quantity: Math.min(999, (item.quantity || 0) + 1),
      },
    });
  const remove = () => removeAll({ variables: { productId: item._id } });

  const sgd = (n) =>
    new Intl.NumberFormat("en-SG", {
      style: "currency",
      currency: "SGD",
    }).format(Number(n || 0));

  const disabled = updating || removing;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 md:p-6 shadow-sm">
      <div className="md:flex md:items-center md:justify-between md:gap-6">
        <img
          className="h-20 w-28 md:h-28 object-cover rounded-md bg-gray-100"
          src={item.image || "https://via.placeholder.com/200x200?text=No+Image"}
          alt={item.name}
        />

        <div className="w-full md:max-w-md space-y-1">
          <p className="text-base font-semibold text-slate-900">{item.name}</p>
          {item.description && (
            <p className="text-sm text-slate-600 line-clamp-2">{item.description}</p>
          )}
          <button
            onClick={remove}
            disabled={disabled}
            className="mt-2 inline-flex items-center text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
            title="Remove"
          >
            <Trash className="h-4 w-4 mr-1" /> Remove
          </button>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <button
              onClick={dec}
              disabled={disabled || item.quantity <= 0}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50"
              title="Decrease"
            >
              <Minus className="h-4 w-4 text-slate-700" />
            </button>
            <span className="w-8 text-center text-slate-900">
              {item.quantity || 0}
            </span>
            <button
              onClick={inc}
              disabled={disabled}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50"
              title="Increase"
            >
              <Plus className="h-4 w-4 text-slate-700" />
            </button>
          </div>

          <div className="text-right min-w-24">
            <p className="text-black-600 font-bold">{sgd(item.price)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
