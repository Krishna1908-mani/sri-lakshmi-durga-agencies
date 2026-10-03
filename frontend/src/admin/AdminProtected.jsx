import { useEffect, useState } from "react";
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
  } catch {
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
  const [authState] = useState(() => {
    const adminToken = localStorage.getItem("adminToken");
    if (!adminToken) {
      return { status: "missing_token" };
    }

    const decoded = decodeJwt(adminToken);
    if (!decoded) {
      return { status: "invalid" };
    }

    // Check expiration
    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      return { status: "expired" };
    }

    // Check audience isolation: MUST NOT accept customer-portal audience tokens
    if (decoded.aud && decoded.aud !== "admin-portal") {
      return { status: "audience_mismatch" };
    }

    // Check role
    if (decoded.role !== "admin") {
      return { status: "unauthorized" };
    }

    return { status: "authorized" };
  });

  useEffect(() => {
    if (authState.status !== "authorized" && authState.status !== "missing_token") {
      if (authState.status === "expired") {
        console.warn("Admin session expired. Redirecting to admin login.");
      } else if (authState.status === "audience_mismatch") {
        console.error("Security Alert: Customer token attempted on Admin Protected route.");
      } else if (authState.status === "unauthorized") {
        console.error("Security Alert: Non-admin role in admin protected route.");
      }
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminUser");
    }
  }, [authState.status]);

  if (authState.status === "missing_token") {
    return (
      <Navigate
        to={location.pathname.startsWith("/admin") ? "/admin/login" : "/login"}
        state={{ from: location }}
        replace
      />
    );
  }

  if (authState.status !== "authorized") {
    return (
      <Navigate
        to={
          location.pathname.startsWith("/admin")
            ? `/admin/login?reason=${authState.status}`
            : `/login?reason=${authState.status}`
        }
        replace
      />
    );
  }

  return children;
}

export default AdminProtected;