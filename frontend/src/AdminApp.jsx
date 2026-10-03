import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

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
import AdminSettings from "./admin/AdminSettings";
import AdminProtected from "./admin/AdminProtected";

import "./App.css";

/**
 * ============================================================================
 * SRI LAKSHMI DURGA AGENCIES — ADMINISTRATOR APPLICATION SHELL
 * Subdomain: admin.<domain>.com
 * Strictly isolated management console for store administrators.
 * ============================================================================
 */
function AdminApp() {
  return (
    <BrowserRouter>
      <div className="admin-portal-root">
        <Routes>
          {/* Admin Login Paths */}
          <Route path="/login" element={<AdminLogin />} />
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Root Redirect to Dashboard */}
          <Route
            path="/"
            element={
              <AdminProtected>
                <Navigate to="/dashboard" replace />
              </AdminProtected>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminProtected>
                <Navigate to="/dashboard" replace />
              </AdminProtected>
            }
          />

          {/* Admin Protected Dashboard Routes (Subdomain Root Paths) */}
          <Route
            path="/dashboard"
            element={
              <AdminProtected>
                <AdminDashboard />
              </AdminProtected>
            }
          />
          <Route
            path="/products"
            element={
              <AdminProtected>
                <AdminProducts />
              </AdminProtected>
            }
          />
          <Route
            path="/add-product"
            element={
              <AdminProtected>
                <AddProduct />
              </AdminProtected>
            }
          />
          <Route
            path="/edit-product/:id"
            element={
              <AdminProtected>
                <EditProduct />
              </AdminProtected>
            }
          />
          <Route
            path="/orders"
            element={
              <AdminProtected>
                <AdminOrders />
              </AdminProtected>
            }
          />
          <Route
            path="/coupons"
            element={
              <AdminProtected>
                <AdminCoupons />
              </AdminProtected>
            }
          />
          <Route
            path="/reports"
            element={
              <AdminProtected>
                <AdminReports />
              </AdminProtected>
            }
          />
          <Route
            path="/invoice/:id"
            element={
              <AdminProtected>
                <AdminInvoice />
              </AdminProtected>
            }
          />
          <Route
            path="/shipping-label/:id"
            element={
              <AdminProtected>
                <AdminShippingLabel />
              </AdminProtected>
            }
          />
          <Route
            path="/banner"
            element={
              <AdminProtected>
                <AdminBanner />
              </AdminProtected>
            }
          />
          <Route
            path="/settings"
            element={
              <AdminProtected>
                <AdminSettings />
              </AdminProtected>
            }
          />

          {/* Admin Protected Dashboard Routes (Prefixed /admin/* Paths for backwards compatibility) */}
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
          <Route
            path="/admin/settings"
            element={
              <AdminProtected>
                <AdminSettings />
              </AdminProtected>
            }
          />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default AdminApp;
