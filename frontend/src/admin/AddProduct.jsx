import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  PlusCircle, 
  Upload, 
  Image as ImageIcon, 
  ArrowLeft
} from "lucide-react";
import API from "../api/axios";
import AdminNavbar from "./AdminNavbar";

function AddProduct() {
  const navigate = useNavigate();
  const token = localStorage.getItem("adminToken");

  const [form, setForm] = useState({
    name: "",
    category: "",
    price: "",
    oldPrice: "",
    sizes: "",
    colors: "",
    fabric: "",
    stock: "",
    image: "",
    images: [],
    description: "",
  });

  const [mainImagePreview, setMainImagePreview] = useState("");
  const [galleryPreviews, setGalleryPreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const uploadMainImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setMainImagePreview(previewUrl);

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

      setForm((prev) => ({
        ...prev,
        image: res.data.imageUrl,
      }));

      alert("Main image uploaded successfully!");
    } catch (error) {
      console.log(error);
      alert("Main image upload failed");
    } finally {
      setUploading(false);
    }
  };

  const uploadGalleryImages = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const previews = files.map((file) => URL.createObjectURL(file));
    setGalleryPreviews(previews);

    const imageData = new FormData();
    files.forEach((file) => {
      imageData.append("images", file);
    });

    try {
      setUploading(true);
      const res = await API.post("/upload/product-images", imageData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setForm((prev) => ({
        ...prev,
        images: res.data.imageUrls,
      }));

      alert("Gallery images uploaded successfully!");
    } catch (error) {
      console.log(error);
      alert("Gallery images upload failed");
    } finally {
      setUploading(false);
    }
  };

  const createProduct = async (e) => {
    e.preventDefault();

    if (!form.image) {
      alert("Please upload or enter a main image URL");
      return;
    }

    try {
      setSubmitting(true);
      await API.post(
        "/products",
        {
          ...form,
          price: Number(form.price),
          oldPrice: form.oldPrice ? Number(form.oldPrice) : 0,
          stock: Number(form.stock),
          sizes: form.sizes
            ? form.sizes.split(",").map((s) => s.trim()).filter(Boolean)
            : [],
          colors: form.colors
            ? form.colors.split(",").map((c) => c.trim()).filter(Boolean)
            : [],
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert("Product created successfully!");
      navigate("/admin/products");
    } catch (error) {
      console.log(error);
      alert(error.response?.data?.message || "Failed to create product");
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
            <h1>Add New Product</h1>
            <p>Create a new product listing in your catalog</p>
          </div>

          <div className="top-bar-actions">
            <Link to="/admin/products" className="secondary-btn">
              <ArrowLeft size={16} />
              <span>Back to Products</span>
            </Link>
          </div>
        </div>

        <form className="admin-form-container" onSubmit={createProduct}>
          {/* Section 1: General Info */}
          <div className="admin-form-card">
            <h2 className="form-card-title">General Information</h2>

            <div className="admin-form-grid">
              <div className="form-group span-2">
                <label htmlFor="prod-name">Product Title *</label>
                <input
                  id="prod-name"
                  name="name"
                  placeholder="e.g. Embroidered Anarkali Kurti with Dupatta"
                  value={form.name}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="prod-cat">Category *</label>
                <input
                  id="prod-cat"
                  name="category"
                  placeholder="e.g. Kurtis, Dresses, Tops, Essentials"
                  value={form.category}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="prod-fabric">Fabric Details</label>
                <input
                  id="prod-fabric"
                  name="fabric"
                  placeholder="e.g. Pure Cotton, Rayon, Silk Blend"
                  value={form.fabric}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>

              <div className="form-group span-2">
                <label htmlFor="prod-desc">Product Description *</label>
                <textarea
                  id="prod-desc"
                  name="description"
                  placeholder="Describe the fabric quality, stitching, occasion suitability, fit, and care instructions..."
                  value={form.description}
                  onChange={handleChange}
                  className="form-textarea"
                  rows={4}
                  required
                />
              </div>
            </div>
          </div>

          {/* Section 2: Pricing & Stock */}
          <div className="admin-form-card">
            <h2 className="form-card-title">Pricing & Inventory</h2>

            <div className="admin-form-grid">
              <div className="form-group">
                <label htmlFor="prod-price">Selling Price (₹) *</label>
                <input
                  id="prod-price"
                  name="price"
                  type="number"
                  placeholder="e.g. 799"
                  value={form.price}
                  onChange={handleChange}
                  className="form-input"
                  min="0"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="prod-oldprice">Original / Strikethrough Price (₹)</label>
                <input
                  id="prod-oldprice"
                  name="oldPrice"
                  type="number"
                  placeholder="e.g. 1299"
                  value={form.oldPrice}
                  onChange={handleChange}
                  className="form-input"
                  min="0"
                />
              </div>

              <div className="form-group">
                <label htmlFor="prod-stock">Available Warehouse Stock *</label>
                <input
                  id="prod-stock"
                  name="stock"
                  type="number"
                  placeholder="e.g. 25"
                  value={form.stock}
                  onChange={handleChange}
                  className="form-input"
                  min="0"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="prod-sizes">Sizes (Comma separated)</label>
                <input
                  id="prod-sizes"
                  name="sizes"
                  placeholder="e.g. S, M, L, XL, XXL, Free Size"
                  value={form.sizes}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>

              <div className="form-group span-2">
                <label htmlFor="prod-colors">Colors (Comma separated)</label>
                <input
                  id="prod-colors"
                  name="colors"
                  placeholder="e.g. Maroon, Emerald Green, Navy Blue, Mustard"
                  value={form.colors}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Media Upload */}
          <div className="admin-form-card">
            <h2 className="form-card-title">Product Media & Images</h2>

            <div className="media-upload-section">
              <div className="upload-block">
                <label>Main Product Image *</label>
                <div className="file-input-card">
                  <Upload size={24} className="upload-icon" />
                  <span>Choose file or drag & drop</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={uploadMainImage}
                    className="file-input-hidden"
                  />
                </div>

                <div className="manual-url-wrap">
                  <span className="or-text">or Image URL</span>
                  <input
                    name="image"
                    placeholder="https://example.com/image.jpg"
                    value={form.image}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>

                {(mainImagePreview || form.image) && (
                  <div className="image-preview-box">
                    <img
                      src={mainImagePreview || form.image}
                      alt="Main Preview"
                      className="preview-img"
                    />
                  </div>
                )}
              </div>

              <div className="upload-block">
                <label>Additional Gallery Images</label>
                <div className="file-input-card">
                  <ImageIcon size={24} className="upload-icon" />
                  <span>Select multiple images</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={uploadGalleryImages}
                    className="file-input-hidden"
                  />
                </div>

                {galleryPreviews.length > 0 && (
                  <div className="gallery-previews-grid">
                    {galleryPreviews.map((img, i) => (
                      <img key={i} src={img} alt={`Gallery ${i}`} className="gallery-thumb" />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="admin-form-actions">
            <button
              type="submit"
              className="primary-btn submit-product-btn"
              disabled={uploading || submitting}
            >
              <PlusCircle size={18} />
              <span>{submitting ? "Publishing Product..." : "Publish Product"}</span>
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

export default AddProduct;