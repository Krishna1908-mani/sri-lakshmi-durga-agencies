const jwt = require("jsonwebtoken");

/**
 * ============================================================================
 * SRI LAKSHMI DURGA AGENCIES — TOKEN & COOKIE ISOLATION SERVICE
 * Strictly enforces cryptographic, audience, and host-only separation
 * between the Customer Portal and Administrator Portal.
 * ============================================================================
 */

const TOKEN_ISSUER = "sri-lakshmi-durga-agencies";
const CUSTOMER_AUDIENCE = "customer-portal";
const ADMIN_AUDIENCE = "admin-portal";

// Cryptographically distinct secrets (guaranteed non-interchangeable even if base key is shared)
function getCustomerSecret() {
  return (
    process.env.JWT_CUSTOMER_SECRET ||
    (process.env.JWT_SECRET
      ? `${process.env.JWT_SECRET}_customer_portal_vault`
      : "slda_customer_secret_fallback_key_2026")
  );
}

function getAdminSecret() {
  return (
    process.env.JWT_ADMIN_SECRET ||
    (process.env.JWT_SECRET
      ? `${process.env.JWT_SECRET}_admin_control_vault`
      : "slda_admin_secret_fallback_key_2026")
  );
}

/**
 * Generate Customer JWT token
 */
function generateCustomerToken(user) {
  const payload = {
    id: String(user.id || user._id),
    email: user.email,
    name: user.name,
    role: "customer",
  };

  return jwt.sign(payload, getCustomerSecret(), {
    issuer: TOKEN_ISSUER,
    audience: CUSTOMER_AUDIENCE,
    expiresIn: "7d",
  });
}

/**
 * Generate Administrator JWT token
 */
function generateAdminToken(admin) {
  const payload = {
    id: String(admin.id || admin._id),
    email: admin.email,
    name: admin.name,
    role: "admin",
  };

  return jwt.sign(payload, getAdminSecret(), {
    issuer: TOKEN_ISSUER,
    audience: ADMIN_AUDIENCE,
    expiresIn: "12h", // Stricter, shorter expiry for admin sessions
  });
}

/**
 * Verify Customer JWT token
 * Strictly validates signature, issuer, and customer audience.
 */
function verifyCustomerToken(token) {
  return jwt.verify(token, getCustomerSecret(), {
    issuer: TOKEN_ISSUER,
    audience: CUSTOMER_AUDIENCE,
  });
}

/**
 * Verify Administrator JWT token
 * Strictly validates signature, issuer, and admin audience.
 */
function verifyAdminToken(token) {
  return jwt.verify(token, getAdminSecret(), {
    issuer: TOKEN_ISSUER,
    audience: ADMIN_AUDIENCE,
  });
}

/**
 * Host-isolated cookie options
 * NEVER sets wildcard domain (.domain.com) to prevent cross-subdomain cookie leakage
 */
const BASE_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  path: "/",
};

const CUSTOMER_COOKIE_NAME = "slda_customer_session";
const ADMIN_COOKIE_NAME = "slda_admin_session";

function setCustomerCookie(res, token) {
  res.cookie(CUSTOMER_COOKIE_NAME, token, {
    ...BASE_COOKIE_OPTIONS,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

function clearCustomerCookie(res) {
  res.clearCookie(CUSTOMER_COOKIE_NAME, {
    ...BASE_COOKIE_OPTIONS,
  });
}

function setAdminCookie(res, token) {
  res.cookie(ADMIN_COOKIE_NAME, token, {
    ...BASE_COOKIE_OPTIONS,
    maxAge: 12 * 60 * 60 * 1000, // 12 hours
  });
}

function clearAdminCookie(res) {
  res.clearCookie(ADMIN_COOKIE_NAME, {
    ...BASE_COOKIE_OPTIONS,
  });
}

module.exports = {
  TOKEN_ISSUER,
  CUSTOMER_AUDIENCE,
  ADMIN_AUDIENCE,
  CUSTOMER_COOKIE_NAME,
  ADMIN_COOKIE_NAME,
  generateCustomerToken,
  generateAdminToken,
  verifyCustomerToken,
  verifyAdminToken,
  setCustomerCookie,
  clearCustomerCookie,
  setAdminCookie,
  clearAdminCookie,
};
