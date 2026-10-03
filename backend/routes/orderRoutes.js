const express = require("express");
const supabase = require("../config/supabase");
const { protect, protectAdmin } = require("../middleware/authMiddleware");
const sendAdminOrderEmail = require("../utils/sendAdminOrderEmail");
const {
  sendOrderConfirmationEmail,
  sendOrderStatusUpdateEmail,
} = require("../services/emailService");

const router = express.Router();

function normalizeOrder(order) {
  if (!order) return null;
  const rawId = order.id !== undefined && order.id !== null ? order.id : order._id;
  return {
    _id: String(rawId),
    id: rawId,
    orderId: order.orderId || order.order_id || "",
    customer: order.customer || {},
    items: Array.isArray(order.items) ? order.items : [],
    totalAmount: Number(order.totalAmount || order.total_amount) || 0,
    deliveryCharge: Number(order.deliveryCharge || order.delivery_charge) || 0,
    discountAmount: Number(order.discountAmount || order.discount_amount) || 0,
    couponCode: order.couponCode || order.coupon_code || "",
    finalAmount: Number(order.finalAmount || order.final_amount) || 0,
    paymentMethod: order.paymentMethod || order.payment_method || "COD",
    paymentStatus: order.paymentStatus || order.payment_status || "Pending",
    razorpayOrderId: order.razorpayOrderId || order.razorpay_order_id || "",
    razorpayPaymentId: order.razorpayPaymentId || order.razorpay_payment_id || "",
    razorpaySignature: order.razorpaySignature || order.razorpay_signature || "",
    orderStatus: order.orderStatus || order.order_status || "Order Placed",
    trackingId: order.trackingId || order.tracking_id || "",
    stockRestored: Boolean(order.stockRestored || order.stock_restored),
    createdAt: order.created_at || order.createdAt || null,
    updatedAt: order.updated_at || order.updatedAt || null,
  };
}

const checkAndReduceStock = async (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Order items are required");
  }

  const productSnapshots = [];

  for (const item of items) {
    const isNumeric = /^\d+$/.test(String(item.productId).trim());

    if (!isNumeric) {
      continue;
    }

    const { data, error } = await supabase
      .from("products")
      .select("id, name, stock")
      .eq("id", Number(item.productId))
      .maybeSingle();

    if (error || !data) {
      throw new Error(`${item.name || "Item"} not found in store catalog`);
    }

    const currentStock = Number(data.stock) || 0;
    const requestedQty = Number(item.quantity) || 1;

    if (currentStock < requestedQty) {
      throw new Error(`${data.name} has only ${currentStock} item(s) left in stock`);
    }

    productSnapshots.push({
      id: data.id,
      newStock: Math.max(0, currentStock - requestedQty),
    });
  }

  for (const p of productSnapshots) {
    await supabase
      .from("products")
      .update({ stock: p.newStock })
      .eq("id", p.id);
  }
};

const restoreStock = async (items) => {
  if (!Array.isArray(items)) return;

  for (const item of items) {
    if (!item || !item.productId) continue;
    const isNumeric = /^\d+$/.test(String(item.productId).trim());
    const qty = Number(item.quantity) || 0;
    if (!isNumeric || qty <= 0) continue;

    const { data } = await supabase
      .from("products")
      .select("stock")
      .eq("id", Number(item.productId))
      .maybeSingle();

    if (data) {
      const currentStock = Number(data.stock) || 0;
      await supabase
        .from("products")
        .update({ stock: currentStock + qty })
        .eq("id", Number(item.productId));
    }
  }
};

async function findOrderByIdOrLegacy(identifier) {
  if (!identifier) return null;
  const idStr = String(identifier).trim();
  const isNumeric = /^\d+$/.test(idStr);

  try {
    let query = supabase.from("orders").select("*");
    if (isNumeric) {
      query = query.eq("id", Number(idStr));
    } else {
      query = query.eq("legacy_mongo_id", idStr);
    }

    const { data, error } = await query.maybeSingle();
    if (!error && data) {
      return data;
    }
  } catch (sbErr) {
    console.error("Supabase find order error:", sbErr.message);
  }

  return null;
}

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

    if (
      !customer.name ||
      !customer.mobile ||
      !customer.address ||
      !customer.city ||
      !customer.state ||
      !customer.pincode
    ) {
      return res.status(400).json({
        success: false,
        message:
          "All customer fields (name, mobile, address, city, state, pincode) are required",
      });
    }

    await checkAndReduceStock(items);

    const orderId = "ORD" + Date.now();
    const customerEmail = String(customer.email || "").toLowerCase().trim();

    const normalizedItems = (items || []).map((item) => ({
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
        name: String(customer.name).trim(),
        mobile: String(customer.mobile).trim(),
        email: customerEmail,
        address: String(customer.address).trim(),
        city: String(customer.city).trim(),
        state: String(customer.state).trim(),
        pincode: String(customer.pincode).trim(),
      },
      customer_email: customerEmail,
      items: normalizedItems,
      totalAmount: Number(totalAmount) || 0,
      deliveryCharge: Number(deliveryCharge) || 0,
      discountAmount: Number(discountAmount) || 0,
      couponCode: String(couponCode || "").trim(),
      finalAmount: Number(finalAmount) || 0,
      paymentMethod: paymentMethod === "ONLINE" ? "ONLINE" : "COD",
      paymentStatus: "Pending",
      orderStatus: "Order Placed",
      stockRestored: false,
    };

    const { data: createdOrder, error } = await supabase
      .from("orders")
      .insert(orderPayload)
      .select()
      .single();

    if (error || !createdOrder) {
      throw new Error(error?.message || "Failed to persist order in Supabase");
    }

    const orderResponse = normalizeOrder(createdOrder);

    // Send email notification to customer asynchronously
    sendOrderConfirmationEmail(orderResponse).catch((err) => {
      console.warn("Customer order confirmation email failed safely:", err.message);
    });

    // Send email notification to admin asynchronously
    sendAdminOrderEmail(orderResponse).catch((err) => {
      console.warn("Admin order email failed safely:", err.message);
    });

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      order: orderResponse,
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
    const userEmail = String(req.user.email || "").toLowerCase().trim();

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("customer_email", userEmail)
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch my orders",
        error: error.message,
      });
    }

    const orders = (data || []).map(normalizeOrder);

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
    const requestedOrderId = String(req.params.orderId || "").trim();

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("orderId", requestedOrderId)
      .maybeSingle();

    if (error || !data) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const order = normalizeOrder(data);

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
    const userEmail = String(req.user.email || "").toLowerCase().trim();
    const orderRecord = await findOrderByIdOrLegacy(req.params.id);

    if (!orderRecord) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const orderCustEmail = String(
      orderRecord.customer_email || orderRecord.customer?.email || ""
    ).toLowerCase().trim();

    if (orderCustEmail !== userEmail) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to cancel this order",
      });
    }

    const currentStatus = orderRecord.orderStatus || orderRecord.order_status;
    const allowedCancelStatuses = ["Order Placed", "Confirmed", "Packed"];

    if (!allowedCancelStatuses.includes(currentStatus)) {
      return res.status(400).json({
        success: false,
        message: "Order cannot be cancelled after shipping",
      });
    }

    const rawItems = Array.isArray(orderRecord.items) ? orderRecord.items : [];
    let stockRestored = Boolean(orderRecord.stockRestored || orderRecord.stock_restored);

    if (!stockRestored) {
      await restoreStock(rawItems);
      stockRestored = true;
    }

    const currentPayStatus = orderRecord.paymentStatus || orderRecord.payment_status;
    const newPayStatus = currentPayStatus === "Paid" ? "Refund Pending" : "Cancelled";

    const updates = {
      orderStatus: "Cancelled",
      paymentStatus: newPayStatus,
      stockRestored: true,
    };

    const { data: updatedOrder, error } = await supabase
      .from("orders")
      .update(updates)
      .eq("id", orderRecord.id)
      .select()
      .single();

    if (error || !updatedOrder) {
      return res.status(500).json({
        success: false,
        message: "Failed to update order in Supabase",
        error: error?.message,
      });
    }

    res.json({
      success: true,
      message: "Order cancelled successfully",
      order: normalizeOrder(updatedOrder),
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
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch orders",
        error: error.message,
      });
    }

    const orders = (data || []).map(normalizeOrder);

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
    const orderRecord = await findOrderByIdOrLegacy(req.params.id);

    if (!orderRecord) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const rawItems = Array.isArray(orderRecord.items) ? orderRecord.items : [];
    let stockRestored = Boolean(orderRecord.stockRestored || orderRecord.stock_restored);

    if (
      (orderStatus === "Cancelled" || orderStatus === "Returned") &&
      !stockRestored
    ) {
      await restoreStock(rawItems);
      stockRestored = true;
    }

    const updates = {};
    if (orderStatus !== undefined) updates.orderStatus = orderStatus;
    if (trackingId !== undefined) updates.trackingId = trackingId;
    if (paymentStatus !== undefined) updates.paymentStatus = paymentStatus;
    if (stockRestored) updates.stockRestored = true;

    const { data: updatedOrder, error } = await supabase
      .from("orders")
      .update(updates)
      .eq("id", orderRecord.id)
      .select()
      .single();

    if (error || !updatedOrder) {
      return res.status(500).json({
        success: false,
        message: "Failed to update order in Supabase",
        error: error?.message,
      });
    }

    const normalizedUpdated = normalizeOrder(updatedOrder);

    // Dispatch status update email to customer if status changed
    if (orderStatus && orderStatus !== (orderRecord.orderStatus || orderRecord.order_status)) {
      sendOrderStatusUpdateEmail({
        order: normalizedUpdated,
        newStatus: orderStatus,
      }).catch((emailErr) => {
        console.warn("Order status update customer email failed safely:", emailErr.message);
      });
    }

    res.json({
      success: true,
      message: "Order status updated",
      order: normalizedUpdated,
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
module.exports.checkAndReduceStock = checkAndReduceStock;
module.exports.normalizeOrder = normalizeOrder;