import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../api/axios";

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
  const token = localStorage.getItem("adminToken");

  const fetchOrders = useCallback(async () => {
    try {
      const res = await API.get("/orders", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setOrders(res.data.orders);
    } catch (error) {
      console.log(error);
      alert("Failed to fetch orders");
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

      alert("Order updated successfully");
      fetchOrders();
    } catch (error) {
      console.log(error);
      alert("Failed to update order");
    }
  };

  const handleOrderChange = (id, field, value) => {
    setOrders(
      orders.map((order) =>
        order._id === id ? { ...order, [field]: value } : order
      )
    );
  };

  useEffect(() => {
    if (!token) return;

    const fetchOnMount = async () => {
      await fetchOrders();
    };

    fetchOnMount();
  }, [token, fetchOrders]);

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div>
          <h1>Manage Orders</h1>
          <p>Update order status and tracking ID</p>
        </div>

        <Link to="/admin/dashboard" className="back-btn">
          Dashboard
        </Link>
      </div>

      <div className="orders-list">
        {orders.map((order) => (
          <div className="admin-order-card" key={order._id}>
            <div className="order-top">
              <div>
                <h3>{order.orderId}</h3>

                <p>
                  <strong>Customer:</strong> {order.customer.name}
                </p>

                <p>
                  <strong>Mobile:</strong> {order.customer.mobile}
                </p>

                <p>
                  <strong>Email:</strong> {order.customer.email}
                </p>

                <p>
                  <strong>Address:</strong> {order.customer.address},{" "}
                  {order.customer.city}, {order.customer.state} -{" "}
                  {order.customer.pincode}
                </p>
              </div>

              <div>
                <h3>₹{order.finalAmount}</h3>

                <p>
                  <strong>Payment:</strong> {order.paymentMethod}
                </p>

                <p>
                  <strong>Product Total:</strong> ₹{order.totalAmount}
                </p>

                <p>
                  <strong>Delivery:</strong> ₹{order.deliveryCharge || 0}
                </p>

                {order.couponCode && (
                  <p className="discount-text">
                    <strong>Coupon:</strong> {order.couponCode} (-₹
                    {order.discountAmount})
                  </p>
                )}

                <p>
                  <strong>Grand Total:</strong> ₹{order.finalAmount}
                </p>
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

            <div className="order-update-grid">
              <select
                value={order.orderStatus}
                onChange={(e) =>
                  handleOrderChange(order._id, "orderStatus", e.target.value)
                }
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>

              <select
                value={order.paymentStatus}
                onChange={(e) =>
                  handleOrderChange(order._id, "paymentStatus", e.target.value)
                }
              >
                <option value="Pending">Pending</option>
                <option value="Paid">Paid</option>
                <option value="Failed">Failed</option>
                <option value="Cancelled">Cancelled</option>
                <option value="Refund Pending">Refund Pending</option>
                <option value="Refunded">Refunded</option>
              </select>

              <input
                placeholder="Tracking ID / AWB Number"
                value={order.trackingId || ""}
                onChange={(e) =>
                  handleOrderChange(order._id, "trackingId", e.target.value)
                }
              />

              <button onClick={() => updateOrder(order)}>Update</button>

              <Link to={`/admin/invoice/${order._id}`} className="invoice-btn">
                Invoice
              </Link>

              <Link
                to={`/admin/shipping-label/${order._id}`}
                className="label-btn"
              >
                Label
              </Link>
            </div>
          </div>
        ))}

        {orders.length === 0 && <p>No orders found.</p>}
      </div>
    </div>
  );
}

export default AdminOrders;