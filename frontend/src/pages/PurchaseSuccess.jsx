// src/pages/PurchaseSuccess.jsx
import { useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useMutation, useApolloClient } from "@apollo/client";
import toast from "react-hot-toast";
import { CONFIRM_ORDER } from "../graphql/mutation/order.mutation.js";
import { GET_CART_PRODUCTS } from "../graphql/query/cart.query.js";
import { GET_MY_COUPON } from "../graphql/query/coupon.query.js";
import { GET_PRODUCTS } from "../graphql/query/product.query.js";  // ⬅️ add this

export default function PurchaseSuccess() {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const navigate = useNavigate();
  const client = useApolloClient();

  const fired = useRef(false);

  const [confirm, { loading, error }] = useMutation(CONFIRM_ORDER, {
    // Make the UI reflect new stock + empty cart immediately
    refetchQueries: [{ query: GET_PRODUCTS }, { query: GET_CART_PRODUCTS }],
    awaitRefetchQueries: true,
    onCompleted: () => {
      try {
        // clear local caches explicitly (optional, extra-sure)
        client.writeQuery({ query: GET_CART_PRODUCTS, data: { cartProducts: [] } });
        client.writeQuery({ query: GET_MY_COUPON, data: { myCoupon: null } });
      } catch (err) {
        console.error("Failed to clear cart/coupon cache:", err);
      }
      toast.success("Payment confirmed!");
      navigate("/orders");
    },
    onError: (e) => toast.error(e.message),
  });

  useEffect(() => {
    if (!sessionId || fired.current) return;
    fired.current = true;
    confirm({ variables: { sessionId } });
  }, [sessionId, confirm]);

  if (!sessionId) return <div className="p-6">Missing session id.</div>;
  if (loading) return <div className="p-6">Finalizing your order…</div>;
  if (error) return <div className="p-6 text-red-600">{error.message}</div>;
  return <div className="p-6">Done.</div>;
}
