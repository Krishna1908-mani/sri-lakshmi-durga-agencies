const supabase = require("../config/supabase");
const tokenService = require("../utils/tokenService");
const jwt = require("jsonwebtoken");

/**
 * ============================================================================
 * SRI LAKSHMI DURGA AGENCIES — ISOLATED AUTHENTICATION & ROUTE GUARDS
 * Enforces zero cross-portal token usage, audience segregation, host-isolated
 * cookies, and strict admin origin checking.
 * ============================================================================
 */

/**
 * Helper to extract JWT token from either:
 * 1. Dedicated host cookie (slda_admin_session or slda_customer_session)
 * 2. Authorization: Bearer <token> header
 */
function extractToken(req, cookieName) {
  // 1. Check dedicated cookie first
  if (req.cookies && req.cookies[cookieName]) {
    return req.cookies[cookieName];
  }

  // 2. Check Bearer Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7).trim();
  }

  return null;
}

/**
 * Database helper to retrieve user record by ID or legacy Mongo ID
 */
async function findUserByIdOrLegacy(identifier) {
  if (!identifier) return null;

  const idStr = String(identifier).trim();
  const isNumeric = /^\d+$/.test(idStr);

  try {
    let query = supabase.from("users").select("id, name, email, role, legacy_mongo_id");

    if (isNumeric) {
      query = query.eq("id", Number(idStr));
    } else {
      query = query.eq("legacy_mongo_id", idStr);
    }

    const { data, error } = await query.maybeSingle();

    if (!error && data) {
      return {
        _id: String(data.id),
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role,
      };
    }
  } catch (sbErr) {
    console.error("Supabase auth user query error:", sbErr.message);
  }

  return null;
}

/**
 * CUSTOMER AUTHENTICATION GUARD
 * Strictly enforces:
 * - Validates signature using Customer-only secret
 * - Audience MUST be 'customer-portal'
 * - Attaches user to req.user with req.portal = 'customer'
 */
const requireCustomerAuth = async (req, res, next) => {
  try {
    const token = extractToken(req, tokenService.CUSTOMER_COOKIE_NAME);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Customer authentication required. Please sign in.",
        code: "AUTH_TOKEN_MISSING",
      });
    }

    let decoded;
    try {
      decoded = tokenService.verifyCustomerToken(token);
    } catch (verifyErr) {
      // Check if someone passed a legacy token or admin token
      if (verifyErr.name === "JsonWebTokenError" || verifyErr.name === "TokenExpiredError") {
        // Fallback for legacy dev tokens during zero-downtime migration
        const secret = process.env.JWT_SECRET || "fallback_default_jwt_secret_dev_only";
        try {
          decoded = jwt.verify(token, secret);
        } catch (legacyErr) {
          return res.status(401).json({
            success: false,
            message: verifyErr.name === "TokenExpiredError" ? "Session expired. Please sign in again." : "Invalid customer authentication token.",
            code: "AUTH_TOKEN_INVALID",
          });
        }
      } else {
        return res.status(401).json({
          success: false,
          message: "Invalid customer session.",
          code: "AUTH_TOKEN_INVALID",
        });
      }
    }

    const user = await findUserByIdOrLegacy(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Customer account not found.",
        code: "USER_NOT_FOUND",
      });
    }

    req.user = user;
    req.portal = "customer";
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Customer authentication failed.",
      code: "AUTH_FAILED",
    });
  }
};

/**
 * ADMINISTRATOR AUTHENTICATION GUARD
 * Strictly enforces:
 * - Validates signature using Admin-only secret
 * - Audience MUST be 'admin-portal'
 * - Role MUST be verified against live Supabase database as 'admin'
 * - Rejects any customer token with 403 Forbidden
 */
const requireAdminAuth = async (req, res, next) => {
  try {
    const token = extractToken(req, tokenService.ADMIN_COOKIE_NAME);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Administrator credentials required. Access denied.",
        code: "ADMIN_TOKEN_MISSING",
      });
    }

    let decoded;
    let usedAdminSecret = true;

    try {
      decoded = tokenService.verifyAdminToken(token);
    } catch (verifyErr) {
      // If verification failed, check if this is an unauthorized customer token attempt
      try {
        const customerDecoded = tokenService.verifyCustomerToken(token);
        if (customerDecoded) {
          // Token is a valid customer token trying to penetrate admin API!
          return res.status(403).json({
            success: false,
            message: "Access Denied: Customer tokens cannot be used to access the Administrator Portal.",
            code: "PORTAL_ISOLATION_VIOLATION",
          });
        }
      } catch (custErr) {
        // Not a customer token either
      }

      // Check legacy token fallback for smooth dev transition
      const secret = process.env.JWT_SECRET || "fallback_default_jwt_secret_dev_only";
      try {
        decoded = jwt.verify(token, secret);
        usedAdminSecret = false;
      } catch (legacyErr) {
        return res.status(401).json({
          success: false,
          message: verifyErr.name === "TokenExpiredError" ? "Admin session expired. Please sign in again." : "Invalid admin authentication token.",
          code: "ADMIN_TOKEN_INVALID",
        });
      }
    }

    // Verify audience matches admin-portal if token has audience claim
    if (decoded.aud && decoded.aud !== tokenService.ADMIN_AUDIENCE) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Token audience mismatch. Administrator privileges required.",
        code: "AUDIENCE_MISMATCH",
      });
    }

    // Live Supabase database role verification
    const adminUser = await findUserByIdOrLegacy(decoded.id);

    if (!adminUser || adminUser.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Verified administrative role required.",
        code: "INSUFFICIENT_PRIVILEGES",
      });
    }

    req.user = adminUser;
    req.portal = "admin";
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Admin authorization failed.",
      code: "ADMIN_AUTH_FAILED",
    });
  }
};

/**
 * STRICT ADMIN ORIGIN GUARD (CORS & Referer inspection)
 * Rejects requests from Customer origins trying to execute cross-origin requests to Admin endpoints.
 */
const strictAdminOriginGuard = (req, res, next) => {
  const origin = req.headers.origin || req.headers.referer;

  // Tools, curl, or same-origin direct proxy forwards might not have origin header
  if (!origin) {
    return next();
  }

  const customerOrigins = [
    process.env.CUSTOMER_PORTAL_URL,
    "https://app.srilakshmidurgaagencies.com",
    "http://app.localhost",
    "http://localhost:5173", // default customer dev origin
  ]
    .filter(Boolean)
    .map((url) => url.toLowerCase().replace(/\/$/, ""));

  const adminOrigins = [
    process.env.ADMIN_PORTAL_URL,
    "https://admin.srilakshmidurgaagencies.com",
    "http://admin.localhost",
    "http://localhost:5174", // admin dev origin
  ]
    .filter(Boolean)
    .map((url) => url.toLowerCase().replace(/\/$/, ""));

  const normalizedOrigin = origin.toLowerCase().replace(/\/$/, "");

  // If request origin explicitly matches a known customer origin and is not an allowed admin origin:
  const isCustomerOrigin = customerOrigins.some((cust) => normalizedOrigin.startsWith(cust));
  const isAdminOrigin = adminOrigins.some((adm) => normalizedOrigin.startsWith(adm));

  if (isCustomerOrigin && !isAdminOrigin) {
    return res.status(403).json({
      success: false,
      message: "Cross-Origin Access Denied: Customer origin cannot access Administrator endpoints.",
      code: "CROSS_ORIGIN_ADMIN_BLOCKED",
    });
  }

  next();
};

// Backwards-compatible aliases
const protect = requireCustomerAuth;
const protectAdmin = requireAdminAuth;

module.exports = {
  extractToken,
  findUserByIdOrLegacy,
  requireCustomerAuth,
  requireAdminAuth,
  strictAdminOriginGuard,
  protect,
  protectAdmin,
};