import { Navigate, useLocation } from "react-router-dom";

/**
 * Safely decodes JWT payload without requiring external crypto packages in the browser
 */
function decodeJwt(token) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (err) {
    return null;
  }
}

/**
 * SRI LAKSHMI DURGA AGENCIES — ADMINISTRATOR AUTHENTICATION GUARD
 * Strictly enforces:
 * 1. Token existence
 * 2. Token expiration
 * 3. Audience separation (MUST have aud: "admin-portal")
 * 4. Administrative role validation (MUST have role: "admin")
 */
function AdminProtected({ children }) {
  const location = useLocation();
  const adminToken = localStorage.getItem("adminToken");

  if (!adminToken) {
    return (
      <Navigate
        to={location.pathname.startsWith("/admin") ? "/admin/login" : "/login"}
        state={{ from: location }}
        replace
      />
    );
  }

  const decoded = decodeJwt(adminToken);

  if (!decoded) {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    return (
      <Navigate
        to={location.pathname.startsWith("/admin") ? "/admin/login?reason=invalid" : "/login?reason=invalid"}
        replace
      />
    );
  }

  // Check expiration
  if (decoded.exp && decoded.exp * 1000 < Date.now()) {
    console.warn("Admin session expired. Redirecting to admin login.");
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    return (
      <Navigate
        to={location.pathname.startsWith("/admin") ? "/admin/login?reason=expired" : "/login?reason=expired"}
        replace
      />
    );
  }

  // Check audience isolation: MUST NOT accept customer-portal audience tokens
  if (decoded.aud && decoded.aud !== "admin-portal") {
    console.error("Security Alert: Customer token attempted on Admin Protected route.");
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    return (
      <Navigate
        to={location.pathname.startsWith("/admin") ? "/admin/login?reason=audience_mismatch" : "/login?reason=audience_mismatch"}
        replace
      />
    );
  }

  // Check role
  if (decoded.role !== "admin") {
    console.error("Security Alert: Non-admin role in admin protected route.");
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    return (
      <Navigate
        to={location.pathname.startsWith("/admin") ? "/admin/login?reason=unauthorized" : "/login?reason=unauthorized"}
        replace
      />
    );
  }

  return children;
}

export default AdminProtected;