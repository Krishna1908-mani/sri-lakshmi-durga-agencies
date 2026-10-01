import { useState } from "react";
import { Link } from "react-router-dom";
import API from "../api/axios";

function AdminSettings() {
  const token = localStorage.getItem("adminToken");
  const savedName = localStorage.getItem("adminName") || "Admin";

  const [form, setForm] = useState({
    name: savedName,
    email: "",
    currentPassword: "",
    newPassword: "",
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const updateAdmin = async (e) => {
    e.preventDefault();

    if (!form.currentPassword) {
      alert("Current password is required");
      return;
    }

    try {
      const res = await API.put("/auth/admin/update-profile", form, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      localStorage.setItem("adminName", res.data.user.name);

      alert("Admin settings updated successfully");

      setForm({
        name: res.data.user.name,
        email: res.data.user.email,
        currentPassword: "",
        newPassword: "",
      });
    } catch (error) {
      console.log(error);
      alert(error.response?.data?.message || "Failed to update admin");
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div>
          <h1>Admin Settings</h1>
          <p>Change admin email and password</p>
        </div>

        <Link to="/admin/dashboard" className="back-btn">
          Dashboard
        </Link>
      </div>

      <form className="admin-form" onSubmit={updateAdmin}>
        <input
          name="name"
          placeholder="Admin Name"
          value={form.name}
          onChange={handleChange}
          required
        />

        <input
          name="email"
          placeholder="New Admin Email"
          value={form.email}
          onChange={handleChange}
          required
        />

        <input
          name="currentPassword"
          type="password"
          placeholder="Current Password"
          value={form.currentPassword}
          onChange={handleChange}
          required
        />

        <input
          name="newPassword"
          type="password"
          placeholder="New Password - optional"
          value={form.newPassword}
          onChange={handleChange}
        />

        <button type="submit">Update Admin</button>
      </form>
    </div>
  );
}

export default AdminSettings;