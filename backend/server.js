require("dotenv").config();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");
const fs = require("fs");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

// ============================================================
// EXPRESS APP (Supabase PostgreSQL Runtime)
// ============================================================

const app = express();

app.set("trust proxy", 1);

// ============================================================
// SECURITY HEADERS (HELMET)
// Configured to allow cross-origin Supabase Storage images & APIs
// ============================================================

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false,
  })
);

// ============================================================
// RATE LIMITING
// ============================================================

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // 500 requests per 15 min per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests from this IP, please try again after 15 minutes",
  },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 auth attempts per 15 min per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many authentication attempts, please try again after 15 minutes",
  },
});

app.use("/api", apiLimiter);
app.use("/api/auth", authLimiter);
app.use("/api/v1/customer/auth", authLimiter);
app.use("/api/v1/admin/auth", authLimiter);

// ============================================================
// STRICT SUBDOMAIN & PORTAL CORS ISOLATION
// ============================================================

const configuredOrigins = [
  process.env.FRONTEND_URL,
  process.env.CUSTOMER_PORTAL_URL,
  process.env.ADMIN_PORTAL_URL,
  "http://localhost:5173", // Customer Dev
  "http://localhost:5174", // Admin Dev
  "http://localhost:3000",
  "http://app.localhost",
  "http://admin.localhost",
  "https://app.srilakshmidurgaagencies.com",
  "https://admin.srilakshmidurgaagencies.com",
]
  .filter(Boolean)
  .flatMap((url) =>
    url
      .split(",")
      .map((item) => item.trim().replace(/\/$/, ""))
  );

const allowedOrigins = Array.from(new Set(configuredOrigins));

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow internal tools, curl, and server-side SSR / health checks
      if (!origin) {
        return callback(null, true);
      }

      // Development mode allows localhost origins
      if (process.env.NODE_ENV !== "production") {
        return callback(null, true);
      }

      // If no origins configured, allow
      if (allowedOrigins.length === 0) {
        return callback(null, true);
      }

      const normalizedOrigin = origin.replace(/\/$/, "");

      if (allowedOrigins.includes(normalizedOrigin)) {
        return callback(null, true);
      }

      return callback(
        new Error(`Origin ${origin} not allowed by CORS policy`)
      );
    },
    credentials: true,
  })
);

// ============================================================
// COOKIE & BODY PARSERS
// ============================================================

app.use(cookieParser());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

// ============================================================
// LEGACY LOCAL UPLOADS (HISTORICAL FALLBACK)
// ============================================================

const uploadsDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use("/uploads", express.static(uploadsDir));

// ============================================================
// HEALTH CHECKS
// ============================================================

app.get("/", (req, res) => {
  res.json({
    success: true,
    status: "ok",
    message: "Sri Lakshmi Durga Agencies Backend API is running",
    service: "sri-lakshmi-durga-agencies",
    portals: {
      customer: "/api/v1/customer/*",
      admin: "/api/v1/admin/*",
    },
  });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "Sri Lakshmi Durga Agencies Backend API",
    environment: process.env.NODE_ENV || "development",
  });
});

app.get("/api/health/email", async (req, res) => {
  const { verifyEmailConnection } = require("./services/emailService");
  const connection = await verifyEmailConnection();
  const adminEmail = (process.env.ADMIN_EMAIL || process.env.EMAIL_USER || "").trim();

  res.status(connection.connected ? 200 : 503).json({
    success: connection.connected,
    connection,
    config: {
      hasEmailUser: Boolean(process.env.EMAIL_USER),
      hasEmailPass: Boolean(process.env.EMAIL_PASS),
      hasAdminEmail: Boolean(process.env.ADMIN_EMAIL),
      effectiveAdminRecipient: adminEmail ? `${adminEmail.slice(0, 3)}***@${adminEmail.split("@")[1] || ""}` : "NOT_CONFIGURED",
      hasResendApiKey: Boolean(process.env.RESEND_API_KEY),
      hasSmtpHost: Boolean(process.env.SMTP_HOST),
    },
    timestamp: new Date().toISOString(),
  });
});

// ============================================================
// NAMESPACED API ROUTERS (ARCHITECTURAL ISOLATION)
// ============================================================

// Customer API tree (/api/v1/customer/*)
app.use("/api/v1/customer", require("./routes/customerApi"));

// Administrator API tree (/api/v1/admin/*)
app.use("/api/v1/admin", require("./routes/adminApi"));

// ============================================================
// BACKWARD-COMPATIBLE API ROUTES
// ============================================================

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/products", require("./routes/productRoutes"));
app.use("/api/orders", require("./routes/orderRoutes"));
app.use("/api/payments", require("./routes/paymentRoutes"));
app.use("/api/upload", require("./routes/uploadRoutes"));
app.use("/api/coupons", require("./routes/couponRoutes"));
app.use("/api/home-banner", require("./routes/homeBannerRoutes"));

// ============================================================
// 404 HANDLER
// ============================================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

// ============================================================
// GLOBAL ERROR HANDLER (PRODUCTION-SAFE)
// ============================================================

app.use((err, req, res, next) => {
  console.error("Server Error:", err.message);

  const status = err.status || err.statusCode || 500;
  const isProd = process.env.NODE_ENV === "production";

  res.status(status).json({
    success: false,
    message:
      isProd && status === 500
        ? "Internal server error"
        : err.message || "An unexpected error occurred",
  });
});

// ============================================================
// START SERVER
// ============================================================

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log("Supabase PostgreSQL & Storage runtime enabled");
    console.log("Architectural Separation: /api/v1/customer & /api/v1/admin active");
  });
}

module.exports = app;