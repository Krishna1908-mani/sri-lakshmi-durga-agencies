import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Package, 
  Compass, 
  Calendar, 
  Tag, 
  XCircle, 
  ShoppingBag
} from "lucide-react";
import API from "../api/axios";

function MyOrders() {
  const navigate = useNavigate();
  const token = localStorage.getItem("userToken");

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMyOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await API.get("/orders/my-orders", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setOrders(res.data.orders || []);
    } catch (error) {
      console.log(error);
      alert("Please login to view your orders");
      navigate("/login");
    } finally {
      setLoading(false);
    }
  }, [token, navigate]);

  const cancelOrder = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;

    try {
      await API.put(
        `/orders/${id}/cancel`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert("Order cancelled successfully");
      fetchMyOrders();
    } catch (error) {
      console.log(error);
      alert(error.response?.data?.message || "Failed to cancel order");
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    fetchMyOrders();
  }, [fetchMyOrders, navigate, token]);

  const getStatusColor = (status) => {
    switch (status) {
      case "Delivered":
        return "status-delivered";
      case "Cancelled":
      case "Returned":
        return "status-cancelled";
      case "Shipped":
      case "Out for Delivery":
        return "status-shipped";
      case "Confirmed":
      case "Packed":
        return "status-processing";
      default:
        return "status-placed";
    }
  };

  return (
    <div className="page my-orders-page">
      <div className="orders-page-header">
        <div>
          <div className="orders-title-row">
            <h1>Order History</h1>
            {orders.length > 0 && (
              <span className="orders-count-badge">{orders.length} {orders.length === 1 ? "Order" : "Orders"}</span>
            )}
          </div>
          <p className="orders-subtitle">Track, review, or manage your purchases</p>
        </div>

        <Link to="/track-order" className="track-order-top-link">
          <Compass size={16} />
          <span>Track Any Order</span>
        </Link>
      </div>

      {loading ? (
        <div className="orders-loading-state">
          <div className="loading-spinner"></div>
          <p>Retrieving your orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="orders-empty-state">
          <div className="empty-orders-illustration">
            <Package size={52} strokeWidth={1.5} className="empty-orders-icon" />
          </div>
          <h2>No Orders Found</h2>
          <p>You haven't placed any orders yet. Discover our latest collections and find something you love!</p>
          <Link to="/shop" className="primary-btn empty-orders-cta">
            <ShoppingBag size={18} />
            <span>Start Shopping</span>
          </Link>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => {
            const canCancel = ["Order Placed", "Confirmed", "Packed"].includes(
              order.orderStatus
            );
            const statusClass = getStatusColor(order.orderStatus);

            return (
              <article className="order-history-card" key={order._id}>
                {/* Header */}
                <div className="order-card-header">
                  <div className="order-id-group">
                    <span className="order-id-label">ORDER ID</span>
                    <strong className="order-id-val">{order.orderId}</strong>
                    {order.createdAt && (
                      <span className="order-date-pill">
                        <Calendar size={13} />
                        {new Date(order.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric"
                        })}
                      </span>
                    )}
                  </div>

                  <div className="order-header-right">
                    <span className={`order-status-badge ${statusClass}`}>
                      {order.orderStatus}
                    </span>
                    <strong className="order-final-amount">
                      ₹{order.finalAmount?.toLocaleString("en-IN")}
                    </strong>
                  </div>
                </div>

                {/* Tracking & Info bar */}
                <div className="order-info-strip">
                  <div className="info-strip-item">
                    <span className="info-label">Payment:</span>
                    <strong className="info-val">{order.paymentMethod} ({order.paymentStatus})</strong>
                  </div>

                  {order.trackingId && (
                    <div className="info-strip-item">
                      <span className="info-label">Tracking / AWB:</span>
                      <strong className="info-val tracking-code">{order.trackingId}</strong>
                    </div>
                  )}

                  {order.couponCode && (
                    <div className="info-strip-item coupon-item">
                      <Tag size={13} />
                      <span>{order.couponCode} (-₹{order.discountAmount})</span>
                    </div>
                  )}
                </div>

                {/* Items Box */}
                <div className="order-items-box">
                  <h4 className="items-heading">Purchased Items ({order.items.length})</h4>
                  <div className="order-items-grid">
                    {order.items.map((item, index) => (
                      <div className="order-item-chip" key={index}>
                        <div className="order-item-bullet-dot"></div>
                        <div className="order-item-desc">
                          <span className="order-item-name">{item.name}</span>
                          <span className="order-item-specs">
                            {item.selectedSize ? `Size: ${item.selectedSize} • ` : ""}
                            Qty: {item.quantity} • ₹{item.price?.toLocaleString("en-IN")}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="order-actions-bar">
                  <Link to="/track-order" className="primary-btn order-track-cta">
                    <Compass size={16} />
                    <span>Track Status</span>
                  </Link>

                  {canCancel && (
                    <button
                      type="button"
                      className="cancel-order-pill-btn"
                      onClick={() => cancelOrder(order._id)}
                    >
                      <XCircle size={15} />
                      <span>Cancel Order</span>
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default MyOrders;