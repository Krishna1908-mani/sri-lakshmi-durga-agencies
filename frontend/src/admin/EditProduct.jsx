import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { 
  Save, 
  Upload, 
  Image as ImageIcon, 
  ArrowLeft,
  Trash2
} from "lucide-react";
import API from "../api/axios";
import AdminNavbar from "./AdminNavbar";

function EditProduct() {
  const { id } = useParams();
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

  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchProduct = useCallback(async () => {
    try {
      setLoading(true);
      const res = await API.get(`/products/${id}`);
      const product = res.data.product;

      setForm({
        name: product.name || "",
        category: product.category || "",
        price: product.price || "",
        oldPrice: product.oldPrice || "",
        sizes: product.sizes ? product.sizes.join(", ") : "",
        colors: product.colors ? product.colors.join(", ") : "",
        fabric: product.fabric || "",
        stock: product.stock || "",
        image: product.image || "",
        images: product.images || [],
        description: product.description || "",
      });
    } catch (error) {
      console.log(error);
      alert("Failed to fetch product details");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const uploadMainImage = async (e) => {
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

      setForm((prev) => ({
        ...prev,
        image: res.data.imageUrl,
      }));

      alert("Main image updated successfully!");
    } catch (error) {
      console.log(error);
      alert("Image upload failed");
    } finally {
      setUploading(false);
    }
  };

  const uploadGalleryImages = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

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
        images: [...prev.images, ...res.data.imageUrls],
      }));

      alert("Gallery images uploaded successfully!");
    } catch (error) {
      console.log(error);
      alert("Gallery images upload failed");
    } finally {
      setUploading(false);
    }
  };

  const updateProduct = async (e) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      await API.put(
        `/products/${id}`,
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

      alert("Product updated successfully!");
      navigate("/admin/products");
    } catch (error) {
      console.log(error);
      alert(error.response?.data?.message || "Failed to update product");
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
            <h1>Edit Product</h1>
            <p>Update inventory, pricing, sizing, or imagery for this item</p>
          </div>

          <div className="top-bar-actions">
            <Link to="/admin/products" className="secondary-btn">
              <ArrowLeft size={16} />
              <span>Back to Products</span>
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="admin-loading-card">
            <div className="loading-spinner"></div>
            <p>Loading product details...</p>
          </div>
        ) : (
          <form className="admin-form-container" onSubmit={updateProduct}>
            {/* General Info */}
            <div className="admin-form-card">
              <h2 className="form-card-title">General Information</h2>

              <div className="admin-form-grid">
                <div className="form-group span-2">
                  <label htmlFor="edit-name">Product Name *</label>
                  <input
                    id="edit-name"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="edit-category">Category *</label>
                  <input
                    id="edit-category"
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="edit-fabric">Fabric Details</label>
                  <input
                    id="edit-fabric"
                    name="fabric"
                    value={form.fabric}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>

                <div className="form-group span-2">
                  <label htmlFor="edit-desc">Description *</label>
                  <textarea
                    id="edit-desc"
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    className="form-textarea"
                    rows={4}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Pricing & Stock */}
            <div className="admin-form-card">
              <h2 className="form-card-title">Pricing & Inventory</h2>

              <div className="admin-form-grid">
                <div className="form-group">
                  <label htmlFor="edit-price">Selling Price (₹) *</label>
                  <input
                    id="edit-price"
                    name="price"
                    type="number"
                    value={form.price}
                    onChange={handleChange}
                    className="form-input"
                    min="0"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="edit-oldprice">Original / Strikethrough Price (₹)</label>
                  <input
                    id="edit-oldprice"
                    name="oldPrice"
                    type="number"
                    value={form.oldPrice}
                    onChange={handleChange}
                    className="form-input"
                    min="0"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="edit-stock">Available Warehouse Stock *</label>
                  <input
                    id="edit-stock"
                    name="stock"
                    type="number"
                    value={form.stock}
                    onChange={handleChange}
                    className="form-input"
                    min="0"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="edit-sizes">Sizes (Comma separated)</label>
                  <input
                    id="edit-sizes"
                    name="sizes"
                    value={form.sizes}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>

                <div className="form-group span-2">
                  <label htmlFor="edit-colors">Colors (Comma separated)</label>
                  <input
                    id="edit-colors"
                    name="colors"
                    value={form.colors}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>
              </div>
            </div>

            {/* Media Upload */}
            <div className="admin-form-card">
              <h2 className="form-card-title">Product Media & Images</h2>

              <div className="media-upload-section">
                <div className="upload-block">
                  <label>Change Main Image</label>
                  <div className="file-input-card">
                    <Upload size={24} className="upload-icon" />
                    <span>Upload replacement image</span>
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
                      value={form.image}
                      onChange={handleChange}
                      className="form-input"
                    />
                  </div>

                  {form.image && (
                    <div className="image-preview-box">
                      <img src={form.image} alt="Main" className="preview-img" />
                    </div>
                  )}
                </div>

                <div className="upload-block">
                  <label>Additional Gallery Images</label>
                  <div className="file-input-card">
                    <ImageIcon size={24} className="upload-icon" />
                    <span>Select images to append</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={uploadGalleryImages}
                      className="file-input-hidden"
                    />
                  </div>

                  {form.images && form.images.length > 0 && (
                    <div className="gallery-previews-grid">
                      {form.images.map((img, i) => (
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
                <Save size={18} />
                <span>{submitting ? "Saving Changes..." : "Save Product Changes"}</span>
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}

export default EditProduct;