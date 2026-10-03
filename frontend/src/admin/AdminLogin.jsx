import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  AlertTriangle, 
  CheckCircle2,
  KeyRound,
  Sparkles
} from "lucide-react";
import API from "../api/axios";

function AdminLogin() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // If already logged in as admin, redirect directly to dashboard
  useEffect(() => {
    const existingToken = localStorage.getItem("adminToken");
    if (existingToken) {
      navigate("/admin/dashboard", { replace: true });
    }
  }, [navigate]);

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
    setLoading(true);

    const trimmedEmail = form.email.trim().toLowerCase();

    if (!trimmedEmail || !form.password) {
      setErrorMessage("Please enter both admin email and password.");
      setLoading(false);
      return;
    }

    try {
      const res = await API.post("/auth/admin/login", {
        email: trimmedEmail,
        password: form.password,
      });

      const adminUser = res.data.user || {};

      localStorage.setItem("adminToken", res.data.token);
      localStorage.setItem("adminName", adminUser.name || "Administrator");
      localStorage.setItem("adminEmail", adminUser.email || trimmedEmail);

      setSuccessMessage("Authentication confirmed. Launching Admin Control Center...");

      setTimeout(() => {
        navigate("/admin/dashboard", { replace: true });
      }, 500);
    } catch (error) {
      const resp = error.response?.data;
      setErrorMessage(
        resp?.message || "Invalid administrative credentials or unauthorized access."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-portal-login-page">
      <div className="admin-portal-login-card">
        {/* Security Crest & Header */}
        <div className="admin-portal-header">
          <div className="admin-portal-emblem-wrap">
            <img 
              src="/logo.png" 
              alt="Sri Lakshmi Durga Agencies Emblem" 
              className="admin-portal-logo-img" 
            />
            <div className="admin-shield-icon-badge">
              <ShieldCheck size={16} />
            </div>
          </div>

          <span className="admin-portal-security-badge">
            <KeyRound size={12} />
            <span>SECURE MANAGEMENT PORTAL</span>
          </span>

          <h1>Admin Control Center</h1>
          <p className="admin-portal-subtext">
            Restricted access for store managers & operators. Please authenticate with administrative credentials.
          </p>
        </div>

        {/* Feedback Messages */}
        {errorMessage && (
          <div className="admin-portal-alert error" role="alert">
            <AlertTriangle size={18} className="alert-icon" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="admin-portal-alert success" role="alert">
            <CheckCircle2 size={18} className="alert-icon" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Admin Login Form */}
        <form onSubmit={handleSubmit} noValidate className="admin-portal-form">
          <div className="admin-portal-field">
            <label htmlFor="admin-email">Administrator Email</label>
            <div className="admin-portal-input-wrap">
              <Mail size={18} className="field-icon" />
              <input
                id="admin-email"
                name="email"
                type="email"
                placeholder="admin@srilakshmidurga.com"
                value={form.email}
                onChange={handleChange}
                required
                autoComplete="email"
                autoFocus
              />
            </div>
          </div>

          <div className="admin-portal-field">
            <label htmlFor="admin-password">Security Password</label>
            <div className="admin-portal-input-wrap">
              <Lock size={18} className="field-icon" />
              <input
                id="admin-password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter admin access password"
                value={form.password}
                onChange={handleChange}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="admin-pwd-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="admin-portal-submit-btn"
            disabled={loading}
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <ShieldCheck size={18} />
                <span>Authorize & Enter Dashboard</span>
              </>
            )}
          </button>
        </form>

        {/* Portal Notice & Store Link */}
        <div className="admin-portal-footer">
          <div className="admin-audit-note">
            <Sparkles size={13} />
            <span>Protected administrative environment. All sessions are encrypted and logged.</span>
          </div>

          <Link to="/" className="admin-return-store-link">
            <ArrowLeft size={14} />
            <span>Return to Customer Storefront</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;