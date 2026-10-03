import { Navigate, useLocation } from "react-router-dom";

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
 * SRI LAKSHMI DURGA AGENCIES — CUSTOMER AUTHENTICATION GUARD
 * Ensures customer routes require a valid, unexpired customer token.
 */
function CustomerProtected({ children }) {
  const location = useLocation();
  const token = localStorage.getItem("userToken");

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const decoded = decodeJwt(token);

  if (!decoded) {
    localStorage.removeItem("userToken");
    localStorage.removeItem("user");
    return <Navigate to="/login?reason=invalid" replace />;
  }

  // Check expiration
  if (decoded.exp && decoded.exp * 1000 < Date.now()) {
    localStorage.removeItem("userToken");
    localStorage.removeItem("user");
    return <Navigate to="/login?reason=expired" replace />;
  }

  // Check audience isolation: MUST NOT accept admin-portal tokens
  if (decoded.aud && decoded.aud === "admin-portal") {
    console.warn("Admin token presented at Customer Protected route. Please sign in as a customer.");
    localStorage.removeItem("userToken");
    localStorage.removeItem("user");
    return <Navigate to="/login?reason=portal_mismatch" replace />;
  }

  return children;
}

export default CustomerProtected;
