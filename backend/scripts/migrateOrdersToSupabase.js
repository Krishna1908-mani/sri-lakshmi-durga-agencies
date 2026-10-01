require("dotenv").config();

const mongoose = require("mongoose");
const supabase = require("../config/supabase");
const Order = require("../models/Order");

async function migrateOrders() {
  console.log("============================================================");
  console.log("STARTING ORDER MIGRATION: MONGODB -> SUPABASE");
  console.log("============================================================");

  let mongoConnected = false;

  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing in backend/.env");
    }

    // Connect to MongoDB
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    mongoConnected = true;
    console.log("MongoDB connected successfully.\n");

    // Fetch existing orders from MongoDB
    const mongoOrders = await Order.find().lean();
    console.log(`Found ${mongoOrders.length} order(s) in MongoDB.`);

    if (mongoOrders.length === 0) {
      console.log("No orders found to migrate.");
      return;
    }

    // Fetch existing orders in Supabase to avoid duplicates
    const { data: existingSupabaseOrders, error: fetchError } = await supabase
      .from("orders")
      .select('id, "orderId", legacy_mongo_id');

    if (fetchError) {
      throw new Error(
        `Failed to query Supabase orders table: ${fetchError.message}. Make sure supabase/orders.sql has been executed in the Supabase Dashboard SQL Editor.`
      );
    }

    const existingOrderIds = new Set(
      (existingSupabaseOrders || []).map((o) => String(o.orderId || o.order_id).trim())
    );

    let migratedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;

    for (const order of mongoOrders) {
      const orderId = String(order.orderId || "").trim();

      if (!orderId) {
        console.warn(`[SKIP] Order without orderId found (Mongo ID: ${order._id})`);
        skippedCount++;
        continue;
      }

      if (existingOrderIds.has(orderId)) {
        console.log(`[SKIP] Order '${orderId}' already exists in Supabase.`);
        skippedCount++;
        continue;
      }

      const customerObj = order.customer || {};
      const customerEmail = String(customerObj.email || "").toLowerCase().trim();

      // Normalize items
      const rawItems = Array.isArray(order.items) ? order.items : [];
      const normalizedItems = rawItems.map((item) => ({
        productId: String(item.productId || ""),
        name: String(item.name || ""),
        image: String(item.image || ""),
        selectedSize: String(item.selectedSize || ""),
        quantity: Number(item.quantity) || 1,
        price: Number(item.price) || 0,
      }));

      const payload = {
        orderId,
        customer: {
          name: String(customerObj.name || "").trim(),
          mobile: String(customerObj.mobile || "").trim(),
          email: customerEmail,
          address: String(customerObj.address || "").trim(),
          city: String(customerObj.city || "").trim(),
          state: String(customerObj.state || "").trim(),
          pincode: String(customerObj.pincode || "").trim(),
        },
        customer_email: customerEmail,
        items: normalizedItems,
        totalAmount: Number(order.totalAmount) || 0,
        deliveryCharge: Number(order.deliveryCharge) || 0,
        discountAmount: Number(order.discountAmount) || 0,
        couponCode: String(order.couponCode || "").trim(),
        finalAmount: Number(order.finalAmount) || 0,
        paymentMethod: order.paymentMethod === "ONLINE" ? "ONLINE" : "COD",
        paymentStatus: order.paymentStatus || "Pending",
        razorpayOrderId: String(order.razorpayOrderId || ""),
        razorpayPaymentId: String(order.razorpayPaymentId || ""),
        razorpaySignature: String(order.razorpaySignature || ""),
        orderStatus: order.orderStatus || "Order Placed",
        trackingId: String(order.trackingId || ""),
        stockRestored: Boolean(order.stockRestored),
        legacy_mongo_id: String(order._id),
        created_at: order.createdAt || new Date().toISOString(),
        updated_at: order.updatedAt || new Date().toISOString(),
      };

      const { data: inserted, error: insertError } = await supabase
        .from("orders")
        .insert(payload)
        .select('id, "orderId"')
        .single();

      if (insertError) {
        console.error(`[FAIL] Failed to migrate order '${orderId}':`, insertError.message);
        failedCount++;
      } else {
        console.log(`[MIGRATED] Order '${orderId}' -> Supabase ID ${inserted.id}`);
        existingOrderIds.add(orderId);
        migratedCount++;
      }
    }

    console.log("\n============================================================");
    console.log("ORDER MIGRATION SUMMARY");
    console.log("============================================================");
    console.log(`Total MongoDB orders: ${mongoOrders.length}`);
    console.log(`Successfully migrated: ${migratedCount}`);
    console.log(`Skipped (already exists): ${skippedCount}`);
    console.log(`Failed: ${failedCount}`);
    console.log("============================================================\n");
  } catch (error) {
    console.error("Migration fatal error:", error.message);
    process.exitCode = 1;
  } finally {
    if (mongoConnected) {
      await mongoose.disconnect();
      console.log("MongoDB connection closed.");
    }
  }
}

if (require.main === module) {
  migrateOrders();
}

module.exports = migrateOrders;
