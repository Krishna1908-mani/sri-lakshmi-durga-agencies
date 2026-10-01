import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { 
  Tag, 
  PlusCircle, 
  Trash2, 
  Percent, 
  IndianRupee, 
  Sparkles,
  CheckCircle2,
  Calendar
} from "lucide-react";
import API from "../api/axios";
import AdminNavbar from "./AdminNavbar";

function AdminCoupons() {
  const token = localStorage.getItem("adminToken");

  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    code: "",
    discountType: "PERCENT",
    discountValue: "",
    minOrderAmount: "",
  });

  const fetchCoupons = useCallback(async () => {
    try {
      setLoading(true);
      const res = await API.get("/coupons", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setCoupons(res.data.coupons || []);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const createCoupon = async (e) => {
    e.preventDefault();

    if (!form.code.trim()) {
      alert("Please enter a coupon code");
      return;
    }

    try {
      setSubmitting(true);
      await API.post(
        "/coupons",
        {
          code: form.code.trim().toUpperCase(),
          discountType: form.discountType,
          discountValue: Number(form.discountValue),
          minOrderAmount: Number(form.minOrderAmount),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert("Coupon created successfully!");

      setForm({
        code: "",
        discountType: "PERCENT",
        discountValue: "",
        minOrderAmount: "",
      });

      fetchCoupons();
    } catch (error) {
      console.log(error);
      alert(error.response?.data?.message || "Failed to create coupon");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteCoupon = async (id, code) => {
    if (!window.confirm(`Are you sure you want to delete coupon ${code}?`)) return;

    try {
      await API.delete(`/coupons/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      alert("Coupon deleted successfully");
      fetchCoupons();
    } catch (error) {
      console.log(error);
      alert("Failed to delete coupon");
    }
  };

  return (
    <div className="admin-page-layout">
      <AdminNavbar />

      <main className="admin-main-content">
        <div className="admin-page-top-bar">
          <div>
            <h1>Promotional Coupons</h1>
            <p>Create discount vouchers to boost conversion during sales & festivals</p>
          </div>
        </div>

        {/* 2-Column Split: Create on Left, Active List on Right */}
        <div className="admin-coupons-split-grid">
          {/* Create Coupon Form Card */}
          <div className="admin-form-card">
            <div className="form-card-title-row">
              <PlusCircle size={20} className="card-title-icon" />
              <h2>Create New Coupon</h2>
            </div>

            <form onSubmit={createCoupon}>
              <div className="form-group">
                <label htmlFor="coupon-code">Coupon Code *</label>
                <input
                  id="coupon-code"
                  name="code"
                  placeholder="e.g. FESTIVE20, WELCOME100"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  className="form-input"
                  style={{ textTransform: "uppercase", fontWeight: 700 }}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="coupon-type">Discount Type *</label>
                <select
                  id="coupon-type"
                  name="discountType"
                  value={form.discountType}
                  onChange={handleChange}
                  className="admin-select"
                >
                  <option value="PERCENT">Percentage Discount (%)</option>
                  <option value="FLAT">Flat Cash Discount (₹)</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="coupon-val">
                  Discount Value ({form.discountType === "PERCENT" ? "%" : "₹"}) *
                </label>
                <input
                  id="coupon-val"
                  name="discountValue"
                  type="number"
                  placeholder={form.discountType === "PERCENT" ? "e.g. 15 (for 15% off)" : "e.g. 200 (for ₹200 off)"}
                  value={form.discountValue}
                  onChange={handleChange}
                  className="form-input"
                  min="1"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="coupon-min">Minimum Order Amount (₹) *</label>
                <input
                  id="coupon-min"
                  name="minOrderAmount"
                  type="number"
                  placeholder="e.g. 999"
                  value={form.minOrderAmount}
                  onChange={handleChange}
                  className="form-input"
                  min="0"
                  required
                />
              </div>

              <button
                type="submit"
                className="primary-btn create-coupon-submit-btn"
                disabled={submitting}
              >
                <PlusCircle size={16} />
                <span>{submitting ? "Generating Coupon..." : "Publish Coupon"}</span>
              </button>
            </form>
          </div>

          {/* Active Coupons List Card */}
          <div className="admin-table-card">
            <div className="table-card-header-sub">
              <h2>Active Store Coupons ({coupons.length})</h2>
              <p>Coupons currently valid for checkout validation</p>
            </div>

            {loading ? (
              <div className="admin-loading-card">
                <div className="loading-spinner"></div>
                <p>Loading coupons...</p>
              </div>
            ) : coupons.length === 0 ? (
              <div className="admin-empty-card">
                <Tag size={36} />
                <h3>No coupons generated yet</h3>
                <p>Use the form on the left to launch your first promotional discount.</p>
              </div>
            ) : (
              <div className="coupons-cards-stream">
                {coupons.map((coupon) => (
                  <div className="coupon-ticket-card" key={coupon._id}>
                    <div className="ticket-left">
                      <div className="ticket-code-row">
                        <Tag size={16} className="ticket-icon" />
                        <strong className="ticket-code">{coupon.code}</strong>
                        <span className="ticket-badge">Active</span>
                      </div>
                      <div className="ticket-perks">
                        <span>
                          {coupon.discountType === "PERCENT"
                            ? `${coupon.discountValue}% OFF on entire cart`
                            : `Flat ₹${coupon.discountValue} Instant Discount`}
                        </span>
                        <span className="min-order-sub">
                          Valid on orders above ₹{coupon.minOrderAmount}
                        </span>
                      </div>
                    </div>

                    <div className="ticket-right">
                      <button
                        type="button"
                        className="delete-coupon-btn"
                        onClick={() => deleteCoupon(coupon._id, coupon.code)}
                        title="Delete coupon"
                      >
                        <Trash2 size={16} />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default AdminCoupons;