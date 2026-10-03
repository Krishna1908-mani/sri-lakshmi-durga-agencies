import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "./context/CartContext";
import { WishlistProvider } from "./context/WishlistContext";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import WhatsAppButton from "./components/WhatsAppButton";
import CustomerProtected from "./components/CustomerProtected";

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
import ForgotPassword from "./pages/ForgotPassword";

import "./App.css";

/**
 * ============================================================================
 * SRI LAKSHMI DURGA AGENCIES — CUSTOMER APPLICATION SHELL
 * Subdomain: app.<domain>.com
 * ZERO administrative routes, components, or source code are bundled here.
 * ============================================================================
 */
function CustomerApp() {
  return (
    <CartProvider>
      <WishlistProvider>
        <BrowserRouter>
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/product/:id" element={<ProductDetails />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/track-order" element={<TrackOrder />} />
            <Route path="/order-success" element={<OrderSuccess />} />
            <Route path="/login" element={<CustomerLogin />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route
              path="/my-orders"
              element={
                <CustomerProtected>
                  <MyOrders />
                </CustomerProtected>
              }
            />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/recently-viewed" element={<RecentlyViewed />} />
            <Route
              path="/profile"
              element={
                <CustomerProtected>
                  <Profile />
                </CustomerProtected>
              }
            />
            {/* Catch-all customer redirect */}
            <Route path="*" element={<Home />} />
          </Routes>
          <WhatsAppButton />
          <Footer />
        </BrowserRouter>
      </WishlistProvider>
    </CartProvider>
  );
}

export default CustomerApp;
