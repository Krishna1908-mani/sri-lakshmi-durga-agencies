import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { 
  Printer, 
  ArrowLeft, 
  Phone, 
  Mail, 
  FileText
} from "lucide-react";
import API from "../api/axios";
import AdminNavbar from "./AdminNavbar";

function AdminInvoice() {
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
      alert("Failed to load invoice");
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const printInvoice = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="admin-page-layout">
        <AdminNavbar />
        <main className="admin-main-content">
          <div className="admin-loading-card">
            <div className="loading-spinner"></div>
            <p>Generating invoice document...</p>
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
            <FileText size={42} />
            <h3>Order Not Found</h3>
            <p>Unable to locate the order details for this invoice.</p>
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
            <h1>Order Invoice</h1>
            <p>Print or save official PDF invoice for order {order.orderId}</p>
          </div>

          <div className="top-bar-actions">
            <button type="button" onClick={printInvoice} className="primary-btn">
              <Printer size={16} />
              <span>Print Invoice</span>
            </button>

            <Link to="/admin/orders" className="secondary-btn">
              <ArrowLeft size={16} />
              <span>Back to Orders</span>
            </Link>
          </div>
        </div>

        {/* Printable Invoice Sheet */}
        <div className="printable-invoice-sheet">
          <div className="invoice-brand-header">
            <div className="invoice-company-info">
              <div className="invoice-brand-title">
                <img src="/logo.png" alt="Sri Lakshmi Durga Agencies Logo" className="invoice-brand-logo" />
                <div className="invoice-brand-text">
                  <h2>Sri Lakshmi Durga Agencies</h2>
                  <p className="company-tagline">Wholesale & Retail Ladies Clothing & Daily Essentials</p>
                  <div className="company-contact-row">
                    <span><Phone size={13} /> +91 9949677382</span>
                    <span><Mail size={13} /> support@srilakshmidurga.com</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="invoice-meta-info">
              <div className="invoice-badge">TAX INVOICE</div>
              <div className="invoice-meta-row">
                <span className="meta-label">Invoice / Order ID:</span>
                <strong className="meta-val">{order.orderId}</strong>
              </div>
              <div className="invoice-meta-row">
                <span className="meta-label">Date:</span>
                <span className="meta-val">
                  {new Date(order.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric"
                  })}
                </span>
              </div>
              <div className="invoice-meta-row">
                <span className="meta-label">Order Status:</span>
                <span className="meta-val">{order.orderStatus}</span>
              </div>
              {order.trackingId && (
                <div className="invoice-meta-row">
                  <span className="meta-label">AWB Tracking:</span>
                  <span className="meta-val tracking-code">{order.trackingId}</span>
                </div>
              )}
            </div>
          </div>

          <div className="invoice-customer-strip">
            <h3>Billed & Shipped To</h3>
            <div className="customer-details-grid">
              <div>
                <span className="detail-label">Customer Name</span>
                <strong>{order.customer?.name}</strong>
              </div>
              <div>
                <span className="detail-label">Phone</span>
                <strong>{order.customer?.mobile}</strong>
              </div>
              <div>
                <span className="detail-label">Email</span>
                <strong>{order.customer?.email}</strong>
              </div>
              <div className="span-full">
                <span className="detail-label">Shipping Destination</span>
                <p>
                  {order.customer?.address}, {order.customer?.city},{" "}
                  {order.customer?.state} - {order.customer?.pincode}
                </p>
              </div>
            </div>
          </div>

          <div className="invoice-table-container">
            <table className="order-invoice-table">
              <thead>
                <tr>
                  <th style={{ width: "45%" }}>Item Description</th>
                  <th style={{ textAlign: "center" }}>Size</th>
                  <th style={{ textAlign: "center" }}>Qty</th>
                  <th style={{ textAlign: "right" }}>Unit Price</th>
                  <th style={{ textAlign: "right" }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items?.map((item, index) => (
                  <tr key={index}>
                    <td>
                      <strong className="item-name">{item.name}</strong>
                    </td>
                    <td style={{ textAlign: "center" }}>{item.selectedSize || "Standard"}</td>
                    <td style={{ textAlign: "center" }}>{item.quantity}</td>
                    <td style={{ textAlign: "right" }}>₹{item.price?.toLocaleString("en-IN")}</td>
                    <td style={{ textAlign: "right" }}>
                      ₹{(item.price * item.quantity)?.toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="invoice-totals-wrapper">
            <div className="invoice-totals-table">
              <div className="totals-row">
                <span>Items Subtotal</span>
                <span>₹{order.totalAmount?.toLocaleString("en-IN")}</span>
              </div>
              <div className="totals-row">
                <span>Delivery Charge</span>
                <span>
                  {order.deliveryCharge === 0 ? "FREE" : `₹${order.deliveryCharge}`}
                </span>
              </div>
              {order.couponCode && (
                <div className="totals-row discount-row">
                  <span>Coupon ({order.couponCode})</span>
                  <span>-₹{order.discountAmount?.toLocaleString("en-IN")}</span>
                </div>
              )}
              <div className="totals-divider"></div>
              <div className="totals-grand-row">
                <span>Grand Total</span>
                <span className="grand-price">₹{order.finalAmount?.toLocaleString("en-IN")}</span>
              </div>
              <div className="totals-row payment-row">
                <span>Payment Mode</span>
                <span>{order.paymentMethod} ({order.paymentStatus})</span>
              </div>
            </div>
          </div>

          <div className="invoice-footer-note">
            <p>Thank you for shopping with Sri Lakshmi Durga Agencies.</p>
            <p>This is a computer-generated tax invoice and requires no physical signature.</p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AdminInvoice;