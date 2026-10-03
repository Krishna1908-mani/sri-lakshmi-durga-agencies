import { Link, useNavigate } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import { 
  Package, 
  ShoppingBag, 
  IndianRupee, 
  Clock, 
  AlertTriangle, 
  PlusCircle, 
  BarChart3, 
  Tag, 
  ArrowRight,
  Sparkles
} from "lucide-react";
import API from "../api/axios";
import AdminNavbar from "./AdminNavbar";

function AdminDashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("adminToken");

  const [stats, setStats] = useState({
    products: 0,
    orders: 0,
    sales: 0,
    pending: 0,
  });

  const [lowStockProducts, setLowStockProducts] = useState([]);

  const fetchStats = useCallback(async () => {
    try {
      const productsRes = await API.get("/products");

      const ordersRes = await API.get("/orders", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const products = productsRes.data.products || [];
      const orders = ordersRes.data.orders || [];

      const totalSales = orders
        .filter(
          (order) =>
            order.orderStatus !== "Cancelled" &&
            order.orderStatus !== "Returned"
        )
        .reduce((sum, order) => sum + Number(order.finalAmount || 0), 0);

      const pendingOrders = orders.filter(
        (order) =>
          order.orderStatus !== "Delivered" &&
          order.orderStatus !== "Cancelled" &&
          order.orderStatus !== "Returned"
      ).length;

      const lowStock = products.filter(
        (product) => Number(product.stock || 0) <= 5
      );

      setStats({
        products: products.length,
        orders: orders.length,
        sales: totalSales,
        pending: pendingOrders,
      });

      setLowStockProducts(lowStock);
    } catch (error) {
      console.log("Dashboard error:", error);
      if (error.response?.status === 401) {
        alert("Session expired. Please login again.");
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminName");
        navigate("/admin/login");
      }
    }
  }, [token, navigate]);

  useEffect(() => {
    if (!token) {
      navigate("/admin/login");
      return;
    }

    fetchStats();
  }, [token, navigate, fetchStats]);

  const adminName = localStorage.getItem("adminName") || "Store Manager";

  return (
    <div className="admin-page-layout">
      <AdminNavbar />

      <main className="admin-main-content">
        {/* Welcome Header */}
        <div className="admin-welcome-banner">
          <div>
            <div className="welcome-tag">STORE OVERVIEW</div>
            <h1>Welcome, {adminName}</h1>
            <p>Here is what's happening with Sri Lakshmi Durga Agencies today.</p>
          </div>

          <div className="admin-welcome-actions">
            <Link to="/admin/add-product" className="primary-btn admin-top-cta">
              <PlusCircle size={16} />
              <span>Add New Product</span>
            </Link>
          </div>
        </div>

        {/* 4 Metric Stat Cards */}
        <div className="admin-metrics-grid">
          <div className="admin-stat-card card-emerald">
            <div className="stat-card-header">
              <span className="stat-card-title">Total Revenue</span>
              <div className="stat-icon-wrapper emerald">
                <IndianRupee size={20} />
              </div>
            </div>
            <div className="stat-card-body">
              <h2 className="stat-number">₹{stats.sales.toLocaleString("en-IN")}</h2>
              <span className="stat-context-pill">Confirmed Sales</span>
            </div>
          </div>

          <div className="admin-stat-card card-ruby">
            <div className="stat-card-header">
              <span className="stat-card-title">Total Orders</span>
              <div className="stat-icon-wrapper ruby">
                <ShoppingBag size={20} />
              </div>
            </div>
            <div className="stat-card-body">
              <h2 className="stat-number">{stats.orders}</h2>
              <span className="stat-context-pill">Lifetime Orders</span>
            </div>
          </div>

          <div className="admin-stat-card card-amber">
            <div className="stat-card-header">
              <span className="stat-card-title">Pending Orders</span>
              <div className="stat-icon-wrapper amber">
                <Clock size={20} />
              </div>
            </div>
            <div className="stat-card-body">
              <h2 className="stat-number">{stats.pending}</h2>
              <span className="stat-context-pill">Awaiting Dispatch</span>
            </div>
          </div>

          <div className="admin-stat-card card-sapphire">
            <div className="stat-card-header">
              <span className="stat-card-title">Live Products</span>
              <div className="stat-icon-wrapper sapphire">
                <Package size={20} />
              </div>
            </div>
            <div className="stat-card-body">
              <h2 className="stat-number">{stats.products}</h2>
              <span className="stat-context-pill">In Catalog</span>
            </div>
          </div>
        </div>

        {/* Quick Management Shortcuts */}
        <section className="admin-quick-actions-section">
          <div className="section-title-sub">
            <h2>Management Console</h2>
            <p>Direct shortcuts to manage inventory, customer orders, and discounts</p>
          </div>

          <div className="admin-shortcuts-grid">
            <Link to="/admin/products" className="shortcut-card">
              <div className="shortcut-icon emerald">
                <Package size={20} />
              </div>
              <div className="shortcut-info">
                <h3>Manage Products</h3>
                <p>Edit pricing, stock, fabrics & delete products</p>
              </div>
              <ArrowRight size={16} className="shortcut-arrow" />
            </Link>

            <Link to="/admin/orders" className="shortcut-card">
              <div className="shortcut-icon ruby">
                <ShoppingBag size={20} />
              </div>
              <div className="shortcut-info">
                <h3>Manage Orders</h3>
                <p>Update tracking IDs, status & print invoices</p>
              </div>
              <ArrowRight size={16} className="shortcut-arrow" />
            </Link>

            <Link to="/admin/coupons" className="shortcut-card">
              <div className="shortcut-icon amber">
                <Tag size={20} />
              </div>
              <div className="shortcut-info">
                <h3>Discount Coupons</h3>
                <p>Create promotional offers & percentage discounts</p>
              </div>
              <ArrowRight size={16} className="shortcut-arrow" />
            </Link>

            <Link to="/admin/reports" className="shortcut-card">
              <div className="shortcut-icon sapphire">
                <BarChart3 size={20} />
              </div>
              <div className="shortcut-info">
                <h3>Sales Analytics</h3>
                <p>Filter orders by date, method & revenue</p>
              </div>
              <ArrowRight size={16} className="shortcut-arrow" />
            </Link>
          </div>
        </section>

        {/* Low Stock Alert Section */}
        <section className="admin-section-container">
          <div className="section-title-row">
            <div className="title-with-badge">
              <div className="alert-badge-icon">
                <AlertTriangle size={18} />
              </div>
              <div>
                <h2>Low Stock Alert</h2>
                <p>Items with 5 or fewer units remaining in warehouse</p>
              </div>
            </div>

            <Link to="/admin/products" className="section-header-link">
              <span>View All Inventory</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {lowStockProducts.length === 0 ? (
            <div className="admin-empty-card">
              <Sparkles size={28} className="empty-sparkle" />
              <h3>Inventory Healthy</h3>
              <p>All catalog products currently have safe stock levels above 5 units.</p>
            </div>
          ) : (
            <div className="low-stock-grid">
              {lowStockProducts.map((product) => {
                const pId = product.id || product._id;
                return (
                  <div className="low-stock-product-card" key={pId}>
                    <img src={product.image} alt={product.name} className="low-stock-img" />

                    <div className="low-stock-details">
                      <span className="low-stock-cat">{product.category || "General"}</span>
                      <h4 className="low-stock-title">{product.name}</h4>
                      <div className="low-stock-count-row">
                        <span className="urgency-badge">
                          Only <strong>{product.stock}</strong> left in stock
                        </span>
                        <span className="low-stock-price">₹{product.price}</span>
                      </div>
                    </div>

                    <Link
                      to={`/admin/edit-product/${pId}`}
                      className="update-stock-btn"
                    >
                      <span>Update Stock</span>
                    </Link>
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

export default AdminDashboard;