import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Printer, ArrowLeft, Package } from "lucide-react";
import API from "../api/axios";
import AdminNavbar from "./AdminNavbar";

function AdminShippingLabel() {
  const { id } = useParams();
  const token = localStorage.getItem("adminToken");

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchOrder = useCallback(async () => {
    try {
      setLoading(true);
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
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const printLabel = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="admin-page-layout">
        <AdminNavbar />
        <main className="admin-main-content">
          <div className="admin-loading-card">
            <div className="loading-spinner"></div>
            <p>Generating shipping label...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="admin-page-layout">
        <AdminNavbar />
        <main className="admin-main-content">
          <div className="admin-empty-card">
            <Package size={42} />
            <h3>Order Not Found</h3>
            <p>Unable to locate the order details for this shipping label.</p>
            <Link to="/admin/orders" className="primary-btn">
              Back to Orders
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="admin-page-layout">
      <div className="no-print">
        <AdminNavbar />
      </div>

      <main className="admin-main-content">
        <div className="admin-page-top-bar no-print">
          <div>
            <h1>Parcel Shipping Label</h1>
            <p>Print standard shipping label for package dispatch ({order.orderId})</p>
          </div>

          <div className="top-bar-actions">
            <button type="button" onClick={printLabel} className="primary-btn">
              <Printer size={16} />
              <span>Print Parcel Label</span>
            </button>

            <Link to="/admin/orders" className="secondary-btn">
              <ArrowLeft size={16} />
              <span>Back to Orders</span>
            </Link>
          </div>
        </div>

        {/* Printable Parcel Shipping Label Card */}
        <div className="printable-shipping-label-wrapper">
          <div className="parcel-shipping-label">
            {/* Header: Sender */}
            <div className="label-sender-header">
              <div className="sender-brand">
                <div className="sender-brand-with-logo">
                  <img src="/logo.png" alt="Sri Lakshmi Durga Agencies Logo" className="shipping-label-logo" />
                  <div>
                    <h2>Sri Lakshmi Durga Agencies</h2>
                    <p>Wholesale & Retail Ladies Clothing & Essentials</p>
                    <p>Contact: +91 9949677382 | Andhra Pradesh, India</p>
                  </div>
                </div>
              </div>

              <div className="label-routing-box">
                <span className="carrier-type">STANDARD SURFACE</span>
                <span className="dispatch-type">{order.paymentMethod === "COD" ? "COD PARCEL" : "PREPAID"}</span>
              </div>
            </div>

            {/* Barcode representation */}
            <div className="label-barcode-strip">
              <div className="barcode-graphic-lines">
                {Array.from({ length: 48 }).map((_, i) => (
                  <span
                    key={i}
                    className="barcode-bar"
                    style={{
                      width: i % 3 === 0 ? "3px" : i % 5 === 0 ? "4px" : "1.5px",
                      marginRight: i % 4 === 0 ? "3px" : "1.5px",
                    }}
                  ></span>
                ))}
              </div>
              <span className="barcode-code-text">
                {order.trackingId || order.orderId}
              </span>
            </div>

            {/* Destination / Ship To */}
            <div className="label-destination-block">
              <span className="destination-badge">DELIVER TO:</span>
              <h3 className="recipient-name">{order.customer?.name}</h3>
              <p className="recipient-phone">
                <strong>Phone:</strong> {order.customer?.mobile}
              </p>
              <p className="recipient-address">
                {order.customer?.address}, {order.customer?.city},{" "}
                {order.customer?.state}
              </p>
              <div className="pincode-highlight-box">
                <span>PINCODE: </span>
                <strong>{order.customer?.pincode}</strong>
              </div>
            </div>

            {/* Payment & Package Details */}
            <div className="label-payment-grid">
              <div className="label-pay-col">
                <span className="pay-title">PAYMENT MODE</span>
                <strong className="pay-val">{order.paymentMethod}</strong>
              </div>

              <div className="label-pay-col">
                <span className="pay-title">COLLECTIBLE AMOUNT</span>
                <strong className="pay-val highlight">
                  {order.paymentMethod === "COD"
                    ? `₹${order.finalAmount?.toLocaleString("en-IN")}`
                    : "PAID ₹0 (PREPAID)"}
                </strong>
              </div>

              <div className="label-pay-col">
                <span className="pay-title">DATE</span>
                <span className="pay-val">
                  {new Date(order.createdAt).toLocaleDateString("en-IN")}
                </span>
              </div>
            </div>

            {/* Manifest Items List */}
            <div className="label-manifest-box">
              <span className="manifest-title">CONTENTS MANIFEST:</span>
              <ul className="manifest-items-list">
                {order.items?.map((item, index) => (
                  <li key={index}>
                    {index + 1}. {item.name} {item.selectedSize ? `(${item.selectedSize})` : ""} - Qty: {item.quantity}
                  </li>
                ))}
              </ul>
            </div>

            <div className="label-security-footer">
              <span>⚠️ FRAGILE / APPAREL — HANDLE WITH CARE</span>
              <span>DO NOT ACCEPT IF SEAL IS BROKEN</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AdminShippingLabel;