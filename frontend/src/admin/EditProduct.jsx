import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import API from "../api/axios";

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

  const fetchProduct = async () => {
    try {
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
      alert("Failed to fetch product");
    }
  };

  useEffect(() => {
    fetchProduct();
  }, [id]);

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

      alert("Main image updated successfully");
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

      alert("Gallery images uploaded successfully");
    } catch (error) {
      console.log(error);
      alert("Gallery images upload failed");
    } finally {
      setUploading(false);
    }
  };

  const removeGalleryImage = (imgUrl) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((img) => img !== imgUrl),
    }));
  };

  const updateProduct = async (e) => {
    e.preventDefault();

    if (!form.image) {
      alert("Please upload main product image");
      return;
    }

    try {
      const finalImages = [
        form.image,
        ...form.images.filter((img) => img !== form.image),
      ];

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
        images: finalImages,
        description: form.description,
      };

      await API.put(`/products/${id}`, productData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      alert("Product updated successfully");
      navigate("/admin/products");
    } catch (error) {
      console.log(error);
      alert(error.response?.data?.message || "Failed to update product");
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div>
          <h1>Edit Product</h1>
          <p>Update product details, main image and gallery images</p>
        </div>

        <Link to="/admin/products" className="back-btn">
          Back
        </Link>
      </div>

      <form className="admin-form" onSubmit={updateProduct}>
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

          {form.image && (
            <img
              src={form.image}
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

          {form.images.length > 0 && (
            <div className="gallery-preview-box">
              {form.images.map((img, index) => (
                <div className="gallery-preview-item" key={index}>
                  <img src={img} alt="Gallery Preview" />

                  <button
                    type="button"
                    onClick={() => removeGalleryImage(img)}
                  >
                    ×
                  </button>
                </div>
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
          {uploading ? "Uploading..." : "Update Product"}
        </button>
      </form>
    </div>
  );
}

export default EditProduct;