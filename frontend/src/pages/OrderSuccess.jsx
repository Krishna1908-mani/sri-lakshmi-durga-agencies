import { Link, useLocation } from "react-router-dom";
import { 
  CheckCircle2, 
  Printer, 
  Compass, 
  FileText,
  Mail,
  Phone,
  ArrowRight
} from "lucide-react";

function OrderSuccess() {
  const location = useLocation();
  const order = location.state?.order;

  const printInvoice = () => {
    window.print();
  };

  if (!order) {
    return (
      <div className="page order-success-page">
        <div className="order-empty-success-card">
          <FileText size={48} className="empty-icon" />
          <h1>No Active Order Found</h1>
          <p>It looks like you haven't placed an order yet or this session has expired.</p>
          <Link to="/shop" className="primary-btn">
            <span>Explore Collection</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page order-success-page">
      {/* Celebration Banner */}
      <div className="order-success-hero no-print">
        <div className="success-icon-badge">
          <CheckCircle2 size={44} className="check-svg" />
        </div>
        <span className="success-eyebrow">ORDER CONFIRMED</span>
        <h1>Thank You for Your Order!</h1>
        <p className="success-subtitle">
          Your order has been placed successfully and is being prepared for dispatch.
        </p>

        <div className="success-quick-ctas">
          <button type="button" onClick={printInvoice} className="primary-btn print-cta-btn">
            <Printer size={16} />
            <span>Print / Download Invoice</span>
          </button>

          <Link to="/track-order" className="secondary-btn track-cta-btn">
            <Compass size={16} />
            <span>Track Delivery</span>
          </Link>

          <Link to="/shop" className="tertiary-link">
            <span>Continue Shopping</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* Invoice Card */}
      <div className="invoice-container-card">
        {/* Invoice Top Header */}
        <div className="invoice-brand-header">
          <div className="invoice-company-info">
            <div className="invoice-brand-title">
              <img src="/logo.png" alt="Sri Lakshmi Durga Agencies Logo" className="invoice-brand-logo" />
              <div className="invoice-brand-text">
                <h2>Sri Lakshmi Durga Agencies</h2>
                <p className="company-tagline">Premium Ladies Clothing, Kurtis & Daily Essentials</p>
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
              <span className="meta-label">Order ID:</span>
              <strong className="meta-val">{order.orderId}</strong>
            </div>
            <div className="invoice-meta-row">
              <span className="meta-label">Date:</span>
              <span className="meta-val">
                {order.createdAt
                  ? new Date(order.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric"
                    })
                  : new Date().toLocaleDateString("en-IN")}
              </span>
            </div>
            <div className="invoice-meta-row">
              <span className="meta-label">Payment:</span>
              <span className="meta-val">{order.paymentMethod} ({order.paymentStatus})</span>
            </div>
          </div>
        </div>

        {/* Customer Details Strip */}
        <div className="invoice-customer-strip">
          <h3>Customer Details</h3>
          <div className="customer-details-grid">
            <div>
              <span className="detail-label">Name</span>
              <strong>{order.customer?.name}</strong>
            </div>
            <div>
              <span className="detail-label">Mobile</span>
              <strong>{order.customer?.mobile}</strong>
            </div>
            <div>
              <span className="detail-label">Email</span>
              <strong>{order.customer?.email}</strong>
            </div>
            <div className="span-full">
              <span className="detail-label">Shipping Address</span>
              <p>
                {order.customer?.address}, {order.customer?.city},{" "}
                {order.customer?.state} - {order.customer?.pincode}
              </p>
            </div>
          </div>
        </div>

        {/* Invoice Table */}
        <div className="invoice-table-container">
          <table className="order-invoice-table">
            <thead>
              <tr>
                <th style={{ width: "45%" }}>Product Description</th>
                <th style={{ textAlign: "center" }}>Size</th>
                <th style={{ textAlign: "center" }}>Qty</th>
                <th style={{ textAlign: "right" }}>Unit Price</th>
                <th style={{ textAlign: "right" }}>Line Total</th>
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

        {/* Invoice Totals */}
        <div className="invoice-totals-wrapper">
          <div className="invoice-totals-table">
            <div className="totals-row">
              <span>Items Total</span>
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
          </div>
        </div>

        <div className="invoice-footer-note">
          <p>This is a computer-generated tax invoice. No signature required.</p>
          <p>Thank you for choosing Sri Lakshmi Durga Agencies!</p>
        </div>
      </div>
    </div>
  );
}

export default OrderSuccess;