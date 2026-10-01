import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api/axios";

function CustomerLogin() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const loginCustomer = async (e) => {
    e.preventDefault();

    try {
      const res = await API.post("/auth/login", form);

      localStorage.setItem("userToken", res.data.token);
      localStorage.setItem("userName", res.data.user.name);
      localStorage.setItem("userEmail", res.data.user.email);

      alert("Login successful");
      navigate("/");
    } catch (error) {
      console.log(error);
      alert(error.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-box" onSubmit={loginCustomer}>
        <h1>Customer Login</h1>
        <p>Login to view your orders</p>

        <input
          name="email"
          type="email"
          placeholder="Email Address"
          value={form.email}
          onChange={handleChange}
          required
        />

        <input
          name="password"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          required
        />

        <button type="submit">Login</button>

        <p className="forgot-link">
          <Link to="/forgot-password">Forgot Password?</Link>
        </p>

        <p>
          New customer? <Link to="/register">Create account</Link>
        </p>
      </form>
    </div>
  );
}

export default CustomerLogin;