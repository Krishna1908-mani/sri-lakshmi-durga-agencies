import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { 
  BarChart3, 
  IndianRupee, 
  Calendar, 
  Filter, 
  FileText, 
  CreditCard, 
  Banknote, 
  CheckCircle2, 
  XCircle,
  Download
} from "lucide-react";
import API from "../api/axios";
import AdminNavbar from "./AdminNavbar";

function AdminReports() {
  const token = localStorage.getItem("adminToken");

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    paymentMethod: "ALL",
    orderStatus: "ALL",
  });

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const res = await API.get("/orders", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setOrders(res.data.orders || []);
      } catch (error) {
        console.log(error);
        alert("Failed to fetch report data");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [token]);

  const handleChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const orderDate = new Date(order.createdAt);

      const startDate = filters.startDate
        ? new Date(filters.startDate + "T00:00:00")
        : null;

      const endDate = filters.endDate
        ? new Date(filters.endDate + "T23:59:59")
        : null;

      if (startDate && orderDate < startDate) return false;
      if (endDate && orderDate > endDate) return false;

      if (
        filters.paymentMethod !== "ALL" &&
        order.paymentMethod !== filters.paymentMethod
      ) {
        return false;
      }

      if (
        filters.orderStatus !== "ALL" &&
        order.orderStatus !== filters.orderStatus
      ) {
        return false;
      }

      return true;
    });
  }, [orders, filters]);

  const reportStats = useMemo(() => {
    const validSalesOrders = filteredOrders.filter(
      (order) =>
        order.orderStatus !== "Cancelled" && order.orderStatus !== "Returned"
    );

    const totalSales = validSalesOrders.reduce(
      (sum, order) => sum + Number(order.finalAmount || 0),
      0
    );

    const codSales = validSalesOrders
      .filter((order) => order.paymentMethod === "COD")
      .reduce((sum, order) => sum + Number(order.finalAmount || 0), 0);

    const onlineSales = validSalesOrders
      .filter((order) => order.paymentMethod === "ONLINE")
      .reduce((sum, order) => sum + Number(order.finalAmount || 0), 0);

    const deliveredOrders = filteredOrders.filter(
      (order) => order.orderStatus === "Delivered"
    ).length;

    const cancelledOrders = filteredOrders.filter(
      (order) => order.orderStatus === "Cancelled"
    ).length;

    return {
      totalSales,
      codSales,
      onlineSales,
      totalOrders: filteredOrders.length,
      deliveredOrders,
      cancelledOrders,
    };
  }, [filteredOrders]);

  const printReport = () => {
    window.print();
  };

  return (
    <div className="admin-page-layout">
      <AdminNavbar />

      <main className="admin-main-content">
        <div className="admin-page-top-bar">
          <div>
            <h1>Sales & Performance Analytics</h1>
            <p>Filter orders by date range, settlement type, and order fulfillment status</p>
          </div>

          <div className="top-bar-actions">
            <button type="button" onClick={printReport} className="secondary-btn">
              <Download size={15} />
              <span>Print Report</span>
            </button>
          </div>
        </div>

        {/* Filters Card */}
        <div className="admin-form-card filter-card">
          <div className="filter-header-row">
            <Filter size={18} />
            <h3>Filter Parameters</h3>
          </div>

          <div className="report-filters-grid">
            <div className="form-group">
              <label>From Date</label>
              <input
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={handleChange}
                className="admin-input"
              />
            </div>

            <div className="form-group">
              <label>To Date</label>
              <input
                type="date"
                name="endDate"
                value={filters.endDate}
                onChange={handleChange}
                className="admin-input"
              />
            </div>

            <div className="form-group">
              <label>Payment Method</label>
              <select
                name="paymentMethod"
                value={filters.paymentMethod}
                onChange={handleChange}
                className="admin-select"
              >
                <option value="ALL">All Payment Types</option>
                <option value="COD">Cash on Delivery (COD)</option>
                <option value="ONLINE">Online (Razorpay)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Order Status</label>
              <select
                name="orderStatus"
                value={filters.orderStatus}
                onChange={handleChange}
                className="admin-select"
              >
                <option value="ALL">All Order Statuses</option>
                <option value="Order Placed">Order Placed</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Packed">Packed</option>
                <option value="Shipped">Shipped</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* 4 Analytics Summary Cards */}
        <div className="admin-metrics-grid">
          <div className="admin-stat-card card-emerald">
            <div className="stat-card-header">
              <span className="stat-card-title">Filtered Revenue</span>
              <div className="stat-icon-wrapper emerald">
                <IndianRupee size={20} />
              </div>
            </div>
            <div className="stat-card-body">
              <h2 className="stat-number">₹{reportStats.totalSales.toLocaleString("en-IN")}</h2>
              <span className="stat-context-pill">Gross Net Revenue</span>
            </div>
          </div>

          <div className="admin-stat-card card-sapphire">
            <div className="stat-card-header">
              <span className="stat-card-title">Online Settlement</span>
              <div className="stat-icon-wrapper sapphire">
                <CreditCard size={20} />
              </div>
            </div>
            <div className="stat-card-body">
              <h2 className="stat-number">₹{reportStats.onlineSales.toLocaleString("en-IN")}</h2>
              <span className="stat-context-pill">Instant Razorpay</span>
            </div>
          </div>

          <div className="admin-stat-card card-amber">
            <div className="stat-card-header">
              <span className="stat-card-title">Cash on Delivery</span>
              <div className="stat-icon-wrapper amber">
                <Banknote size={20} />
              </div>
            </div>
            <div className="stat-card-body">
              <h2 className="stat-number">₹{reportStats.codSales.toLocaleString("en-IN")}</h2>
              <span className="stat-context-pill">COD Collections</span>
            </div>
          </div>

          <div className="admin-stat-card card-ruby">
            <div className="stat-card-header">
              <span className="stat-card-title">Delivered Orders</span>
              <div className="stat-icon-wrapper ruby">
                <CheckCircle2 size={20} />
              </div>
            </div>
            <div className="stat-card-body">
              <h2 className="stat-number">{reportStats.deliveredOrders} / {reportStats.totalOrders}</h2>
              <span className="stat-context-pill">Completed Deliveries</span>
            </div>
          </div>
        </div>

        {/* Report Orders Table */}
        <div className="admin-table-card">
          <div className="table-card-header-sub">
            <h2>Detailed Order Audit Log ({filteredOrders.length} orders)</h2>
          </div>

          <div className="table-responsive-wrapper">
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Amount</th>
                </tr>
              </thead>

              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="table-empty-cell">
                      <p>No orders matched your selected date or status filters.</p>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order._id}>
                      <td>
                        <strong>{order.orderId}</strong>
                      </td>
                      <td>
                        {new Date(order.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td>
                        <div className="customer-cell">
                          <span>{order.customer?.name}</span>
                          <span className="cell-sub">{order.customer?.mobile}</span>
                        </div>
                      </td>
                      <td>
                        <span className="table-method-pill">{order.paymentMethod}</span>
                      </td>
                      <td>
                        <span className="table-status-pill">{order.orderStatus}</span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <strong>₹{order.finalAmount?.toLocaleString("en-IN")}</strong>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AdminReports;