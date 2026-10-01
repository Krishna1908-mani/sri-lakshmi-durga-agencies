import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import API from "../api/axios";

function AdminInvoice() {
  const { id } = useParams();
  const token = localStorage.getItem("adminToken");

  const [order, setOrder] = useState(null);

  const fetchOrder = useCallback(async () => {
    try {
      const res = await API.get("/orders", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const selectedOrder = res.data.orders.find((item) => item._id === id);
      setOrder(selectedOrder);
    } catch (error) {
      console.log(error);
      alert("Failed to load invoice");
    }
  }, [id, token]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const printInvoice = () => {
    window.print();
  };

  if (!order) {
    return (
      <div className="admin-page">
        <h2>Loading invoice...</h2>
      </div>
    );
  }

  return (
    <div className="admin-page invoice-admin-page">
      <div className="admin-header invoice-actions">
        <div>
          <h1>Order Invoice</h1>
          <p>Print or download customer invoice</p>
        </div>

        <div className="order-action-row">
          <button onClick={printInvoice} className="primary-btn">
            Print / Download
          </button>

          <Link to="/admin/orders" className="back-btn">
            Back to Orders
          </Link>
        </div>
      </div>

      <div className="success-box invoice-box admin-print-invoice">
        <div className="invoice-header">
          <div>
            <h2>Sri Lakshmi Durga Agencies</h2>
            <p>Ladies Clothing & Essentials Store</p>
            <p>Phone: +91 9949677382</p>
            <p>Email: support@srilakshmidurga.com</p>
          </div>

          <div>
            <h3>Invoice</h3>
            <p>
              <strong>Order ID:</strong> {order.orderId}
            </p>
            <p>
              <strong>Date:</strong>{" "}
              {new Date(order.createdAt).toLocaleDateString("en-IN")}
            </p>
            <p>
              <strong>Status:</strong> {order.orderStatus}
            </p>
          </div>
        </div>

        <div className="success-details">
          <h3>Customer Details</h3>

          <p>
            <strong>Name:</strong> {order.customer?.name}
          </p>

          <p>
            <strong>Mobile:</strong> {order.customer?.mobile}
          </p>

          <p>
            <strong>Email:</strong> {order.customer?.email}
          </p>

          <p>
            <strong>Address:</strong> {order.customer?.address},{" "}
            {order.customer?.city}, {order.customer?.state} -{" "}
            {order.customer?.pincode}
          </p>
        </div>

        <div className="invoice-table-wrap">
          <table className="invoice-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Size</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>

            <tbody>
              {order.items?.map((item, index) => (
                <tr key={index}>
                  <td>{item.name}</td>
                  <td>{item.selectedSize}</td>
                  <td>{item.quantity}</td>
                  <td>₹{item.price}</td>
                  <td>₹{item.price * item.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="invoice-total">
          <p>
            <strong>Product Total:</strong> ₹{order.totalAmount}
          </p>

          <p>
            <strong>Delivery Charge:</strong> ₹{order.deliveryCharge || 0}
          </p>

          {order.couponCode && (
            <p className="discount-text">
              <strong>Coupon Applied:</strong> {order.couponCode}
            </p>
          )}

          {order.discountAmount > 0 && (
            <p className="discount-text">
              <strong>Discount:</strong> -₹{order.discountAmount}
            </p>
          )}

          <h2>Grand Total: ₹{order.finalAmount}</h2>

          <p>
            <strong>Payment Method:</strong> {order.paymentMethod}
          </p>

          <p>
            <strong>Payment Status:</strong> {order.paymentStatus}
          </p>

          <p>
            <strong>Tracking ID:</strong> {order.trackingId || "Not added"}
          </p>
        </div>

        <p className="invoice-note">
          This is a computer-generated invoice. Thank you for shopping with Sri
          Lakshmi Durga Agencies.
        </p>
      </div>
    </div>
  );
}

export default AdminInvoice;