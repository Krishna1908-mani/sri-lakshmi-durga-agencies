const express = require("express");
const Order = require("../models/Order");
const Product = require("../models/Product");
const { protect, protectAdmin } = require("../middleware/authMiddleware");
const sendAdminOrderEmail = require("../utils/sendAdminOrderEmail");

const router = express.Router();

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

const restoreStock = async (items) => {
  if (!Array.isArray(items)) return;
  for (const item of items) {
    if (item && item.productId) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: Number(item.quantity) || 0 },
      });
    }
  }
};

// Public: place new COD order
router.post("/", async (req, res) => {
  try {
    const {
      customer,
      items,
      totalAmount,
      deliveryCharge,
      discountAmount,
      couponCode,
      finalAmount,
      paymentMethod,
    } = req.body;

    if (!customer || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Customer details and order items are required",
      });
    }

    if (!customer.name || !customer.mobile || !customer.address ||
        !customer.city || !customer.state || !customer.pincode) {
      return res.status(400).json({
        success: false,
        message: "All customer fields (name, mobile, address, city, state, pincode) are required",
      });
    }

    await checkAndReduceStock(items);

    const orderId = "ORD" + Date.now();

    const order = await Order.create({
      orderId,
      customer,
      items,
      totalAmount,
      deliveryCharge,
      discountAmount: discountAmount || 0,
      couponCode: couponCode || "",
      finalAmount,
      paymentMethod: paymentMethod || "COD",
      paymentStatus: "Pending",
      orderStatus: "Order Placed",
      stockRestored: false,
    });

    // Send email notification to admin after COD order is placed
    sendAdminOrderEmail(order).catch((error) => {
      console.log("Admin order email failed:", error.message);
    });

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      order,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to place order",
    });
  }
});

// Customer: get my orders
router.get("/my-orders", protect, async (req, res) => {
  try {
    const orders = await Order.find({
      "customer.email": req.user.email,
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      orders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch my orders",
      error: error.message,
    });
  }
});

// Public: track order
router.get("/track/:orderId", async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.orderId });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.json({
      success: true,
      order: {
        orderId: order.orderId,
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        trackingId: order.trackingId,
        finalAmount: order.finalAmount,
        createdAt: order.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to track order",
    });
  }
});

// Customer: cancel order
router.put("/:id/cancel", protect, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      "customer.email": req.user.email,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const allowedCancelStatuses = ["Order Placed", "Confirmed", "Packed"];

    if (!allowedCancelStatuses.includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: "Order cannot be cancelled after shipping",
      });
    }

    if (!order.stockRestored) {
      await restoreStock(order.items);
      order.stockRestored = true;
    }

    order.orderStatus = "Cancelled";

    if (order.paymentStatus === "Paid") {
      order.paymentStatus = "Refund Pending";
    } else {
      order.paymentStatus = "Cancelled";
    }

    await order.save();

    res.json({
      success: true,
      message: "Order cancelled successfully",
      order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to cancel order",
      error: error.message,
    });
  }
});

// Admin: get all orders
router.get("/", protectAdmin, async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      orders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
    });
  }
});

// Admin: update order status
router.put("/:id/status", protectAdmin, async (req, res) => {
  try {
    const { orderStatus, trackingId, paymentStatus } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (
      (orderStatus === "Cancelled" || orderStatus === "Returned") &&
      !order.stockRestored
    ) {
      await restoreStock(order.items);
      order.stockRestored = true;
    }

    if (orderStatus !== undefined) {
      order.orderStatus = orderStatus;
    }
    if (trackingId !== undefined) {
      order.trackingId = trackingId;
    }
    if (paymentStatus !== undefined) {
      order.paymentStatus = paymentStatus;
    }

    await order.save();

    res.json({
      success: true,
      message: "Order status updated",
      order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update order",
      error: error.message,
    });
  }
});

module.exports = router;