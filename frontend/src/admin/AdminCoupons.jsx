import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../api/axios";

function AdminCoupons() {
  const token = localStorage.getItem("adminToken");

  const [coupons, setCoupons] = useState([]);

  const [form, setForm] = useState({
    code: "",
    discountType: "PERCENT",
    discountValue: "",
    minOrderAmount: "",
  });

  const fetchCoupons = async () => {
    try {
      const res = await API.get("/coupons", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setCoupons(res.data.coupons);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    const loadCoupons = async () => {
      try {
        const res = await API.get("/coupons", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setCoupons(res.data.coupons);
      } catch (error) {
        console.log(error);
      }
    };

    loadCoupons();
  }, [token]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const createCoupon = async (e) => {
    e.preventDefault();

    try {
      await API.post(
        "/coupons",
        {
          code: form.code,
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

      alert("Coupon created successfully");

      setForm({
        code: "",
        discountType: "PERCENT",
        discountValue: "",
        minOrderAmount: "",
      });

      fetchCoupons();
    } catch (error) {
      console.log(error);
      alert("Failed to create coupon");
    }
  };

  const deleteCoupon = async (id) => {
    if (!window.confirm("Delete this coupon?")) return;

    try {
      await API.delete(`/coupons/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      alert("Coupon deleted");
      fetchCoupons();
    } catch (error) {
      console.log(error);
      alert("Failed to delete coupon");
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div>
          <h1>Manage Coupons</h1>
          <p>Create discount coupons for customers</p>
        </div>

        <Link to="/admin/dashboard" className="back-btn">
          Dashboard
        </Link>
      </div>

      <form className="admin-form" onSubmit={createCoupon}>
        <input
          name="code"
          placeholder="Coupon Code example: WELCOME10"
          value={form.code}
          onChange={handleChange}
          required
        />

        <select
          name="discountType"
          value={form.discountType}
          onChange={handleChange}
        >
          <option value="PERCENT">Percentage Discount</option>
          <option value="FLAT">Flat Amount Discount</option>
        </select>

        <input
          name="discountValue"
          type="number"
          placeholder="Discount Value"
          value={form.discountValue}
          onChange={handleChange}
          required
        />

        <input
          name="minOrderAmount"
          type="number"
          placeholder="Minimum Order Amount"
          value={form.minOrderAmount}
          onChange={handleChange}
          required
        />

        <button type="submit">Create Coupon</button>
      </form>

      <div className="admin-table-wrap coupon-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Type</th>
              <th>Value</th>
              <th>Min Order</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {coupons.map((coupon) => (
              <tr key={coupon._id}>
                <td>{coupon.code}</td>
                <td>{coupon.discountType}</td>
                <td>
                  {coupon.discountType === "PERCENT"
                    ? `${coupon.discountValue}%`
                    : `₹${coupon.discountValue}`}
                </td>
                <td>₹{coupon.minOrderAmount}</td>
                <td>
                  <button
                    className="delete-btn"
                    onClick={() => deleteCoupon(coupon._id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {coupons.length === 0 && <p>No coupons created yet.</p>}
      </div>
    </div>
  );
}

export default AdminCoupons;