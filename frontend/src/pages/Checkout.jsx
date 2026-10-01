import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  ShieldCheck, 
  Lock, 
  Truck, 
  Tag, 
  CheckCircle2, 
  CreditCard, 
  Banknote, 
  MapPin, 
  User, 
  Phone, 
  Mail, 
  ShoppingBag,
  ArrowLeft,
  X
} from "lucide-react";
import { useCart } from "../context/CartContext";
import API from "../api/axios";

function Checkout() {
  const navigate = useNavigate();
  const { cartItems, totalAmount, clearCart } = useCart();

  const loggedInName = localStorage.getItem("userName") || "";
  const loggedInEmail = localStorage.getItem("userEmail") || "";

  const savedProfile = JSON.parse(
    localStorage.getItem(`customerProfile_${loggedInEmail}`) ||
      localStorage.getItem("customerProfile") ||
      "{}"
  );

  const [form, setForm] = useState({
    name: savedProfile.name || loggedInName,
    mobile: savedProfile.mobile || "",
    email: savedProfile.email || loggedInEmail,
    address: savedProfile.address || "",
    city: savedProfile.city || "",
    state: savedProfile.state || "",
    pincode: savedProfile.pincode || "",
    paymentMethod: "COD",
  });

  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const deliveryCharge = totalAmount >= 999 ? 0 : 50;
  const finalAmount = totalAmount + deliveryCharge - discountAmount;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      alert("Please enter a valid coupon code");
      return;
    }

    try {
      const res = await API.post("/coupons/validate", {
        code: couponCode,
        totalAmount,
      });

      setAppliedCoupon(res.data.coupon);
      setDiscountAmount(res.data.coupon.discountAmount);

      alert("Coupon applied successfully!");
    } catch (error) {
      console.log(error);
      setAppliedCoupon(null);
      setDiscountAmount(0);
      alert(error.response?.data?.message || "Invalid coupon code");
    }
  };

  const removeCoupon = () => {
    setCouponCode("");
    setAppliedCoupon(null);
    setDiscountAmount(0);
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const existingScript = document.querySelector(
        'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
      );

      if (existingScript) {
        resolve(true);
        return;
      }

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";

      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);

      document.body.appendChild(script);
    });
  };

  const getOrderData = () => {
    return {
      customer: {
        name: form.name,
        mobile: form.mobile,
        email: form.email,
        address: form.address,
        city: form.city,
        state: form.state,
        pincode: form.pincode,
      },
      items: cartItems,
      totalAmount,
      deliveryCharge,
      discountAmount,
      couponCode: appliedCoupon ? appliedCoupon.code : "",
      finalAmount,
      paymentMethod: form.paymentMethod === "COD" ? "COD" : "ONLINE",
    };
  };

  const goToSuccessPage = (order) => {
    clearCart();

    navigate("/order-success", {
      state: {
        order,
      },
    });
  };

  const placeCODOrder = async () => {
    const orderData = getOrderData();
    const res = await API.post("/orders", orderData);
    goToSuccessPage(res.data.order);
  };

  const placeOnlineOrder = async () => {
    const scriptLoaded = await loadRazorpayScript();

    if (!scriptLoaded) {
      alert("Razorpay SDK failed to load. Check your internet connection.");
      return;
    }

    const orderData = getOrderData();

    const orderRes = await API.post("/payments/create-order", {
      amount: finalAmount,
    });

    const razorpayOrder = orderRes.data.razorpayOrder;

    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      name: "Sri Lakshmi Durga Agencies",
      description: "Ladies Clothing Order",
      order_id: razorpayOrder.id,

      handler: async function (response) {
        try {
          const verifyRes = await API.post("/payments/verify-and-create-order", {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            orderData,
          });

          goToSuccessPage(verifyRes.data.order);
        } catch (error) {
          console.log("Payment verify error:", error);
          alert("Payment completed but verification failed. Please contact support.");
        }
      },

      prefill: {
        name: form.name,
        email: form.email,
        contact: form.mobile,
      },

      notes: {
        address: form.address,
      },

      theme: {
        color: "#059669",
      },
    };

    const razorpay = new window.Razorpay(options);

    razorpay.on("payment.failed", function (response) {
      console.log(response.error);
      alert("Payment failed. Please try again.");
    });

    razorpay.open();
  };

  const placeOrder = async (e) => {
    e.preventDefault();

    if (cartItems.length === 0) {
      alert("Your cart is empty");
      navigate("/shop");
      return;
    }

    if (finalAmount <= 0) {
      alert("Final amount must be greater than 0");
      return;
    }

    try {
      setSubmitting(true);
      if (form.paymentMethod === "COD") {
        await placeCODOrder();
      } else {
        await placeOnlineOrder();
      }
    } catch (error) {
      console.log("Order error:", error);
      alert(error.response?.data?.message || "Failed to place order");
    } finally {
      setSubmitting(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="page checkout-page">
        <div className="cart-empty-state">
          <ShoppingBag size={52} className="empty-cart-icon" />
          <h2>Your Cart is Empty</h2>
          <p>Please add items to your cart before proceeding to checkout.</p>
          <Link to="/shop" className="primary-btn">
            Shop Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page checkout-page">
      {/* Header */}
      <div className="checkout-page-header">
        <div>
          <h1>Checkout & Payment</h1>
          <p>Complete your delivery and payment details securely</p>
        </div>
        <Link to="/cart" className="back-to-cart-link">
          <ArrowLeft size={16} />
          <span>Back to Cart</span>
        </Link>
      </div>

      <form className="checkout-layout-form" onSubmit={placeOrder}>
        {/* Left Column: Delivery and Payment Details */}
        <div className="checkout-main-column">
          {/* Section 1: Customer Details */}
          <div className="checkout-card">
            <div className="checkout-card-header">
              <div className="card-header-icon-box">
                <MapPin size={20} />
              </div>
              <div>
                <h2>Shipping Address</h2>
                <p>Where should we deliver your order?</p>
              </div>
            </div>

            <div className="checkout-form-grid">
              <div className="form-group">
                <label htmlFor="checkout-name">Full Name *</label>
                <div className="input-with-icon">
                  <User size={16} className="input-prefix-icon" />
                  <input
                    id="checkout-name"
                    name="name"
                    placeholder="Enter your full name"
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="checkout-mobile">Mobile Number *</label>
                <div className="input-with-icon">
                  <Phone size={16} className="input-prefix-icon" />
                  <input
                    id="checkout-mobile"
                    name="mobile"
                    type="tel"
                    placeholder="10-digit mobile number"
                    value={form.mobile}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group span-2">
                <label htmlFor="checkout-email">Email Address *</label>
                <div className="input-with-icon">
                  <Mail size={16} className="input-prefix-icon" />
                  <input
                    id="checkout-email"
                    name="email"
                    type="email"
                    placeholder="Order updates will be sent here"
                    value={form.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group span-2">
                <label htmlFor="checkout-address">Delivery Address *</label>
                <textarea
                  id="checkout-address"
                  name="address"
                  placeholder="House / Flat no., Building name, Street, Landmark"
                  value={form.address}
                  onChange={handleChange}
                  className="checkout-textarea"
                  rows={3}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="checkout-pincode">Pincode *</label>
                <input
                  id="checkout-pincode"
                  name="pincode"
                  placeholder="6-digit pincode"
                  value={form.pincode}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="checkout-city">City *</label>
                <input
                  id="checkout-city"
                  name="city"
                  placeholder="City / Town"
                  value={form.city}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group span-2">
                <label htmlFor="checkout-state">State *</label>
                <input
                  id="checkout-state"
                  name="state"
                  placeholder="State"
                  value={form.state}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>
            </div>
          </div>

          {/* Section 2: Payment Method */}
          <div className="checkout-card">
            <div className="checkout-card-header">
              <div className="card-header-icon-box">
                <CreditCard size={20} />
              </div>
              <div>
                <h2>Payment Method</h2>
                <p>Choose your preferred payment option</p>
              </div>
            </div>

            <div className="payment-options-grid">
              <label 
                className={`payment-option-card ${form.paymentMethod === "COD" ? "selected" : ""}`}
                onClick={() => setForm({ ...form, paymentMethod: "COD" })}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="COD"
                  checked={form.paymentMethod === "COD"}
                  onChange={handleChange}
                  className="sr-only"
                />
                <div className="option-radio-indicator">
                  <div className="radio-inner-dot"></div>
                </div>
                <div className="option-content">
                  <div className="option-title-row">
                    <Banknote size={20} className="option-icon" />
                    <strong>Cash on Delivery (COD)</strong>
                  </div>
                  <p>Pay with cash or UPI when the package arrives at your doorstep</p>
                </div>
              </label>

              <label 
                className={`payment-option-card ${form.paymentMethod === "ONLINE" ? "selected" : ""}`}
                onClick={() => setForm({ ...form, paymentMethod: "ONLINE" })}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="ONLINE"
                  checked={form.paymentMethod === "ONLINE"}
                  onChange={handleChange}
                  className="sr-only"
                />
                <div className="option-radio-indicator">
                  <div className="radio-inner-dot"></div>
                </div>
                <div className="option-content">
                  <div className="option-title-row">
                    <CreditCard size={20} className="option-icon" />
                    <strong>Online Payment — Razorpay</strong>
                    <span className="secure-badge">Instant</span>
                  </div>
                  <p>Pay securely via UPI (Google Pay, PhonePe, Paytm), Credit/Debit Card or NetBanking</p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary & Coupon */}
        <aside className="checkout-sidebar">
          <div className="checkout-summary-card">
            <h2>Order Summary ({cartItems.length} {cartItems.length === 1 ? "item" : "items"})</h2>

            {/* Items preview list */}
            <div className="checkout-items-preview">
              {cartItems.map((item) => (
                <div className="checkout-item-row" key={`${item.productId}-${item.selectedSize}`}>
                  <img src={item.image} alt={item.name} className="checkout-item-thumb" />
                  <div className="checkout-item-details">
                    <h4>{item.name}</h4>
                    <span className="checkout-item-sub">
                      Qty: {item.quantity} {item.selectedSize ? `• Size: ${item.selectedSize}` : ""}
                    </span>
                  </div>
                  <span className="checkout-item-price">
                    ₹{(item.price * item.quantity)?.toLocaleString("en-IN")}
                  </span>
                </div>
              ))}
            </div>

            {/* Coupon Box */}
            <div className="checkout-coupon-card">
              <div className="coupon-card-header">
                <Tag size={16} />
                <span>Have a Coupon Code?</span>
              </div>

              <div className="coupon-input-group">
                <input
                  type="text"
                  placeholder="Enter coupon code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  disabled={!!appliedCoupon}
                  className="coupon-input"
                />

                {appliedCoupon ? (
                  <button type="button" onClick={removeCoupon} className="coupon-remove-btn">
                    <X size={15} />
                    <span>Remove</span>
                  </button>
                ) : (
                  <button type="button" onClick={applyCoupon} className="coupon-apply-btn">
                    Apply
                  </button>
                )}
              </div>

              {appliedCoupon && (
                <div className="coupon-success-pill">
                  <CheckCircle2 size={15} />
                  <span>Coupon <strong>{appliedCoupon.code}</strong> applied! You saved <strong>₹{discountAmount}</strong></span>
                </div>
              )}
            </div>

            {/* Price Calculations */}
            <div className="checkout-cost-breakdown">
              <div className="breakdown-row">
                <span>Items Subtotal</span>
                <span>₹{totalAmount?.toLocaleString("en-IN")}</span>
              </div>

              <div className="breakdown-row">
                <span>Delivery Charge</span>
                <span>
                  {deliveryCharge === 0 ? (
                    <span className="text-free-delivery">FREE</span>
                  ) : (
                    `₹${deliveryCharge}`
                  )}
                </span>
              </div>

              {discountAmount > 0 && (
                <div className="breakdown-row discount-row">
                  <span>Coupon Discount</span>
                  <span>-₹{discountAmount?.toLocaleString("en-IN")}</span>
                </div>
              )}

              <div className="breakdown-divider"></div>

              <div className="breakdown-total-row">
                <span>Total Amount</span>
                <span className="total-highlight">₹{finalAmount?.toLocaleString("en-IN")}</span>
              </div>
            </div>

            {/* Submit Action CTA */}
            <button 
              type="submit" 
              className="primary-btn place-order-submit-btn" 
              disabled={submitting}
            >
              <Lock size={18} />
              <span>
                {submitting
                  ? "Processing Order..."
                  : form.paymentMethod === "COD"
                  ? `Place COD Order • ₹${finalAmount?.toLocaleString("en-IN")}`
                  : `Pay Online • ₹${finalAmount?.toLocaleString("en-IN")}`}
              </span>
            </button>

            <div className="checkout-security-guarantee">
              <ShieldCheck size={16} />
              <span>256-bit SSL encrypted & Razorpay verified</span>
            </div>
          </div>
        </aside>
      </form>
    </div>
  );
}

export default Checkout;