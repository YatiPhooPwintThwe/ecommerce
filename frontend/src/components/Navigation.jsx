import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, User, LogOut, Package } from "lucide-react";
import toast from "react-hot-toast";
import { useQuery } from "@apollo/client";
import { GET_CART_PRODUCTS } from "../graphql/query/cart.query.js";
import miniteen from "../assets/miniteen.png";

export default function Navigation() {
  const navigate = useNavigate();

  const { data } = useQuery(GET_CART_PRODUCTS, { fetchPolicy: "cache-and-network" });
  const cartCount = (data?.cartProducts ?? []).reduce((a, i) => a + (i.quantity || 0), 0);

  const goCart = () => navigate("/cart");
  const goOrders = () => navigate("/orders");
  const goUpdateInfo = () => navigate("/account/update");
  const handleLogout = () => {
    toast.success("Logged out");
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b">
      {/* container + responsive height + space-between to avoid overlap */}
      <div className="mx-auto max-w-6xl px-3 sm:px-4 h-14 sm:h-20 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center min-w-0" aria-label="Home">
          <img
            src={miniteen}
            alt="MiniCart mascots"
            className="h-8 w-auto object-contain sm:h-12"
          />
          {/* Hide brand text on small screens to save space */}
          <span className="ml-2 hidden sm:inline text-[28px] font-extrabold tracking-tight text-black">
            MiniCart
          </span>
        </Link>

        {/* Right controls */}
        <div className="flex items-center gap-2 sm:gap-6 shrink-0">
          {/* Orders */}
          <button
            onClick={goOrders}
            className="relative inline-flex items-center justify-center rounded-md border px-2.5 py-1.5 sm:px-3 sm:py-2 hover:bg-gray-50"
            aria-label="View Orders"
            title="Orders"
          >
            <Package className="h-5 w-5" />
          </button>

          {/* Cart */}
          <button
            onClick={goCart}
            className="relative inline-flex items-center justify-center rounded-md border px-2.5 py-1.5 sm:px-3 sm:py-2 hover:bg-gray-50"
            aria-label="Open cart"
            title="Cart"
          >
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full text-[11px] leading-[18px] px-1 text-white bg-black text-center">
                {cartCount}
              </span>
            )}
          </button>

          {/* Account */}
          <button
            onClick={goUpdateInfo}
            className="inline-flex items-center justify-center rounded-md border px-2.5 py-1.5 sm:px-3 sm:py-2 hover:bg-gray-50"
            aria-label="Account & Settings"
            title="Account"
          >
            <User className="h-5 w-5" />
          </button>

          {/* Logout (icon-only on mobile) */}
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-md border border-pink-300 px-2.5 py-1.5 sm:px-3 sm:py-2 text-sm hover:bg-pink-50"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
