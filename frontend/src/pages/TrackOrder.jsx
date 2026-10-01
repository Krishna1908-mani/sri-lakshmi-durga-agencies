import { useState } from "react";
import API from "../api/axios";

function TrackOrder() {
  const [orderId, setOrderId] = useState("");
  const [order, setOrder] = useState(null);

  const trackOrder = async (e) => {
    e.preventDefault();

    if (!orderId) {
      alert("Enter order ID");
      return;
    }

    try {
      const res = await API.get(`/orders/track/${orderId}`);
      setOrder(res.data.order);
    } catch (error) {
      console.log("Track error:", error);
      alert("Order not found");
      setOrder(null);
    }
  };

  return (
    <div className="page track-page">
      <div className="page-header">
        <h1>Track Your Order</h1>
        <p>Enter your order ID to check delivery status</p>
      </div>

      <form className="track-box" onSubmit={trackOrder}>
        <input
          placeholder="Enter Order ID"
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
        />

        <button className="primary-btn">Track Order</button>
      </form>

      {order && (
        <div className="tracking-result">
          <h2>Tracking Status</h2>
          <p>
            <strong>Order ID:</strong> {order.orderId}
          </p>
          <p>
            <strong>Order Status:</strong> {order.orderStatus}
          </p>
          <p>
            <strong>Payment Status:</strong> {order.paymentStatus}
          </p>
          <p>
            <strong>Tracking ID:</strong>{" "}
            {order.trackingId ? order.trackingId : "Not added yet"}
          </p>
          <p>
            <strong>Total Amount:</strong> ₹{order.finalAmount}
          </p>
        </div>
      )}
    </div>
  );
}

export default TrackOrder;