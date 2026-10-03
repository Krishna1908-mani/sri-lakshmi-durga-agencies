import { useState } from "react";
import { 
  User, 
  Mail, 
  Lock, 
  Save, 
  ShieldCheck, 
  KeyRound
} from "lucide-react";
import API from "../api/axios";
import AdminNavbar from "./AdminNavbar";

function AdminSettings() {
  const token = localStorage.getItem("adminToken");
  const savedName = localStorage.getItem("adminName") || "Admin";

  const [form, setForm] = useState({
    name: savedName,
    email: "",
    currentPassword: "",
    newPassword: "",
  });

  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const updateAdmin = async (e) => {
    e.preventDefault();

    if (!form.currentPassword) {
      alert("Current password is required to verify changes");
      return;
    }

    try {
      setSubmitting(true);
      const res = await API.put("/auth/admin/update-profile", form, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      localStorage.setItem("adminName", res.data.user.name);

      alert("Admin credentials updated successfully!");

      setForm({
        name: res.data.user.name,
        email: res.data.user.email,
        currentPassword: "",
        newPassword: "",
      });
    } catch (error) {
      console.log(error);
      alert(error.response?.data?.message || "Failed to update admin profile");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-page-layout">
      <AdminNavbar />

      <main className="admin-main-content">
        <div className="admin-page-top-bar">
          <div>
            <h1>Admin Security & Profile</h1>
            <p>Update administrator display name, contact email, and administrative password</p>
          </div>
        </div>

        <div className="admin-settings-container">
          <div className="admin-form-card">
            <div className="form-card-title-row">
              <ShieldCheck size={20} className="card-title-icon" />
              <h2>Credentials & Access</h2>
            </div>

            <form onSubmit={updateAdmin}>
              <div className="form-group">
                <label htmlFor="adm-name">Administrator Name *</label>
                <div className="input-with-icon">
                  <User size={16} className="input-prefix-icon" />
                  <input
                    id="adm-name"
                    name="name"
                    placeholder="Admin Name"
                    value={form.name}
                    onChange={handleChange}
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="adm-email">New Admin Email *</label>
                <div className="input-with-icon">
                  <Mail size={16} className="input-prefix-icon" />
                  <input
                    id="adm-email"
                    name="email"
                    type="email"
                    placeholder="admin@srilakshmidurga.com"
                    value={form.email}
                    onChange={handleChange}
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="adm-currpass">Current Password (Required for verification) *</label>
                <div className="input-with-icon">
                  <KeyRound size={16} className="input-prefix-icon" />
                  <input
                    id="adm-currpass"
                    name="currentPassword"
                    type="password"
                    placeholder="Enter current password"
                    value={form.currentPassword}
                    onChange={handleChange}
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="adm-newpass">New Password (Leave blank to keep unchanged)</label>
                <div className="input-with-icon">
                  <Lock size={16} className="input-prefix-icon" />
                  <input
                    id="adm-newpass"
                    name="newPassword"
                    type="password"
                    placeholder="Enter new secure password (optional)"
                    value={form.newPassword}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="admin-form-actions">
                <button
                  type="submit"
                  className="primary-btn save-settings-btn"
                  disabled={submitting}
                >
                  <Save size={16} />
                  <span>{submitting ? "Updating..." : "Save Credentials"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AdminSettings;