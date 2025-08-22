import { useMemo } from "react";
import { useQuery, useMutation } from "@apollo/client"; // ⬅️ add useMutation
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import Navigation from "../components/Navigation.jsx";
import CartItem from "../components/CartItem.jsx";
import OrderSummary from "../components/OrderSummary.jsx";
import GiftCouponCard from "../components/GiftCouponCard.jsx";
import PeopleAlsoBought from "../components/PeopleAlsoBought.jsx";

import { GET_CART_PRODUCTS } from "../graphql/query/cart.query.js";
import { GET_MY_COUPON } from "../graphql/query/coupon.query.js";
import { GET_AUTH_USER } from "../graphql/query/user.query.js";
import { CHECKOUT } from "../graphql/mutation/order.mutation.js";

const sgd = (n) =>
  new Intl.NumberFormat("en-SG", { style: "currency", currency: "SGD" }).format(
    Number(n || 0)
  );

const EMPTY = Object.freeze([]);

export default function CartPage() {
  const navigate = useNavigate();

  const {
    data: cartData,
    loading: cartLoading,
    error: cartError,
    refetch: refetchCart,
  } = useQuery(GET_CART_PRODUCTS, { fetchPolicy: "network-only" });

  const { data: couponData, refetch: refetchCoupon } = useQuery(GET_MY_COUPON, {
    fetchPolicy: "network-only",
  });

  const { data: userData } = useQuery(GET_AUTH_USER, {
    fetchPolicy: "cache-first",
  });
  const authUser = userData?.authUser;

  const [checkoutMutation, { loading: checkoutLoading }] = useMutation(
    CHECKOUT,
    {
      onError: (e) => toast.error(e.message || "Checkout failed"),
    }
  );

  const items = useMemo(
    () => (cartData?.cartProducts ? cartData.cartProducts : EMPTY),
    [cartData?.cartProducts]
  );

  const coupon = couponData?.myCoupon ?? null;

  const subtotal = useMemo(
    () =>
      items.reduce(
        (sum, it) => sum + (Number(it.price) || 0) * (it.quantity || 0),
        0
      ),
    [items]
  );

  const discountPct = coupon?.discountPercentage || 0;
  const savings = subtotal * (discountPct / 100);
  // NEW: flat fees shown in the summary
  const delivery = 2;
  const gst = 1;
  const total = subtotal - savings + delivery + gst;

  //  Make this async and put the mutation call inside
  const handleCheckout = async () => {
    if (checkoutLoading) return; // guard double-clicks

    // require address first (your existing rule)
    const a = authUser?.address || {};
    const hasAddress = Boolean(
      a.street || a.city || a.state || a.postalCode || a.country
    );
    if (!hasAddress) {
      toast.error("Please add your address before checking out.");
      navigate("/account/update", { state: { from: "cart" } });
      return;
    }

    // Build CheckoutProductInput[] for GraphQL
    const productsInput = items.map((it) => ({
      _id: it._id,
      name: it.name || it.title || "Product",
      price: Number(it.price) || 0,
      quantity: it.quantity || 1,
      image: it.image || "",
    }));

    // Call GraphQL checkout -> get Stripe-hosted URL
    try {
      const { data } = await checkoutMutation({
        variables: {
          products: productsInput,
          couponCode: coupon?.code || null,
        },
      });
      const session = data?.checkout;
      if (!session?.url) return toast.error("Missing checkout URL");
      window.location.href = session.url;
    } catch (e) {
      toast.error(e.message || "Checkout failed");
    }
  };
  return (
    <div className="min-h-screen bg-gray-50 text-slate-900">
      <Navigation />

      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="lg:flex lg:items-start lg:gap-8">
          {/* LEFT: cart items */}
          <section className="w-full lg:max-w-3xl space-y-6">
            {cartLoading ? (
              <div className="rounded-lg border border-gray-200 bg-white p-6">
                Loading…
              </div>
            ) : cartError ? (
              <div className="rounded-lg border border-red-200 bg-red-50 text-red-800 p-6">
                Failed to load cart.
              </div>
            ) : items.length === 0 ? (
              <EmptyCart />
            ) : (
              items.map((item) => (
                <CartItem
                  key={item._id}
                  item={item}
                  onChanged={() => refetchCart()}
                />
              ))
            )}

            {items.length > 0 && (
              <div className="mt-2">
                <h3 className="text-black-600 text-xl font-semibold mb-3">
                  People also bought
                </h3>
                <PeopleAlsoBought onAdded={() => refetchCart()} />
              </div>
            )}
          </section>

          {/* RIGHT: summary + coupon */}
          {items.length > 0 && (
            <aside className="mt-8 lg:mt-0 lg:flex-1 space-y-10">
              <OrderSummary
                subtotal={subtotal}
                savings={savings}
                delivery={delivery}
                gst={gst}
                total={total}
                format={sgd}
                onCheckout={handleCheckout}
                loading={checkoutLoading} // ⬅️ now triggers the mutation + redirect
              />
              <div className="mt-2">
                <GiftCouponCard onChanged={() => refetchCoupon()} />
              </div>
            </aside>
          )}
        </div>
      </main>
    </div>
  );
}

function EmptyCart() {
  return (
    <div className="flex flex-col items-center justify-center space-y-3 py-16 rounded-lg border border-gray-200 bg-white">
      <div className="text-2xl font-semibold">Your cart is empty</div>
      <p className="text-slate-600">
        Looks like you haven’t added anything yet.
      </p>
      <a
        href="/home"
        className="mt-2 inline-flex items-center rounded-md bg-emerald-600 px-5 py-2 text-white hover:bg-emerald-500"
      >
        Start Shopping
      </a>
    </div>
  );
}
