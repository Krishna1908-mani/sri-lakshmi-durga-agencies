import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { CartProvider } from "./context/CartContext";
import { WishlistProvider } from "./context/WishlistContext";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import WhatsAppButton from "./components/WhatsAppButton";

import Home from "./pages/Home";
import Shop from "./pages/Shop";
import ProductDetails from "./pages/ProductDetails";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import TrackOrder from "./pages/TrackOrder";
import OrderSuccess from "./pages/OrderSuccess";
import CustomerLogin from "./pages/CustomerLogin";
import Register from "./pages/Register";
import MyOrders from "./pages/MyOrders";
import Wishlist from "./pages/Wishlist";
import RecentlyViewed from "./pages/RecentlyViewed";
import Profile from "./pages/Profile";

import AdminLogin from "./admin/AdminLogin";
import AdminDashboard from "./admin/AdminDashboard";
import AdminProducts from "./admin/AdminProducts";
import AddProduct from "./admin/AddProduct";
import EditProduct from "./admin/EditProduct";
import AdminOrders from "./admin/AdminOrders";
import AdminCoupons from "./admin/AdminCoupons";
import AdminReports from "./admin/AdminReports";
import AdminInvoice from "./admin/AdminInvoice";
import AdminShippingLabel from "./admin/AdminShippingLabel";
import AdminBanner from "./admin/AdminBanner";
import AdminProtected from "./admin/AdminProtected";
import AdminSettings from "./admin/AdminSettings";
import ForgotPassword from "./pages/ForgotPassword";
import "./App.css";

function AppLayout() {
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith("/admin");

  return (
    <>
      {!isAdminPage && <Navbar />}

      <Routes>
        {/* Customer Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/product/:id" element={<ProductDetails />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/track-order" element={<TrackOrder />} />
        <Route path="/order-success" element={<OrderSuccess />} />
        <Route path="/login" element={<CustomerLogin />} />
        <Route path="/register" element={<Register />} />
        <Route path="/my-orders" element={<MyOrders />} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/recently-viewed" element={<RecentlyViewed />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />

        <Route
          path="/admin/dashboard"
          element={
            <AdminProtected>
              <AdminDashboard />
            </AdminProtected>
          }
        />

        <Route
          path="/admin/products"
          element={
            <AdminProtected>
              <AdminProducts />
            </AdminProtected>
          }
        />

        <Route
          path="/admin/add-product"
          element={
            <AdminProtected>
              <AddProduct />
            </AdminProtected>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <AdminProtected>
              <AdminSettings />
            </AdminProtected>
          }
        />

        <Route
          path="/admin/edit-product/:id"
          element={
            <AdminProtected>
              <EditProduct />
            </AdminProtected>
          }
        />

        <Route
          path="/admin/orders"
          element={
            <AdminProtected>
              <AdminOrders />
            </AdminProtected>
          }
        />

        <Route
          path="/admin/coupons"
          element={
            <AdminProtected>
              <AdminCoupons />
            </AdminProtected>
          }
        />

        <Route
          path="/admin/reports"
          element={
            <AdminProtected>
              <AdminReports />
            </AdminProtected>
          }
        />

        <Route
          path="/admin/invoice/:id"
          element={
            <AdminProtected>
              <AdminInvoice />
            </AdminProtected>
          }
        />

        <Route
          path="/admin/shipping-label/:id"
          element={
            <AdminProtected>
              <AdminShippingLabel />
            </AdminProtected>
          }
        />

        <Route
          path="/admin/banner"
          element={
            <AdminProtected>
              <AdminBanner />
            </AdminProtected>
          }
        />
      </Routes>

      {!isAdminPage && <WhatsAppButton />}
      {!isAdminPage && <Footer />}
    </>
  );
}

function App() {
  return (
    <CartProvider>
      <WishlistProvider>
        <BrowserRouter>
          <AppLayout />
        </BrowserRouter>
      </WishlistProvider>
    </CartProvider>
  );
}

export default App;