import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { 
  User, 
  ShieldCheck, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  LogIn, 
  AlertCircle, 
  CheckCircle2,
  ArrowRight
} from "lucide-react";
import API from "../api/axios";

function CustomerLogin({ initialRole }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Role can come from props (AdminLogin wrapper), searchParams (?role=admin), or default to "customer"
  const paramRole = searchParams.get("role");
  const defaultRole = initialRole || (paramRole === "admin" ? "admin" : "customer");

  const [role, setRole] = useState(defaultRole);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [switchSuggestion, setSwitchSuggestion] = useState(null);

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  // Keep role in sync if URL query parameter or initialRole prop changes
  useEffect(() => {
    if (initialRole) {
      setRole(initialRole);
    } else if (paramRole === "admin" || paramRole === "customer") {
      setRole(paramRole);
    }
  }, [initialRole, paramRole]);

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    setErrorMessage("");
    setSuccessMessage("");
    setSwitchSuggestion(null);

    // Update query params if on standard /login route
    if (!initialRole && location.pathname === "/login") {
      setSearchParams({ role: newRole });
    }
  };

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
    if (errorMessage) setErrorMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setSwitchSuggestion(null);
    setLoading(true);

    const trimmedEmail = form.email.trim().toLowerCase();

    try {
      // Use role-specific endpoint or unified /auth/login with role validation
      const endpoint = role === "admin" ? "/auth/admin/login" : "/auth/login";
      const payload = {
        email: trimmedEmail,
        password: form.password,
        role: role,
      };

      const res = await API.post(endpoint, payload);

      const returnedUser = res.data.user || {};
      const returnedRole = returnedUser.role || role;

      if (returnedRole === "admin" || role === "admin") {
        localStorage.setItem("adminToken", res.data.token);
        localStorage.setItem("adminName", returnedUser.name || "Admin");
        localStorage.setItem("adminEmail", returnedUser.email || trimmedEmail);

        setSuccessMessage("Admin authentication successful! Redirecting to Dashboard...");
        setTimeout(() => {
          navigate("/admin/dashboard");
        }, 600);
      } else {
        localStorage.setItem("userToken", res.data.token);
        localStorage.setItem("userName", returnedUser.name || "Customer");
        localStorage.setItem("userEmail", returnedUser.email || trimmedEmail);

        setSuccessMessage("Login successful! Welcome back.");
        const destination = location.state?.from || "/";
        setTimeout(() => {
          navigate(destination);
        }, 600);
      }
    } catch (error) {
      console.error("Login error:", error);
      const msg = error.response?.data?.message || "Login failed. Please check your credentials.";
      setErrorMessage(msg);

      if (msg.includes("switch to the Admin") || msg.includes("administrator privileges")) {
        setSwitchSuggestion(role === "customer" ? "admin" : "customer");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page auth-page">
      <div className="auth-box">
        {/* Role Switcher Tabs */}
        <div className="auth-role-switch" role="tablist" aria-label="Login Role Selection">
          <button
            type="button"
            role="tab"
            aria-selected={role === "customer"}
            className={`auth-role-btn ${role === "customer" ? "active" : ""}`}
            onClick={() => handleRoleChange("customer")}
          >
            <User size={16} />
            <span>Customer Login</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={role === "admin"}
            className={`auth-role-btn ${role === "admin" ? "active admin-active" : ""}`}
            onClick={() => handleRoleChange("admin")}
          >
            <ShieldCheck size={16} />
            <span>Admin Login</span>
          </button>
        </div>

        {/* Role Badge & Header */}
        <div className="auth-header-wrapper">
          <span className={`auth-badge ${role === "admin" ? "auth-badge-admin" : "auth-badge-customer"}`}>
            {role === "admin" ? <ShieldCheck size={13} /> : <User size={13} />}
            {role === "admin" ? "Administrator Access" : "Customer Portal"}
          </span>

          <h1>{role === "admin" ? "Admin Sign In" : "Customer Sign In"}</h1>
          <p>
            {role === "admin"
              ? "Sign in with management credentials to access store controls"
              : "Login to track orders, manage wishlist, and enjoy quick checkout"}
          </p>
        </div>

        {/* Feedback Messages */}
        {errorMessage && (
          <div className="auth-alert-box" role="alert">
            <AlertCircle size={18} className="alert-icon" />
            <div className="alert-content">
              <span>{errorMessage}</span>
              {switchSuggestion && (
                <button
                  type="button"
                  className="auth-switch-link-btn"
                  onClick={() => handleRoleChange(switchSuggestion)}
                >
                  Switch to {switchSuggestion === "admin" ? "Admin" : "Customer"} Login &rarr;
                </button>
              )}
            </div>
          </div>
        )}

        {successMessage && (
          <div className="auth-alert-box success" role="alert">
            <CheckCircle2 size={18} className="alert-icon" />
            <div className="alert-content">
              <span>{successMessage}</span>
            </div>
          </div>
        )}

        {/* Main Login Form */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="auth-input-group">
            <label htmlFor="auth-email">
              {role === "admin" ? "Admin Email Address" : "Customer Email Address"}
            </label>
            <div className="auth-input-inner">
              <Mail size={18} className="auth-input-icon" />
              <input
                id="auth-email"
                name="email"
                type="email"
                placeholder={role === "admin" ? "admin@srilakshmidurga.com" : "name@example.com"}
                value={form.email}
                onChange={handleChange}
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="auth-input-group">
            <label htmlFor="auth-password">Password</label>
            <div className="auth-input-inner">
              <Lock size={18} className="auth-input-icon" />
              <input
                id="auth-password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={form.password}
                onChange={handleChange}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="auth-input-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className={`auth-submit-btn ${role === "admin" ? "admin-btn" : ""}`}
            disabled={loading}
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <LogIn size={18} />
                <span>{role === "admin" ? "Sign In as Admin" : "Sign In as Customer"}</span>
              </>
            )}
          </button>

          {/* Customer Specific Links */}
          {role === "customer" && (
            <div className="auth-footer-links">
              <p className="forgot-link">
                <Link to="/forgot-password">Forgot Password?</Link>
              </p>
              <p className="register-prompt">
                New customer? <Link to="/register">Create an account <ArrowRight size={14} /></Link>
              </p>
            </div>
          )}

          {/* Admin Specific Notice */}
          {role === "admin" && (
            <div className="admin-security-note">
              <ShieldCheck size={15} />
              <span>Restricted access for authorized store personnel only</span>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

export { CustomerLogin };
export default CustomerLogin;