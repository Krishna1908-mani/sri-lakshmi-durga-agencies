const express = require("express");
const router = express.Router();

// Child routers
const authRoutes = require("./authRoutes");
const productRoutes = require("./productRoutes");
const orderRoutes = require("./orderRoutes");
const paymentRoutes = require("./paymentRoutes");
const couponRoutes = require("./couponRoutes");
const homeBannerRoutes = require("./homeBannerRoutes");

/**
 * ============================================================================
 * SRI LAKSHMI DURGA AGENCIES — CUSTOMER NAMESPACED API (/api/v1/customer)
 * Serves customer-facing catalog, orders, payments, coupons, and customer auth.
 * Zero administrator management endpoints are exposed under this tree.
 * ============================================================================
 */

router.use("/auth", authRoutes);
router.use("/products", productRoutes);
router.use("/orders", orderRoutes);
router.use("/payments", paymentRoutes);
router.use("/coupons", couponRoutes);
router.use("/home-banner", homeBannerRoutes);

module.exports = router;
