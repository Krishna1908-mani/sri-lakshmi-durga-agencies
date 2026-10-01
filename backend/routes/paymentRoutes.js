const express = require("express");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const supabase = require("../config/supabase");
const { checkAndReduceStock, normalizeOrder } = require("./orderRoutes");
const sendAdminOrderEmail = require("../utils/sendAdminOrderEmail");

const router = express.Router();

// Create Razorpay order
router.post("/create-order", async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid amount is required",
      });
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({
        success: false,
        message: "Razorpay payment keys are not configured on server",
      });
    }

    const options = {
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: "receipt_" + Date.now(),
    };

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const razorpayOrder = await razorpay.orders.create(options);

    res.json({
      success: true,
      razorpayOrder,
    });
  } catch (error) {
    console.error("Razorpay create order error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create Razorpay order",
      error: error.message,
    });
  }
});

// Verify payment and create order
router.post("/verify-and-create-order", async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderData,
    } = req.body;

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !orderData ||
      !orderData.customer ||
      !orderData.items
    ) {
      return res.status(400).json({
        success: false,
        message: "Incomplete payment or order verification data",
      });
    }

    if (!process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({
        success: false,
        message: "Razorpay secret key not configured on server",
      });
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed",
      });
    }

    await checkAndReduceStock(orderData.items);

    const orderId = "ORD" + Date.now();
    const customerEmail = String(orderData.customer.email || "").toLowerCase().trim();

    const normalizedItems = (orderData.items || []).map((item) => ({
      productId: String(item.productId || ""),
      name: String(item.name || ""),
      image: String(item.image || ""),
      selectedSize: String(item.selectedSize || ""),
      quantity: Number(item.quantity) || 1,
      price: Number(item.price) || 0,
    }));

    const orderPayload = {
      orderId,
      customer: {
        name: String(orderData.customer.name).trim(),
        mobile: String(orderData.customer.mobile).trim(),
        email: customerEmail,
        address: String(orderData.customer.address).trim(),
        city: String(orderData.customer.city).trim(),
        state: String(orderData.customer.state).trim(),
        pincode: String(orderData.customer.pincode).trim(),
      },
      customer_email: customerEmail,
      items: normalizedItems,
      totalAmount: Number(orderData.totalAmount) || 0,
      deliveryCharge: Number(orderData.deliveryCharge) || 0,
      discountAmount: Number(orderData.discountAmount) || 0,
      couponCode: String(orderData.couponCode || "").trim(),
      finalAmount: Number(orderData.finalAmount) || 0,
      paymentMethod: "ONLINE",
      paymentStatus: "Paid",
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      orderStatus: "Order Placed",
      stockRestored: false,
    };

    const { data: createdOrder, error } = await supabase
      .from("orders")
      .insert(orderPayload)
      .select()
      .single();

    if (error || !createdOrder) {
      throw new Error(error?.message || "Failed to persist online order in Supabase");
    }

    const orderResponse = normalizeOrder(createdOrder);

    // Send email notification to admin after online payment order is placed
    sendAdminOrderEmail(orderResponse).catch((error) => {
      console.log("Admin order email failed:", error.message);
    });

    res.status(201).json({
      success: true,
      message: "Payment verified and order placed successfully",
      order: orderResponse,
    });
  } catch (error) {
    console.error("Payment verify error:", error);

    res.status(400).json({
      success: false,
      message: error.message || "Payment verification failed",
    });
  }
});

module.exports = router;