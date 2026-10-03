import { useEffect, useState } from "react";
import { 
  Upload, 
  Save, 
  Sparkles, 
  Tag, 
  Eye,
  ArrowRight
} from "lucide-react";
import API from "../api/axios";
import AdminNavbar from "./AdminNavbar";

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
  const [submitting, setSubmitting] = useState(false);

  const fetchBanner = async () => {
    try {
      const res = await API.get("/home-banner");
      if (res.data.banner) {
        setForm(res.data.banner);
      }
    } catch (error) {
      console.log(error);
      alert("Failed to fetch home banner");
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
      const res = await API.post("/home-banner/upload", imageData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setForm((prev) => ({
        ...prev,
        image: res.data.imageUrl || res.data.url,
      }));

      alert("Banner image uploaded successfully!");
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
      setSubmitting(true);
      await API.put("/home-banner", form, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      alert("Homepage hero banner updated successfully!");
    } catch (error) {
      console.log(error);
      alert("Failed to update banner");
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
            <h1>Hero Banner Control</h1>
            <p>Customize the headline, promotional badges, and visual imagery of the storefront hero</p>
          </div>
        </div>

        {/* Live Preview of Hero Banner */}
        <div className="banner-preview-showcase">
          <div className="preview-label-tag">
            <Eye size={14} />
            <span>LIVE HOMEPAGE PREVIEW</span>
          </div>

          <div className="banner-live-hero-card">
            <div className="live-hero-content">
              <span className="live-hero-badge">
                <Sparkles size={13} />
                <span>{form.smallText || "Welcome to Sri Lakshmi Durga Agencies"}</span>
              </span>
              <h2 className="live-hero-heading">{form.title || "Elegant Ladies Clothing & Essentials"}</h2>
              <p className="live-hero-desc">
                {form.description || "Shop beautiful kurtis, dresses, tops, essentials and accessories at wholesale & retail prices."}
              </p>
              <div className="live-hero-mock-btn">
                <span>Shop Now</span>
                <ArrowRight size={14} />
              </div>
            </div>

            <div className="live-hero-visual">
              {form.image ? (
                <img src={form.image} alt="Hero Banner Preview" className="live-hero-image" />
              ) : (
                <div className="live-hero-placeholder">
                  <Sparkles size={32} />
                  <span>No image uploaded</span>
                </div>
              )}

              {form.offerText && (
                <div className="live-hero-offer-tag">
                  <Tag size={13} />
                  <span>{form.offerText}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Controls Form Card */}
        <div className="admin-form-card">
          <h2 className="form-card-title">Banner Content Parameters</h2>

          <form onSubmit={updateBanner}>
            <div className="admin-form-grid">
              <div className="form-group span-2">
                <label htmlFor="banner-small">Welcome Badge Text *</label>
                <input
                  id="banner-small"
                  name="smallText"
                  placeholder="e.g. Special Festive Collection 2026"
                  value={form.smallText}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group span-2">
                <label htmlFor="banner-title">Main Hero Headline *</label>
                <input
                  id="banner-title"
                  name="title"
                  placeholder="e.g. Authentic Silk Kurtis & Modern Daily Essentials"
                  value={form.title}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group span-2">
                <label htmlFor="banner-desc">Supporting Description *</label>
                <textarea
                  id="banner-desc"
                  name="description"
                  placeholder="Summarize the brand offer and style variety..."
                  value={form.description}
                  onChange={handleChange}
                  className="form-textarea"
                  rows={3}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="banner-offer">Offer Tag Text *</label>
                <input
                  id="banner-offer"
                  name="offerText"
                  placeholder="e.g. Up to 40% OFF or Flat ₹200 OFF"
                  value={form.offerText}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="banner-url">Banner Image URL (or upload below)</label>
                <input
                  id="banner-url"
                  name="image"
                  placeholder="https://example.com/banner.jpg"
                  value={form.image}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>

              <div className="form-group span-2">
                <label>Upload Banner Image File</label>
                <div className="file-input-card">
                  <Upload size={24} className="upload-icon" />
                  <span>Choose new banner image file</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={uploadBannerImage}
                    className="file-input-hidden"
                  />
                </div>
              </div>
            </div>

            <div className="admin-form-actions">
              <button
                type="submit"
                className="primary-btn submit-product-btn"
                disabled={uploading || submitting}
              >
                <Save size={16} />
                <span>{uploading ? "Uploading File..." : submitting ? "Saving..." : "Save Banner Changes"}</span>
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default AdminBanner;