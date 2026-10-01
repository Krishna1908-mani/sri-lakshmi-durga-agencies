import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api/axios";

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

      setForm({
        ...form,
        image: res.data.imageUrl,
      });

      alert("Main image uploaded successfully");
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

      setForm({
        ...form,
        images: res.data.imageUrls,
      });

      alert("Gallery images uploaded successfully");
    } catch (error) {
      console.log(error);
      alert("Gallery images upload failed");
    } finally {
      setUploading(false);
    }
  };

  const submitProduct = async (e) => {
    e.preventDefault();

    if (!form.image) {
      alert("Please upload main product image");
      return;
    }

    try {
      const productData = {
        name: form.name,
        category: form.category,
        price: Number(form.price),
        oldPrice: Number(form.oldPrice),
        sizes: form.sizes
          .split(",")
          .map((size) => size.trim())
          .filter((size) => size !== ""),
        colors: form.colors
          .split(",")
          .map((color) => color.trim())
          .filter((color) => color !== ""),
        fabric: form.fabric,
        stock: Number(form.stock),
        image: form.image,
        images: form.images.length > 0 ? form.images : [form.image],
        description: form.description,
      };

      await API.post("/products", productData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      alert("Product added successfully");
      navigate("/admin/products");
    } catch (error) {
      console.log(error);
      alert(error.response?.data?.message || "Failed to add product");
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div>
          <h1>Add Product</h1>
          <p>Add new product with main image and gallery images</p>
        </div>

        <Link to="/admin/products" className="back-btn">
          Back
        </Link>
      </div>

      <form className="admin-form" onSubmit={submitProduct}>
        <input
          name="name"
          placeholder="Product Name"
          value={form.name}
          onChange={handleChange}
          required
        />

        <input
          name="category"
          placeholder="Category example: Kurtis"
          value={form.category}
          onChange={handleChange}
          required
        />

        <input
          name="price"
          type="number"
          placeholder="Selling Price"
          value={form.price}
          onChange={handleChange}
          required
        />

        <input
          name="oldPrice"
          type="number"
          placeholder="Old Price"
          value={form.oldPrice}
          onChange={handleChange}
        />

        <input
          name="sizes"
          placeholder="Sizes example: S, M, L, XL"
          value={form.sizes}
          onChange={handleChange}
        />

        <input
          name="colors"
          placeholder="Colors example: Red, Blue, Pink"
          value={form.colors}
          onChange={handleChange}
        />

        <input
          name="fabric"
          placeholder="Fabric example: Cotton"
          value={form.fabric}
          onChange={handleChange}
        />

        <input
          name="stock"
          type="number"
          placeholder="Stock Quantity"
          value={form.stock}
          onChange={handleChange}
          required
        />

        <div className="upload-box">
          <label>Main Product Image</label>

          <input type="file" accept="image/*" onChange={uploadMainImage} />

          {mainImagePreview && (
            <img
              src={mainImagePreview}
              alt="Main Preview"
              className="upload-preview"
            />
          )}
        </div>

        <div className="upload-box">
          <label>Gallery Images</label>

          <input
            type="file"
            accept="image/*"
            multiple
            onChange={uploadGalleryImages}
          />

          {galleryPreviews.length > 0 && (
            <div className="gallery-preview-box">
              {galleryPreviews.map((img, index) => (
                <img key={index} src={img} alt="Gallery Preview" />
              ))}
            </div>
          )}
        </div>

        <input
          name="image"
          placeholder="Product Image URL"
          value={form.image}
          onChange={handleChange}
        />

        <textarea
          name="description"
          placeholder="Product Description"
          value={form.description}
          onChange={handleChange}
          required
        />

        <button type="submit" disabled={uploading}>
          {uploading ? "Uploading..." : "Add Product"}
        </button>
      </form>
    </div>
  );
}

export default AddProduct;