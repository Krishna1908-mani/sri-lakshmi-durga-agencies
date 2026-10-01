require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

// ============================================================
// EXPRESS APP (Supabase PostgreSQL Runtime)
// ============================================================

// ============================================================
// EXPRESS APP
// ============================================================

const app = express();

app.set("trust proxy", 1);

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
      .map((item) =>
        item.trim().replace(/\/$/, "")
      )
  );

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow tools like Postman / server-to-server requests
      if (!origin) {
        return callback(null, true);
      }

      // Development mode
      if (
        process.env.NODE_ENV !== "production"
      ) {
        return callback(null, true);
      }

      // If no origins configured
      if (allowedOrigins.length === 0) {
        return callback(null, true);
      }

      // Production allowed origin
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(
        new Error(
          `Origin ${origin} not allowed by CORS`
        )
      );
    },

    credentials: true,
  })
);

// ============================================================
// BODY PARSERS
// ============================================================

app.use(
  express.json({
    limit: "10mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "10mb",
  })
);

// ============================================================
// LEGACY LOCAL UPLOADS
// ============================================================

/*
  Keep this temporarily.

  Old products may still contain image URLs like:

  http://localhost:5000/uploads/image.jpg

  New product uploads will use Supabase Storage.

  Once every old image has been migrated to Supabase,
  we can safely remove this section.
*/

const uploadsDir = path.join(
  __dirname,
  "uploads"
);

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, {
    recursive: true,
  });
}

app.use(
  "/uploads",
  express.static(uploadsDir)
);

// ============================================================
// HEALTH CHECK
// ============================================================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message:
      "Sri Lakshmi Durga Agencies Backend API is running",
  });
});

// ============================================================
// API ROUTES
// ============================================================

app.use(
  "/api/auth",
  require("./routes/authRoutes")
);

app.use(
  "/api/products",
  require("./routes/productRoutes")
);

app.use(
  "/api/orders",
  require("./routes/orderRoutes")
);

app.use(
  "/api/payments",
  require("./routes/paymentRoutes")
);

app.use(
  "/api/upload",
  require("./routes/uploadRoutes")
);

app.use(
  "/api/coupons",
  require("./routes/couponRoutes")
);

app.use(
  "/api/home-banner",
  require("./routes/homeBannerRoutes")
);

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
// GLOBAL ERROR HANDLER
// ============================================================

app.use(
  (err, req, res, next) => {
    console.error(
      "Server Error:",
      err
    );

    const status =
      err.status ||
      err.statusCode ||
      500;

    res.status(status).json({
      success: false,

      message:
        err.message ||
        "Internal server error",
    });
  }
);

// ============================================================
// START SERVER
// ============================================================

const PORT =
  process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `Server running on http://localhost:${PORT}`
  );

  console.log(
    "Supabase product storage integration enabled"
  );
});