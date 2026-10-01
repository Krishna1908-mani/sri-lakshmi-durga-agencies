import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import API from "../api/axios";

function AdminShippingLabel() {
  const { id } = useParams();
  const token = localStorage.getItem("adminToken");

  const [order, setOrder] = useState(null);

  const fetchOrder = async () => {
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
      alert("Failed to load shipping label");
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const printLabel = () => {
    window.print();
  };

  if (!order) {
    return (
      <div className="admin-page">
        <h2>Loading shipping label...</h2>
      </div>
    );
  }

  return (
    <div className="admin-page shipping-label-page">
      <div className="admin-header label-actions">
        <div>
          <h1>Shipping Label</h1>
          <p>Print delivery label for parcel</p>
        </div>

        <div className="order-action-row">
          <button onClick={printLabel} className="primary-btn">
            Print Label
          </button>

          <Link to="/admin/orders" className="back-btn">
            Back to Orders
          </Link>
        </div>
      </div>

      <div className="shipping-label">
        <div className="label-store">
          <h2>Sri Lakshmi Durga Agencies</h2>
          <p>Ladies Clothing & Essentials</p>
          <p>Phone: +91 9949677382</p>
        </div>

        <div className="label-row">
          <strong>Order ID:</strong>
          <span>{order.orderId}</span>
        </div>

        <div className="label-row">
          <strong>Date:</strong>
          <span>{new Date(order.createdAt).toLocaleDateString("en-IN")}</span>
        </div>

        <div className="label-section">
          <h3>SHIP TO</h3>

          <p className="label-name">{order.customer?.name}</p>

          <p>
            <strong>Mobile:</strong> {order.customer?.mobile}
          </p>

          <p>
            {order.customer?.address}, {order.customer?.city},{" "}
            {order.customer?.state} - {order.customer?.pincode}
          </p>
        </div>

        <div className="label-section">
          <h3>PAYMENT</h3>

          <p>
            <strong>Method:</strong> {order.paymentMethod}
          </p>

          <p>
            <strong>Status:</strong> {order.paymentStatus}
          </p>

          <p className="label-amount">
            {order.paymentMethod === "COD"
              ? `COD Amount: ₹${order.finalAmount}`
              : `Paid Amount: ₹${order.finalAmount}`}
          </p>
        </div>

        <div className="label-section">
          <h3>ITEMS</h3>

          {order.items?.map((item, index) => (
            <p key={index}>
              {index + 1}. {item.name} | Size: {item.selectedSize} | Qty:{" "}
              {item.quantity}
            </p>
          ))}
        </div>

        <div className="label-footer">
          <p>Handle with care</p>
          <p>Thank you for shopping with us</p>
        </div>
      </div>
    </div>
  );
}

export default AdminShippingLabel;