import { useState } from "react";
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
  AlertCircle
} from "lucide-react";
import API from "../api/axios";

function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errorMsg) setErrorMsg("");
  };

  const registerUser = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      const res = await API.post("/auth/register", form);

      localStorage.setItem("userToken", res.data.token);
      localStorage.setItem("userName", res.data.user.name);
      localStorage.setItem("userEmail", res.data.user.email);

      alert("Account created successfully!");
      navigate("/shop");
    } catch (error) {
      console.log(error);
      setErrorMsg(error.response?.data?.message || "Registration failed. Email may already be registered.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page auth-page">
      <div className="auth-box">
        <div className="auth-header-wrapper">
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

        <form onSubmit={registerUser} noValidate>
          <div className="auth-input-group">
            <label htmlFor="reg-name">Full Name</label>
            <div className="auth-input-inner">
              <User size={18} className="auth-input-icon" />
              <input
                id="reg-name"
                name="name"
                placeholder="Enter your full name"
                value={form.name}
                onChange={handleChange}
                required
                autoComplete="name"
              />
            </div>
          </div>

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
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="auth-input-group">
            <label htmlFor="reg-password">Password</label>
            <div className="auth-input-inner">
              <Lock size={18} className="auth-input-icon" />
              <input
                id="reg-password"
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="At least 6 characters"
                value={form.password}
                onChange={handleChange}
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
          </div>

          <button type="submit" className="auth-submit-btn" disabled={loading}>
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
              Already have an account? <Link to="/login">Sign in here <ArrowRight size={14} /></Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Register;