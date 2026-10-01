import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api/axios";

function MyOrders() {
  const navigate = useNavigate();
  const token = localStorage.getItem("userToken");

  const [orders, setOrders] = useState([]);

  const fetchMyOrders = useCallback(async () => {
    try {
      const res = await API.get("/orders/my-orders", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setOrders(res.data.orders);
    } catch (error) {
      console.log(error);
      alert("Please login to view your orders");
      navigate("/login");
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
    const loadOrders = async () => {
      if (!token) {
        navigate("/login");
        return;
      }

      await fetchMyOrders();
    };

    loadOrders();
  }, [fetchMyOrders, navigate, token]);

  return (
    <div className="page">
      <div className="page-header">
        <h1>My Orders</h1>
        <p>View your order history and delivery status</p>
      </div>

      {orders.length === 0 ? (
        <div className="no-products">
          <h2>No orders found</h2>
          <p>Start shopping to place your first order.</p>

          <Link to="/shop" className="primary-btn">
            Shop Now
          </Link>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => {
            const canCancel = ["Order Placed", "Confirmed", "Packed"].includes(
              order.orderStatus
            );

            return (
              <div className="admin-order-card" key={order._id}>
                <div className="order-top">
                  <div>
                    <h3>{order.orderId}</h3>

                    <p>
                      <strong>Status:</strong> {order.orderStatus}
                    </p>

                    <p>
                      <strong>Payment:</strong> {order.paymentStatus}
                    </p>

                    {order.couponCode && (
                      <p className="discount-text">
                        <strong>Coupon:</strong> {order.couponCode} (-₹
                        {order.discountAmount})
                      </p>
                    )}

                    <p>
                      <strong>Tracking ID:</strong>{" "}
                      {order.trackingId || "Not added yet"}
                    </p>
                  </div>

                  <div>
                    <h3>₹{order.finalAmount}</h3>
                    <p>{order.paymentMethod}</p>
                  </div>
                </div>

                <div className="order-items-box">
                  <h4>Items</h4>

                  {order.items.map((item, index) => (
                    <p key={index}>
                      {item.name} | Size: {item.selectedSize} | Qty:{" "}
                      {item.quantity} | ₹{item.price}
                    </p>
                  ))}
                </div>

                <div className="order-action-row">
                  <Link to="/track-order" className="primary-btn">
                    Track Order
                  </Link>

                  {canCancel && (
                    <button
                      className="cancel-order-btn"
                      onClick={() => cancelOrder(order._id)}
                    >
                      Cancel Order
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default MyOrders;