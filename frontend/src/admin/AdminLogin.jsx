import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";

function AdminLogin() {
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

  const loginAdmin = async (e) => {
    e.preventDefault();

    try {
      const res = await API.post("/auth/admin/login", {
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });

      localStorage.setItem("adminToken", res.data.token);
      localStorage.setItem("adminName", res.data.user.name);
      localStorage.setItem("adminEmail", res.data.user.email);

      alert("Admin login successful");
      navigate("/admin/dashboard");
    } catch (error) {
      console.log(error);
      alert(error.response?.data?.message || "Invalid admin email or password");
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-box" onSubmit={loginAdmin}>
        <h1>Admin Login</h1>
        <p>Login to manage your store</p>

        <input
          name="email"
          type="email"
          placeholder="Admin Email"
          value={form.email}
          onChange={handleChange}
          required
        />

        <input
          name="password"
          type="password"
          placeholder="Admin Password"
          value={form.password}
          onChange={handleChange}
          required
        />

        <button type="submit">Login</button>
      </form>
    </div>
  );
}

export default AdminLogin;