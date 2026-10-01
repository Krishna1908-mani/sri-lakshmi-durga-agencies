const express = require("express");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const Order = require("../models/Order");
const Product = require("../models/Product");
const sendAdminOrderEmail = require("../utils/sendAdminOrderEmail");

const router = express.Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const checkAndReduceStock = async (items) => {
  for (const item of items) {
    const product = await Product.findById(item.productId);

    if (!product) {
      throw new Error(`${item.name} not found`);
    }

    if (product.stock < item.quantity) {
      throw new Error(`${product.name} has only ${product.stock} items left`);
    }
  }

  for (const item of items) {
    await Product.findByIdAndUpdate(item.productId, {
      $inc: { stock: -item.quantity },
    });
  }
};

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

    const options = {
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: "receipt_" + Date.now(),
    };

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

    const order = await Order.create({
      orderId,
      customer: orderData.customer,
      items: orderData.items,
      totalAmount: orderData.totalAmount,
      deliveryCharge: orderData.deliveryCharge,
      discountAmount: orderData.discountAmount || 0,
      couponCode: orderData.couponCode || "",
      finalAmount: orderData.finalAmount,
      paymentMethod: "ONLINE",
      paymentStatus: "Paid",
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      orderStatus: "Order Placed",
      stockRestored: false,
    });

    // Send email notification to admin after online payment order is placed
    sendAdminOrderEmail(order).catch((error) => {
      console.log("Admin order email failed:", error.message);
    });

    res.status(201).json({
      success: true,
      message: "Payment verified and order placed successfully",
      order,
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