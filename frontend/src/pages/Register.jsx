import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  UserPlus, 
  Sparkles, 
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Check,
  X
} from "lucide-react";
import API from "../api/axios";

function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    marketing_emails_enabled: true,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [touched, setTouched] = useState({});

  // Dynamic Password Rules Evaluation
  const passwordRules = useMemo(() => {
    const pwd = form.password || "";
    return {
      minLength: pwd.length >= 8,
      hasUpper: /[A-Z]/.test(pwd),
      hasLower: /[a-z]/.test(pwd),
      hasNumber: /\d/.test(pwd),
      hasSpecial: /[^A-Za-z0-9]/.test(pwd),
    };
  }, [form.password]);

  const isPasswordValid =
    passwordRules.minLength &&
    passwordRules.hasUpper &&
    passwordRules.hasLower &&
    passwordRules.hasNumber &&
    passwordRules.hasSpecial;

  // Name Validation
  const nameError = useMemo(() => {
    if (!touched.name && !form.name) return "";
    const trimmed = form.name.trim();
    if (!trimmed) {
      return "Full name is required.";
    }
    if (!/^[A-Za-z ]+$/.test(trimmed)) {
      return "Name can contain letters and spaces only.";
    }
    return "";
  }, [form.name, touched.name]);

  // Email Validation
  const emailError = useMemo(() => {
    if (!touched.email && !form.email) return "";
    const trimmed = form.email.trim();
    if (!trimmed) {
      return "Email address is required.";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      return "Please enter a valid email address.";
    }
    return "";
  }, [form.email, touched.email]);

  // Confirm Password Validation
  const confirmPasswordError = useMemo(() => {
    if (!touched.confirmPassword && !form.confirmPassword) return "";
    if (form.confirmPassword !== form.password) {
      return "Passwords do not match.";
    }
    return "";
  }, [form.password, form.confirmPassword, touched.confirmPassword]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errorMsg) setErrorMsg("");
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const registerUser = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    // Mark all fields touched
    setTouched({
      name: true,
      email: true,
      password: true,
      confirmPassword: true,
    });

    const trimmedName = form.name.trim();
    if (!trimmedName || !/^[A-Za-z ]+$/.test(trimmedName)) {
      setErrorMsg("Name can contain letters and spaces only.");
      return;
    }

    const trimmedEmail = form.email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }

    if (!isPasswordValid) {
      setErrorMsg("Password must meet all strong security criteria below.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await API.post("/auth/register", {
        name: trimmedName,
        email: trimmedEmail,
        password: form.password,
        confirmPassword: form.confirmPassword,
        marketing_emails_enabled: form.marketing_emails_enabled,
      });

      localStorage.setItem("userToken", res.data.token);
      localStorage.setItem("userName", res.data.user.name);
      localStorage.setItem("userEmail", res.data.user.email);
      if (res.data.user.id) {
        localStorage.setItem("userId", res.data.user.id);
      }

      setSuccessMsg("Account created successfully! Welcome to Sri Lakshmi Durga Agencies.");

      setTimeout(() => {
        navigate("/shop");
      }, 700);
    } catch (error) {
      setErrorMsg(
        error.response?.data?.message || "Registration failed. Email may already be registered."
      );
    } finally {
      setLoading(false);
    }
  };

  const isFormSubmittable =
    form.name.trim() &&
    /^[A-Za-z ]+$/.test(form.name.trim()) &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()) &&
    isPasswordValid &&
    form.confirmPassword === form.password &&
    !loading;

  return (
    <div className="page auth-page customer-portal-page">
      <div className="auth-box customer-auth-box">
        {/* Brand Header */}
        <div className="auth-header-wrapper">
          <Link to="/" className="auth-logo-link" title="Return to Home">
            <img src="/logo.png" alt="Sri Lakshmi Durga Agencies" className="auth-brand-logo" />
          </Link>

          <span className="auth-badge auth-badge-customer">
            <Sparkles size={13} />
            <span>Join Sri Lakshmi Durga</span>
          </span>

          <h1>Create Account</h1>
          <p>Register to easily track orders, save wishlists, and enjoy seamless checkout</p>
        </div>

        {errorMsg && (
          <div className="auth-alert-box" role="alert">
            <AlertCircle size={18} className="alert-icon" />
            <div className="alert-content">
              <span>{errorMsg}</span>
            </div>
          </div>
        )}

        {successMsg && (
          <div className="auth-alert-box success" role="alert">
            <CheckCircle2 size={18} className="alert-icon" />
            <div className="alert-content">
              <span>{successMsg}</span>
            </div>
          </div>
        )}

        <form onSubmit={registerUser} noValidate>
          {/* Full Name */}
          <div className="auth-input-group">
            <label htmlFor="reg-name">Full Name</label>
            <div className="auth-input-inner">
              <User size={18} className="auth-input-icon" />
              <input
                id="reg-name"
                name="name"
                type="text"
                placeholder="e.g. Krishna Teja"
                value={form.name}
                onChange={handleChange}
                onBlur={() => handleBlur("name")}
                required
                autoComplete="name"
              />
            </div>
            {nameError && <p className="inline-validation-error">{nameError}</p>}
          </div>

          {/* Email Address */}
          <div className="auth-input-group">
            <label htmlFor="reg-email">Email Address</label>
            <div className="auth-input-inner">
              <Mail size={18} className="auth-input-icon" />
              <input
                id="reg-email"
                type="email"
                name="email"
                placeholder="name@example.com"
                value={form.email}
                onChange={handleChange}
                onBlur={() => handleBlur("email")}
                required
                autoComplete="email"
              />
            </div>
            {emailError && <p className="inline-validation-error">{emailError}</p>}
          </div>

          {/* Password */}
          <div className="auth-input-group">
            <label htmlFor="reg-password">Password</label>
            <div className="auth-input-inner">
              <Lock size={18} className="auth-input-icon" />
              <input
                id="reg-password"
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Create a strong password"
                value={form.password}
                onChange={handleChange}
                onBlur={() => handleBlur("password")}
                required
                autoComplete="new-password"
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

            {/* Dynamic Password Strength Indicators */}
            <div className="password-criteria-box" aria-live="polite">
              <div className="criteria-header">Password must contain:</div>
              <ul className="criteria-list">
                <li className={passwordRules.minLength ? "valid" : "invalid"}>
                  {passwordRules.minLength ? <Check size={14} className="rule-icon ok" /> : <X size={14} className="rule-icon fail" />}
                  <span>Minimum 8 characters</span>
                </li>
                <li className={passwordRules.hasUpper ? "valid" : "invalid"}>
                  {passwordRules.hasUpper ? <Check size={14} className="rule-icon ok" /> : <X size={14} className="rule-icon fail" />}
                  <span>One uppercase letter (A-Z)</span>
                </li>
                <li className={passwordRules.hasLower ? "valid" : "invalid"}>
                  {passwordRules.hasLower ? <Check size={14} className="rule-icon ok" /> : <X size={14} className="rule-icon fail" />}
                  <span>One lowercase letter (a-z)</span>
                </li>
                <li className={passwordRules.hasNumber ? "valid" : "invalid"}>
                  {passwordRules.hasNumber ? <Check size={14} className="rule-icon ok" /> : <X size={14} className="rule-icon fail" />}
                  <span>One number (0-9)</span>
                </li>
                <li className={passwordRules.hasSpecial ? "valid" : "invalid"}>
                  {passwordRules.hasSpecial ? <Check size={14} className="rule-icon ok" /> : <X size={14} className="rule-icon fail" />}
                  <span>One special character (e.g. @, #, $, %)</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="auth-input-group">
            <label htmlFor="reg-confirm-password">Confirm Password</label>
            <div className="auth-input-inner">
              <Lock size={18} className="auth-input-icon" />
              <input
                id="reg-confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="Re-enter your password"
                value={form.confirmPassword}
                onChange={handleChange}
                onBlur={() => handleBlur("confirmPassword")}
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                className="auth-input-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {confirmPasswordError && (
              <p className="inline-validation-error">{confirmPasswordError}</p>
            )}
          </div>

          {/* Promotional Email Opt-in */}
          <div className="marketing-optin-group">
            <label className="checkbox-label" htmlFor="reg-marketing">
              <input
                id="reg-marketing"
                type="checkbox"
                name="marketing_emails_enabled"
                checked={form.marketing_emails_enabled}
                onChange={handleChange}
              />
              <span>Receive offers and promotional emails from Sri Lakshmi Durga Agencies</span>
            </label>
          </div>

          <button
            type="submit"
            className="auth-submit-btn customer-btn"
            disabled={!isFormSubmittable}
          >
            {loading ? (
              <span>Creating Account...</span>
            ) : (
              <>
                <UserPlus size={18} />
                <span>Create Customer Account</span>
              </>
            )}
          </button>

          <div className="auth-footer-links">
            <p className="register-prompt">
              Already have an account?{" "}
              <Link to="/login" className="login-link-highlight">
                Sign in here <ArrowRight size={14} />
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Register;