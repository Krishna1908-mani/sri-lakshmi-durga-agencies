import { useCallback, useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { 
  ShoppingBag, 
  Search, 
  FileText, 
  MapPin, 
  Phone, 
  Mail, 
  Save, 
  Printer
} from "lucide-react";
import API from "../api/axios";
import AdminNavbar from "./AdminNavbar";

const statuses = [
  "Order Placed",
  "Confirmed",
  "Packed",
  "Shipped",
  "Out for Delivery",
  "Delivered",
  "Cancelled",
  "Returned",
];

function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("adminToken");

  const fetchOrders = useCallback(async () => {
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
      alert("Failed to fetch customer orders");
    } finally {
      setLoading(false);
    }
  }, [token]);

  const updateOrder = async (order) => {
    try {
      await API.put(
        `/orders/${order._id}/status`,
        {
          orderStatus: order.orderStatus,
          trackingId: order.trackingId,
          paymentStatus: order.paymentStatus,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert(`Order ${order.orderId} updated successfully!`);
      fetchOrders();
    } catch (error) {
      console.log(error);
      alert("Failed to update order status");
    }
  };

  const handleOrderChange = (id, field, value) => {
    setOrders((prev) =>
      prev.map((order) =>
        order._id === id ? { ...order, [field]: value } : order
      )
    );
  };

  useEffect(() => {
    if (!token) return;
    fetchOrders();
  }, [token, fetchOrders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (selectedFilter !== "ALL" && order.orderStatus !== selectedFilter) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesId = order.orderId?.toLowerCase().includes(q);
        const matchesCustomer = order.customer?.name?.toLowerCase().includes(q);
        const matchesMobile = order.customer?.mobile?.toLowerCase().includes(q);
        const matchesTracking = order.trackingId?.toLowerCase().includes(q);
        return matchesId || matchesCustomer || matchesMobile || matchesTracking;
      }
      return true;
    });
  }, [orders, selectedFilter, search]);

  return (
    <div className="admin-page-layout">
      <AdminNavbar />

      <main className="admin-main-content">
        <div className="admin-page-top-bar">
          <div>
            <h1>Manage Customer Orders</h1>
            <p>Monitor order fulfilment, update dispatch AWB tracking, and manage payment states</p>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="admin-table-controls">
          <div className="admin-search-wrapper">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search by Order ID, customer name, mobile, or tracking number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="admin-search-input"
            />
          </div>

          <div className="admin-status-tabs">
            {["ALL", "Order Placed", "Confirmed", "Packed", "Shipped", "Delivered", "Cancelled"].map((st) => (
              <button
                key={st}
                type="button"
                className={`status-filter-tab ${selectedFilter === st ? "active" : ""}`}
                onClick={() => setSelectedFilter(st)}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="admin-loading-card">
            <div className="loading-spinner"></div>
            <p>Loading orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="admin-empty-card">
            <ShoppingBag size={42} />
            <h3>No orders found</h3>
            <p>Try adjusting your status filter or search keywords.</p>
          </div>
        ) : (
          <div className="admin-orders-grid">
            {filteredOrders.map((order) => (
              <article className="admin-order-manage-card" key={order._id}>
                {/* Header */}
                <div className="order-manage-header">
                  <div className="order-manage-id-block">
                    <span className="order-id-label">ORDER ID</span>
                    <strong className="order-id-val">{order.orderId}</strong>
                    <span className="order-date-text">
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "Recent"}
                    </span>
                  </div>

                  <div className="order-manage-amount-block">
                    <span className="amount-label">Grand Total</span>
                    <strong className="amount-val">₹{order.finalAmount?.toLocaleString("en-IN")}</strong>
                  </div>
                </div>

                {/* Customer Details & Items split */}
                <div className="order-manage-body-grid">
                  <div className="order-customer-box">
                    <h4>Customer & Shipping</h4>
                    <p className="cust-name">
                      <strong>{order.customer?.name}</strong>
                    </p>
                    <p className="cust-contact">
                      <Phone size={13} /> {order.customer?.mobile}
                    </p>
                    <p className="cust-contact">
                      <Mail size={13} /> {order.customer?.email}
                    </p>
                    <p className="cust-address">
                      <MapPin size={13} /> {order.customer?.address},{" "}
                      {order.customer?.city}, {order.customer?.state} -{" "}
                      {order.customer?.pincode}
                    </p>
                  </div>

                  <div className="order-items-summary-box">
                    <h4>Order Items ({order.items.length})</h4>
                    <div className="order-items-scroll">
                      {order.items.map((item, index) => (
                        <div className="order-item-line" key={index}>
                          <span className="item-name">{item.name}</span>
                          <span className="item-spec">
                            {item.selectedSize ? `Size: ${item.selectedSize} • ` : ""}
                            Qty: {item.quantity} • ₹{item.price}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="order-cost-breakdown-sub">
                      <span>Products: ₹{order.totalAmount}</span>
                      <span>Delivery: ₹{order.deliveryCharge || 0}</span>
                      {order.couponCode && (
                        <span className="coupon-tag-sub">
                          Coupon: {order.couponCode} (-₹{order.discountAmount})
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Management Update Controls */}
                <div className="order-management-controls-bar">
                  <div className="control-group">
                    <label>Order Status</label>
                    <select
                      value={order.orderStatus}
                      onChange={(e) =>
                        handleOrderChange(order._id, "orderStatus", e.target.value)
                      }
                      className="admin-select"
                    >
                      {statuses.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="control-group">
                    <label>Payment Status</label>
                    <select
                      value={order.paymentStatus}
                      onChange={(e) =>
                        handleOrderChange(order._id, "paymentStatus", e.target.value)
                      }
                      className="admin-select"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Paid">Paid</option>
                      <option value="Failed">Failed</option>
                      <option value="Cancelled">Cancelled</option>
                      <option value="Refund Pending">Refund Pending</option>
                      <option value="Refunded">Refunded</option>
                    </select>
                  </div>

                  <div className="control-group span-tracking">
                    <label>Tracking ID / AWB Number</label>
                    <input
                      placeholder="e.g. DELHIVERY-8921734"
                      value={order.trackingId || ""}
                      onChange={(e) =>
                        handleOrderChange(order._id, "trackingId", e.target.value)
                      }
                      className="admin-input"
                    />
                  </div>

                  <div className="order-action-buttons">
                    <button
                      type="button"
                      onClick={() => updateOrder(order)}
                      className="primary-btn update-order-btn"
                    >
                      <Save size={15} />
                      <span>Save Updates</span>
                    </button>

                    <Link
                      to={`/admin/invoice/${order._id}`}
                      className="secondary-btn invoice-action-btn"
                      title="Generate official invoice"
                    >
                      <FileText size={15} />
                      <span>Invoice</span>
                    </Link>

                    <Link
                      to={`/admin/shipping-label/${order._id}`}
                      className="secondary-btn label-action-btn"
                      title="Print parcel shipping label"
                    >
                      <Printer size={15} />
                      <span>Shipping Label</span>
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default AdminOrders;