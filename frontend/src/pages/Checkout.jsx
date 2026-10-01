import { useState } from "react";
import { useNavigate } from "react-router-dom";
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

  const deliveryCharge = totalAmount >= 999 ? 0 : 50;
  const finalAmount = totalAmount + deliveryCharge - discountAmount;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      alert("Enter coupon code");
      return;
    }

    try {
      const res = await API.post("/coupons/validate", {
        code: couponCode,
        totalAmount,
      });

      setAppliedCoupon(res.data.coupon);
      setDiscountAmount(res.data.coupon.discountAmount);

      alert("Coupon applied successfully");
    } catch (error) {
      console.log(error);
      setAppliedCoupon(null);
      setDiscountAmount(0);
      alert(error.response?.data?.message || "Invalid coupon");
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
          alert("Payment completed but verification failed. Contact admin.");
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
        color: "#c2185b",
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
      alert("Cart is empty");
      return;
    }

    if (finalAmount <= 0) {
      alert("Final amount must be greater than 0");
      return;
    }

    try {
      if (form.paymentMethod === "COD") {
        await placeCODOrder();
      } else {
        await placeOnlineOrder();
      }
    } catch (error) {
      console.log("Order error:", error);
      alert(error.response?.data?.message || "Failed to place order");
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Checkout</h1>
        <p>Enter your delivery details</p>
      </div>

      <form className="checkout-form" onSubmit={placeOrder}>
        <div className="form-grid">
          <input
            name="name"
            placeholder="Full Name"
            value={form.name}
            onChange={handleChange}
            required
          />

          <input
            name="mobile"
            placeholder="Mobile Number"
            value={form.mobile}
            onChange={handleChange}
            required
          />

          <input
            name="email"
            placeholder="Email Address"
            value={form.email}
            onChange={handleChange}
            required
          />

          <input
            name="pincode"
            placeholder="Pincode"
            value={form.pincode}
            onChange={handleChange}
            required
          />

          <input
            name="city"
            placeholder="City"
            value={form.city}
            onChange={handleChange}
            required
          />

          <input
            name="state"
            placeholder="State"
            value={form.state}
            onChange={handleChange}
            required
          />
        </div>

        <textarea
          name="address"
          placeholder="Full Address"
          value={form.address}
          onChange={handleChange}
          required
        />

        <select
          name="paymentMethod"
          value={form.paymentMethod}
          onChange={handleChange}
        >
          <option value="COD">Cash on Delivery</option>
          <option value="ONLINE">Online Payment - Razorpay</option>
        </select>

        <div className="coupon-box">
          <h3>Apply Coupon</h3>

          <div className="coupon-row">
            <input
              placeholder="Enter coupon code"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              disabled={!!appliedCoupon}
            />

            {appliedCoupon ? (
              <button type="button" onClick={removeCoupon}>
                Remove
              </button>
            ) : (
              <button type="button" onClick={applyCoupon}>
                Apply
              </button>
            )}
          </div>

          {appliedCoupon && (
            <p className="discount-text">
              Coupon {appliedCoupon.code} applied. You saved ₹{discountAmount}
            </p>
          )}
        </div>

        <div className="checkout-total">
          <p>Products: ₹{totalAmount}</p>
          <p>Delivery: ₹{deliveryCharge}</p>

          {discountAmount > 0 && (
            <p className="discount-text">Discount: -₹{discountAmount}</p>
          )}

          <h2>Total Amount: ₹{finalAmount}</h2>
        </div>

        <button className="primary-btn" type="submit">
          {form.paymentMethod === "COD"
            ? "Place COD Order"
            : "Pay Online & Place Order"}
        </button>
      </form>
    </div>
  );
}

export default Checkout;