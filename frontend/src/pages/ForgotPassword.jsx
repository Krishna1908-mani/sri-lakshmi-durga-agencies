import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  KeyRound, 
  Mail, 
  Lock, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle,
  ShieldCheck
} from "lucide-react";
import API from "../api/axios";

function ForgotPassword() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [form, setForm] = useState({
    email: "",
    otp: "",
    newPassword: "",
    confirmPassword: "",
  });

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
    setLoading(true);

    try {
      await API.post("/auth/forgot-password", {
        email: form.email,
      });

      setSuccessMsg("OTP has been sent to your registered email");
      setStep(2);
    } catch (error) {
      console.log(error);
      setErrorMsg(error.response?.data?.message || "Failed to send OTP. Please check your email.");
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (form.newPassword !== form.confirmPassword) {
      setErrorMsg("New passwords do not match");
      return;
    }

    if (form.newPassword.length < 6) {
      setErrorMsg("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      await API.post("/auth/reset-password", {
        email: form.email,
        otp: form.otp,
        newPassword: form.newPassword,
      });

      alert("Password reset successful! Please sign in with your new password.");
      navigate("/login");
    } catch (error) {
      console.log(error);
      setErrorMsg(error.response?.data?.message || "Password reset failed. Invalid or expired OTP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page auth-page">
      <div className="auth-box">
        <div className="auth-header-wrapper">
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
                <label htmlFor="forgot-email">Registered Email</label>
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

              <button type="submit" className="auth-submit-btn" disabled={loading}>
                {loading ? <span>Sending OTP...</span> : <span>Send Verification OTP</span>}
              </button>
            </>
          ) : (
            <>
              <div className="auth-input-group">
                <label htmlFor="forgot-email-readonly">Registered Email</label>
                <div className="auth-input-inner">
                  <Mail size={18} className="auth-input-icon" />
                  <input
                    id="forgot-email-readonly"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="auth-input-group">
                <label htmlFor="forgot-otp">Enter OTP</label>
                <div className="auth-input-inner">
                  <KeyRound size={18} className="auth-input-icon" />
                  <input
                    id="forgot-otp"
                    name="otp"
                    placeholder="6-digit verification code"
                    value={form.otp}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="auth-input-group">
                <label htmlFor="forgot-new-pass">New Password</label>
                <div className="auth-input-inner">
                  <Lock size={18} className="auth-input-icon" />
                  <input
                    id="forgot-new-pass"
                    name="newPassword"
                    type="password"
                    placeholder="At least 6 characters"
                    value={form.newPassword}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="auth-input-group">
                <label htmlFor="forgot-confirm-pass">Confirm New Password</label>
                <div className="auth-input-inner">
                  <Lock size={18} className="auth-input-icon" />
                  <input
                    id="forgot-confirm-pass"
                    name="confirmPassword"
                    type="password"
                    placeholder="Confirm new password"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="auth-submit-btn" disabled={loading}>
                {loading ? <span>Resetting Password...</span> : <span>Update & Reset Password</span>}
              </button>
            </>
          )}

          <div className="auth-footer-links">
            <p className="register-prompt">
              Remember your password? <Link to="/login"><ArrowLeft size={14} /> Back to Sign In</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ForgotPassword;