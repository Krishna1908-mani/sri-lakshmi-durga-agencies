import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../api/axios";

function AdminBanner() {
  const token = localStorage.getItem("adminToken");

  const [form, setForm] = useState({
    smallText: "",
    title: "",
    description: "",
    offerText: "",
    image: "",
  });

  const [uploading, setUploading] = useState(false);

  const fetchBanner = async () => {
    try {
      const res = await API.get("/home-banner");
      setForm(res.data.banner);
    } catch (error) {
      console.log(error);
      alert("Failed to fetch banner");
    }
  };

  useEffect(() => {
    fetchBanner();
  }, []);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const uploadBannerImage = async (e) => {
    const file = e.target.files[0];

    if (!file) return;

    const imageData = new FormData();
    imageData.append("image", file);

    try {
      setUploading(true);

      const res = await API.post("/upload/product-image", imageData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setForm({
        ...form,
        image: res.data.imageUrl,
      });

      alert("Banner image uploaded successfully");
    } catch (error) {
      console.log(error);
      alert("Banner image upload failed");
    } finally {
      setUploading(false);
    }
  };

  const updateBanner = async (e) => {
    e.preventDefault();

    try {
      await API.put("/home-banner", form, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      alert("Home banner updated successfully");
    } catch (error) {
      console.log(error);
      alert("Failed to update banner");
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div>
          <h1>Home Banner Control</h1>
          <p>Update homepage hero section content</p>
        </div>

        <Link to="/admin/dashboard" className="back-btn">
          Dashboard
        </Link>
      </div>

      <form className="admin-form" onSubmit={updateBanner}>
        <input
          name="smallText"
          placeholder="Small welcome text"
          value={form.smallText}
          onChange={handleChange}
          required
        />

        <input
          name="title"
          placeholder="Main banner title"
          value={form.title}
          onChange={handleChange}
          required
        />

        <textarea
          name="description"
          placeholder="Banner description"
          value={form.description}
          onChange={handleChange}
          required
        />

        <input
          name="offerText"
          placeholder="Offer text example: Up to 40% OFF"
          value={form.offerText}
          onChange={handleChange}
          required
        />

        <div className="upload-box">
          <label>Banner Image</label>

          <input type="file" accept="image/*" onChange={uploadBannerImage} />

          {form.image && (
            <img src={form.image} alt="Banner" className="banner-preview" />
          )}
        </div>

        <input
          name="image"
          placeholder="Banner Image URL"
          value={form.image}
          onChange={handleChange}
        />

        <button type="submit" disabled={uploading}>
          {uploading ? "Uploading..." : "Update Banner"}
        </button>
      </form>
    </div>
  );
}

export default AdminBanner;