import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api/axios";

function ForgotPassword() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);

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
  };

  const sendOtp = async (e) => {
    e.preventDefault();

    try {
      await API.post("/auth/forgot-password", {
        email: form.email,
      });

      alert("OTP sent to your email");
      setStep(2);
    } catch (error) {
      console.log(error);
      alert(error.response?.data?.message || "Failed to send OTP");
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();

    if (form.newPassword !== form.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    if (form.newPassword.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }

    try {
      await API.post("/auth/reset-password", {
        email: form.email,
        otp: form.otp,
        newPassword: form.newPassword,
      });

      alert("Password reset successful. Login now");
      navigate("/login");
    } catch (error) {
      console.log(error);
      alert(error.response?.data?.message || "Password reset failed");
    }
  };

  return (
    <div className="auth-page">
      <form
        className="auth-box"
        onSubmit={step === 1 ? sendOtp : resetPassword}
      >
        <h1>Forgot Password</h1>

        {step === 1 ? (
          <>
            <p>Enter your registered email to receive OTP.</p>

            <input
              name="email"
              type="email"
              placeholder="Registered Email"
              value={form.email}
              onChange={handleChange}
              required
            />

            <button type="submit">Send OTP</button>
          </>
        ) : (
          <>
            <p>Enter OTP and set new password.</p>

            <input
              name="email"
              type="email"
              placeholder="Registered Email"
              value={form.email}
              onChange={handleChange}
              required
            />

            <input
              name="otp"
              placeholder="Enter OTP"
              value={form.otp}
              onChange={handleChange}
              required
            />

            <input
              name="newPassword"
              type="password"
              placeholder="New Password"
              value={form.newPassword}
              onChange={handleChange}
              required
            />

            <input
              name="confirmPassword"
              type="password"
              placeholder="Confirm New Password"
              value={form.confirmPassword}
              onChange={handleChange}
              required
            />

            <button type="submit">Reset Password</button>
          </>
        )}

        <p>
          Remember password? <Link to="/login">Login</Link>
        </p>
      </form>
    </div>
  );
}

export default ForgotPassword;