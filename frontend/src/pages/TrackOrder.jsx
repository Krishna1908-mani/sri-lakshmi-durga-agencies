import { useState } from "react";
import { 
  Compass, 
  Search, 
  Package, 
  CheckCircle2, 
  Clock, 
  Truck, 
  MapPin, 
  MessageCircle,
  AlertCircle
} from "lucide-react";
import API from "../api/axios";

const timelineStages = [
  "Order Placed",
  "Confirmed",
  "Packed",
  "Shipped",
  "Out for Delivery",
  "Delivered"
];

function TrackOrder() {
  const [orderId, setOrderId] = useState("");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const trackOrder = async (e) => {
    e.preventDefault();

    if (!orderId.trim()) {
      alert("Please enter a valid Order ID");
      return;
    }

    try {
      setLoading(true);
      setSearched(true);
      const res = await API.get(`/orders/track/${orderId.trim()}`);
      setOrder(res.data.order);
    } catch (error) {
      console.log("Track error:", error);
      alert("Order not found. Please verify your Order ID and try again.");
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const getStageIndex = (currentStatus) => {
    return timelineStages.indexOf(currentStatus);
  };

  const currentStageIndex = order ? getStageIndex(order.orderStatus) : -1;
  const isCancelled = order && (order.orderStatus === "Cancelled" || order.orderStatus === "Returned");

  return (
    <div className="page track-order-page">
      <div className="track-hero-header">
        <div className="track-hero-icon-box">
          <Compass size={28} />
        </div>
        <h1>Track Your Delivery</h1>
        <p>Enter your unique Order ID to view real-time shipping updates and package status</p>
      </div>

      <div className="track-search-card">
        <form className="track-search-form" onSubmit={trackOrder}>
          <div className="track-input-wrap">
            <Search size={18} className="track-search-icon" />
            <input
              type="text"
              placeholder="e.g. ORD-1740839210 or your Order ID"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              className="track-input"
              required
            />
          </div>

          <button type="submit" className="primary-btn track-submit-btn" disabled={loading}>
            {loading ? (
              <span>Locating Order...</span>
            ) : (
              <>
                <Search size={16} />
                <span>Track Order</span>
              </>
            )}
          </button>
        </form>
      </div>

      {order && (
        <div className="tracking-results-card">
          <div className="tracking-card-header">
            <div>
              <span className="tracking-label">ORDER DETAILS</span>
              <h2>{order.orderId}</h2>
            </div>
            <div className="tracking-header-status">
              <span className={`tracking-status-pill ${isCancelled ? "cancelled" : "active"}`}>
                {order.orderStatus}
              </span>
            </div>
          </div>

          {/* Stepped Timeline Progress */}
          {!isCancelled ? (
            <div className="tracking-stepper-box">
              <div className="stepper-track-line">
                <div 
                  className="stepper-track-active-fill"
                  style={{ 
                    width: currentStageIndex >= 0 
                      ? `${(currentStageIndex / (timelineStages.length - 1)) * 100}%` 
                      : "0%" 
                  }}
                ></div>
              </div>

              <div className="stepper-stages-row">
                {timelineStages.map((stage, idx) => {
                  const isCompleted = idx <= currentStageIndex;
                  const isCurrent = idx === currentStageIndex;

                  return (
                    <div 
                      key={stage} 
                      className={`stepper-stage-node ${isCompleted ? "completed" : ""} ${isCurrent ? "current" : ""}`}
                    >
                      <div className="node-circle">
                        {isCompleted ? <CheckCircle2 size={16} /> : <div className="node-dot"></div>}
                      </div>
                      <span className="node-title">{stage}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="order-cancelled-notice">
              <AlertCircle size={20} />
              <span>This order has been marked as <strong>{order.orderStatus}</strong>.</span>
            </div>
          )}

          {/* Key Shipping Attributes */}
          <div className="tracking-attributes-grid">
            <div className="tracking-attr-item">
              <span className="attr-title">Tracking Number / AWB</span>
              <strong className="attr-value">
                {order.trackingId ? order.trackingId : "Pending dispatch from warehouse"}
              </strong>
            </div>

            <div className="tracking-attr-item">
              <span className="attr-title">Payment Method</span>
              <strong className="attr-value">{order.paymentMethod} ({order.paymentStatus})</strong>
            </div>

            <div className="tracking-attr-item">
              <span className="attr-title">Total Amount</span>
              <strong className="attr-value">₹{order.finalAmount?.toLocaleString("en-IN")}</strong>
            </div>

            <div className="tracking-attr-item">
              <span className="attr-title">Customer Contact</span>
              <strong className="attr-value">{order.customer?.name} ({order.customer?.mobile})</strong>
            </div>
          </div>

          {/* WhatsApp Support Assistance */}
          <div className="tracking-support-banner">
            <div className="support-banner-text">
              <p>Have any questions regarding dispatch or delivery updates?</p>
              <span>Our team is available on WhatsApp to assist you directly.</span>
            </div>
            <a
              href={`https://wa.me/919949677382?text=${encodeURIComponent(`Hi, I need assistance with my Order ID: ${order.orderId}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="tracking-whatsapp-btn"
            >
              <MessageCircle size={16} />
              <span>Ask on WhatsApp</span>
            </a>
          </div>
        </div>
      )}

      {searched && !order && !loading && (
        <div className="track-not-found-card">
          <AlertCircle size={36} className="not-found-icon" />
          <h3>No Order Found</h3>
          <p>We couldn't locate an order matching that identifier. Please verify the ID sent in your confirmation SMS/email and try again.</p>
        </div>
      )}
    </div>
  );
}

export default TrackOrder;