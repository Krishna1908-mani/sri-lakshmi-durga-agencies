import { Link, useNavigate } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import API from "../api/axios";

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

  const logout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminName");
    navigate("/admin/login");
  };

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
      alert("Failed to load dashboard. Please login again.");
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminName");
      navigate("/admin/login");
    }
  }, [token, navigate]);

  useEffect(() => {
    if (!token) {
      navigate("/admin/login");
      return;
    }

    fetchStats();
  }, [token, navigate, fetchStats]);

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p>Welcome, {localStorage.getItem("adminName") || "Admin"}</p>
        </div>

        <button onClick={logout} className="logout-btn">
          Logout
        </button>
      </div>

      <div className="admin-stats">
        <div>
          <h2>{stats.products}</h2>
          <p>Total Products</p>
        </div>

        <div>
          <h2>{stats.orders}</h2>
          <p>Total Orders</p>
        </div>

        <div>
          <h2>₹{stats.sales}</h2>
          <p>Total Sales</p>
        </div>

        <div>
          <h2>{stats.pending}</h2>
          <p>Pending Orders</p>
        </div>
      </div>

      <div className="admin-menu">
        <Link to="/admin/add-product">Add Product</Link>
        <Link to="/admin/products">Manage Products</Link>
        <Link to="/admin/orders">Manage Orders</Link>
        <Link to="/admin/coupons">Manage Coupons</Link>
        <Link to="/admin/reports">Sales Report</Link>
        <Link to="/admin/banner">Home Banner</Link>
        <Link to="/admin/settings">Admin Settings</Link>
        <Link to="/shop">View Store</Link>
      </div>

      <div className="low-stock-section">
        <div className="low-stock-header">
          <h2>Low Stock Alert</h2>
          <p>Products with stock 5 or below</p>
        </div>

        {lowStockProducts.length === 0 ? (
          <div className="low-stock-empty">
            <h3>No low stock products</h3>
            <p>All products have enough stock.</p>
          </div>
        ) : (
          <div className="low-stock-list">
            {lowStockProducts.map((product) => (
              <div className="low-stock-card" key={product._id}>
                <img src={product.image} alt={product.name} />

                <div>
                  <h3>{product.name}</h3>
                  <p>{product.category}</p>
                  <strong>Only {product.stock} left</strong>
                </div>

                <Link
                  to={`/admin/edit-product/${product._id}`}
                  className="edit-btn"
                >
                  Update Stock
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;