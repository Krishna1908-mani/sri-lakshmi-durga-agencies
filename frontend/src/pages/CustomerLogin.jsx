import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  LogIn, 
  AlertCircle, 
  CheckCircle2,
  ArrowRight,
  ShieldAlert
} from "lucide-react";
import API from "../api/axios";

function CustomerLogin() {
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isAdminAccount, setIsAdminAccount] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
    if (errorMessage) {
      setErrorMessage("");
      setIsAdminAccount(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsAdminAccount(false);
    setLoading(true);

    const trimmedEmail = form.email.trim().toLowerCase();

    if (!trimmedEmail || !form.password) {
      setErrorMessage("Please enter both email and password.");
      setLoading(false);
      return;
    }

    try {
      const res = await API.post("/auth/login", {
        email: trimmedEmail,
        password: form.password,
        role: "customer",
      });

      const returnedUser = res.data.user || {};

      localStorage.setItem("userToken", res.data.token);
      localStorage.setItem("userName", returnedUser.name || "Customer");
      localStorage.setItem("userEmail", returnedUser.email || trimmedEmail);
      if (returnedUser.id) {
        localStorage.setItem("userId", returnedUser.id);
      }

      setSuccessMessage("Login successful! Welcome back.");
      
      const destination = location.state?.from || "/profile";
      setTimeout(() => {
        navigate(destination);
      }, 500);
    } catch (error) {
      const respData = error.response?.data;
      if (respData?.isAdminAccount) {
        setIsAdminAccount(true);
        setErrorMessage(respData.message || "This account is an Administrator. Please use the Admin Portal.");
      } else {
        setErrorMessage(
          respData?.message || "Invalid email or password. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page auth-page customer-portal-page">
      <div className="auth-box customer-auth-box">
        {/* Brand Header */}
        <div className="auth-header-wrapper">
          <Link to="/" className="auth-logo-link" title="Return to Home">
            <img src="/logo.png" alt="Sri Lakshmi Durga Agencies" className="auth-brand-logo" />
          </Link>

          <span className="auth-badge auth-badge-customer">
            <User size={13} />
            <span>Customer Portal</span>
          </span>

          <h1>Welcome Back</h1>
          <p>Sign in to your customer account to track orders and manage your wishlist.</p>
        </div>

        {/* Feedback Messages */}
        {errorMessage && (
          <div className="auth-alert-box" role="alert">
            {isAdminAccount ? (
              <ShieldAlert size={18} className="alert-icon" />
            ) : (
              <AlertCircle size={18} className="alert-icon" />
            )}
            <div className="alert-content">
              <span>{errorMessage}</span>
              {isAdminAccount && (
                <Link to="/admin/login" className="auth-switch-link-btn">
                  Go to Admin Portal &rarr;
                </Link>
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

        {/* Customer Login Form */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="auth-input-group">
            <label htmlFor="customer-email">Email Address</label>
            <div className="auth-input-inner">
              <Mail size={18} className="auth-input-icon" />
              <input
                id="customer-email"
                name="email"
                type="email"
                placeholder="name@example.com"
                value={form.email}
                onChange={handleChange}
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="auth-input-group">
            <div className="label-with-action">
              <label htmlFor="customer-password">Password</label>
              <Link to="/forgot-password" className="forgot-password-link">
                Forgot Password?
              </Link>
            </div>
            <div className="auth-input-inner">
              <Lock size={18} className="auth-input-icon" />
              <input
                id="customer-password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your account password"
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
            className="auth-submit-btn customer-btn"
            disabled={loading}
          >
            {loading ? (
              <span>Signing In...</span>
            ) : (
              <>
                <LogIn size={18} />
                <span>Sign In as Customer</span>
              </>
            )}
          </button>

          <div className="auth-footer-links">
            <p className="register-prompt">
              New to Sri Lakshmi Durga Agencies?{" "}
              <Link to="/register">
                Create Account <ArrowRight size={13} />
              </Link>
            </p>
          </div>

          {/* Discreet Admin Portal Link */}
          <div className="portal-switch-footer">
            <span>Store Staff or Administrator?</span>
            <Link to="/admin/login" className="portal-switch-link">
              Admin Portal &rarr;
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CustomerLogin;
export { CustomerLogin };