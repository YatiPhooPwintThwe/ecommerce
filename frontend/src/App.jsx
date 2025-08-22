// App.jsx
import { Route, Routes, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import HomePage from "./pages/HomePage.jsx";
import SignUpPage from "./pages/SignUpPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import EmailVerificationPage from "./pages/EmailVerificationPage.jsx";
import ResetPasswordPage from "./pages/ResetPasswordPage.jsx";
import ProductsPage from "./pages/admin/ProductsPage.jsx";
import AdminRoute from "./pages/admin/AdminRoute.jsx";
import CartPage from "./pages/CartPage.jsx";
import UpdateInfoPage from "./pages/UpdateInfoPage.jsx";
import PurchaseSuccess from "./pages/PurchaseSuccess.jsx";
import OrdersPage from "./pages/OrdersPage.jsx";
import AnalyticsTab from "./components/AnalyticsTab.jsx";
import ProductAnalysisPage from "./pages/admin/ProductAnalysisPage.jsx";
import AdminOrdersPage from "./pages/admin/AdminOrdersPage.jsx";
function App() {
  return (
    <>
      <Toaster position="top-center" />
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/verify" element={<EmailVerificationPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/account/update" element={<UpdateInfoPage />} />
        <Route path="/purchase-success" element={<PurchaseSuccess />} />
        <Route path="/orders" element={<OrdersPage />} />
        {/* admin-only */}
        <Route
          path="/admin/products"
          element={
            <AdminRoute>
              <ProductsPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            <AdminRoute>
              <AnalyticsTab />
            </AdminRoute>
          }
        />
         <Route
          path="/admin/product-analysis"
          element={
            <AdminRoute>
              <ProductAnalysisPage />
            </AdminRoute>
          }
        />
        <Route
        path="/admin/orders"
        element={
          <AdminRoute>
            <AdminOrdersPage />
          </AdminRoute>
        }
      />
        {/* optional: catch-all */}
        {/* <Route path="*" element={<HomePage />} /> */}
      </Routes>
    </>
  );
}

export default App;
