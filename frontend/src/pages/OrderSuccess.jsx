import { Link, useLocation } from "react-router-dom";

function OrderSuccess() {
  const location = useLocation();
  const order = location.state?.order;

  const printInvoice = () => {
    window.print();
  };

  if (!order) {
    return (
      <div className="page order-success-page">
        <div className="success-box">
          <h1>No Order Found</h1>
          <p>Please place an order first.</p>
          <Link to="/shop" className="primary-btn">
            Go to Shop
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page order-success-page">
      <div className="success-box invoice-box">
        <div className="success-icon">✓</div>

        <h1>Order Placed Successfully!</h1>
        <p>Thank you for shopping with Sri Lakshmi Durga Agencies.</p>

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
              {order.createdAt
                ? new Date(order.createdAt).toLocaleDateString("en-IN")
                : new Date().toLocaleDateString("en-IN")}
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
            <strong>Order Status:</strong> {order.orderStatus}
          </p>
        </div>

        <p className="invoice-note">
          This is a computer-generated invoice. Thank you for shopping with us.
        </p>

        <div className="success-actions">
          <button onClick={printInvoice} className="primary-btn">
            Print / Download Invoice
          </button>

          <Link to="/track-order" className="primary-btn">
            Track Order
          </Link>

          <Link to="/shop" className="secondary-btn">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}

export default OrderSuccess;