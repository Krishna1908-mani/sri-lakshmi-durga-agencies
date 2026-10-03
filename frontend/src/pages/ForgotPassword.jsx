import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  KeyRound, 
  Mail, 
  Lock, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  EyeOff,
  Check,
  X
} from "lucide-react";
import API from "../api/axios";

function ForgotPassword() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [form, setForm] = useState({
    email: "",
    otp: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Dynamic Password Rules Evaluation
  const passwordRules = useMemo(() => {
    const pwd = form.newPassword || "";
    return {
      minLength: pwd.length >= 8,
      hasUpper: /[A-Z]/.test(pwd),
      hasLower: /[a-z]/.test(pwd),
      hasNumber: /\d/.test(pwd),
      hasSpecial: /[^A-Za-z0-9]/.test(pwd),
    };
  }, [form.newPassword]);

  const isPasswordValid =
    passwordRules.minLength &&
    passwordRules.hasUpper &&
    passwordRules.hasLower &&
    passwordRules.hasNumber &&
    passwordRules.hasSpecial;

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
    if (errorMsg) setErrorMsg("");
  };

  const sendOtp = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const trimmedEmail = (form.email || "").trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }

    setLoading(true);

    try {
      await API.post("/auth/forgot-password", {
        email: trimmedEmail,
      });

      setSuccessMsg("OTP has been sent to your registered email address.");
      setStep(2);
    } catch (error) {
      setErrorMsg(error.response?.data?.message || "Failed to send OTP. Please check your email.");
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!form.otp || !form.otp.trim()) {
      setErrorMsg("Please enter the 6-digit OTP sent to your email.");
      return;
    }

    if (!isPasswordValid) {
      setErrorMsg("New password must meet all strong security criteria below.");
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await API.post("/auth/reset-password", {
        email: (form.email || "").trim().toLowerCase(),
        otp: form.otp.trim(),
        newPassword: form.newPassword,
      });

      setSuccessMsg("Password reset successfully! Redirecting to login...");
      setTimeout(() => {
        navigate("/login");
      }, 1000);
    } catch (error) {
      setErrorMsg(error.response?.data?.message || "Password reset failed. Invalid or expired OTP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page auth-page customer-portal-page">
      <div className="auth-box customer-auth-box">
        <div className="auth-header-wrapper">
          <Link to="/" className="auth-logo-link" title="Return to Home">
            <img src="/logo.png" alt="Sri Lakshmi Durga Agencies" className="auth-brand-logo" />
          </Link>

          <span className="auth-badge auth-badge-customer">
            <KeyRound size={13} />
            <span>Account Recovery</span>
          </span>

          <h1>Forgot Password</h1>
          <p>
            {step === 1
              ? "Enter your registered email address to receive a verification OTP"
              : "Enter the OTP sent to your email and set your new password"}
          </p>
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

        <form onSubmit={step === 1 ? sendOtp : resetPassword} noValidate>
          {step === 1 ? (
            <>
              <div className="auth-input-group">
                <label htmlFor="forgot-email">Registered Email Address</label>
                <div className="auth-input-inner">
                  <Mail size={18} className="auth-input-icon" />
                  <input
                    id="forgot-email"
                    name="email"
                    type="email"
                    placeholder="Enter your registered email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="auth-submit-btn customer-btn"
                disabled={loading}
              >
                {loading ? "Sending Verification OTP..." : "Send Verification OTP"}
              </button>
            </>
          ) : (
            <>
              <div className="auth-input-group">
                <label htmlFor="forgot-otp">6-Digit Verification OTP</label>
                <div className="auth-input-inner">
                  <KeyRound size={18} className="auth-input-icon" />
                  <input
                    id="forgot-otp"
                    name="otp"
                    type="text"
                    maxLength={6}
                    placeholder="Enter 6-digit OTP"
                    value={form.otp}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="auth-input-group">
                <label htmlFor="forgot-new-password">New Password</label>
                <div className="auth-input-inner">
                  <Lock size={18} className="auth-input-icon" />
                  <input
                    id="forgot-new-password"
                    name="newPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new strong password"
                    value={form.newPassword}
                    onChange={handleChange}
                    required
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

                {/* Password Criteria */}
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

              <div className="auth-input-group">
                <label htmlFor="forgot-confirm-password">Confirm New Password</label>
                <div className="auth-input-inner">
                  <Lock size={18} className="auth-input-icon" />
                  <input
                    id="forgot-confirm-password"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    required
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
              </div>

              <button
                type="submit"
                className="auth-submit-btn customer-btn"
                disabled={loading || !isPasswordValid || form.newPassword !== form.confirmPassword}
              >
                {loading ? "Resetting Password..." : "Reset Password"}
              </button>
            </>
          )}

          <div className="auth-footer-links">
            <Link to="/login" className="back-to-login-link">
              <ArrowLeft size={16} />
              <span>Back to Sign In</span>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ForgotPassword;