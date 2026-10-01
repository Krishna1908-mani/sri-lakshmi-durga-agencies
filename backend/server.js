require("dotenv").config();

const express = require("express");
const cors = require("cors");
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
  max: 300, // 300 requests per 15 min per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests from this IP, please try again after 15 minutes",
  },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 25, // 25 auth attempts per 15 min per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many authentication attempts, please try again after 15 minutes",
  },
});

app.use("/api", apiLimiter);
app.use("/api/auth", authLimiter);

// ============================================================
// CORS
// ============================================================

const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "http://localhost:3000",
]
  .filter(Boolean)
  .flatMap((url) =>
    url
      .split(",")
      .map((item) => item.trim().replace(/\/$/, ""))
  );

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow tools like Postman, curl, or server-to-server health checks
      if (!origin) {
        return callback(null, true);
      }

      // Development mode allows all local origins
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
// BODY PARSERS
// ============================================================

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

// ============================================================
// API ROUTES
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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log("Supabase PostgreSQL & Storage runtime enabled");
});