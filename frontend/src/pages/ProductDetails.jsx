import { useParams, Link, useNavigate } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import { useCart } from "../context/CartContext";
import API from "../api/axios";

function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedImage, setSelectedImage] = useState("");
  const [showImageZoom, setShowImageZoom] = useState(false);

  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    comment: "",
  });

  const userToken = localStorage.getItem("userToken");

  const saveRecentlyViewed = (productData) => {
    const savedItems = JSON.parse(
      localStorage.getItem("recentlyViewed") || "[]"
    );

    const productToSave = {
      _id: productData._id,
      name: productData.name,
      category: productData.category,
      price: productData.price,
      oldPrice: productData.oldPrice,
      stock: productData.stock,
      image: productData.image,
      rating: productData.rating,
      numReviews: productData.numReviews,
    };

    const filteredItems = savedItems.filter(
      (item) => item._id !== productData._id
    );

    const updatedItems = [productToSave, ...filteredItems].slice(0, 8);

    localStorage.setItem("recentlyViewed", JSON.stringify(updatedItems));
  };

  const fetchProduct = useCallback(async () => {
    try {
      const res = await API.get(`/products/${id}`);
      const productData = res.data.product;

      saveRecentlyViewed(productData);

      setProduct(productData);

      const gallery =
        productData.images && productData.images.length > 0
          ? productData.images
          : [productData.image];

      setSelectedImage(gallery[0]);

      if (productData.sizes && productData.sizes.length > 0) {
        setSelectedSize(productData.sizes[0]);
      }
    } catch (error) {
      console.log("Product fetch error:", error);
    }
  }, [id]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  const handleReviewChange = (e) => {
    setReviewForm({ ...reviewForm, [e.target.name]: e.target.value });
  };

  const submitReview = async (e) => {
    e.preventDefault();

    if (!userToken) {
      alert("Please login to add review");
      navigate("/login");
      return;
    }

    try {
      await API.post(`/products/${id}/reviews`, reviewForm, {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });

      alert("Review added successfully");

      setReviewForm({
        rating: 5,
        comment: "",
      });

      fetchProduct();
    } catch (error) {
      console.log(error);
      alert(error.response?.data?.message || "Failed to add review");
    }
  };

  if (!product) {
    return (
      <div className="page">
        <h2>Loading product...</h2>
      </div>
    );
  }

  const isOutOfStock = product.stock <= 0;

  const galleryImages =
    product.images && product.images.length > 0
      ? product.images
      : [product.image];

  return (
    <div className="page">
      <div className="product-details">
        <div className="product-image-box">
          <img
            src={selectedImage}
            alt={product.name}
            className="zoomable-product-image"
            onClick={() => setShowImageZoom(true)}
          />

          <p className="zoom-hint">Click image to zoom</p>

          <div className="product-thumbnails">
            {galleryImages.map((img, index) => (
              <img
                key={index}
                src={img}
                alt={product.name}
                className={selectedImage === img ? "active-thumb" : ""}
                onClick={() => setSelectedImage(img)}
              />
            ))}
          </div>
        </div>

        <div className="details-content">
          <p className="product-category">{product.category}</p>

          <h1>{product.name}</h1>

          <p className="product-rating">
            ⭐ {product.rating ? product.rating.toFixed(1) : "0.0"} / 5
            <span> ({product.numReviews || 0} reviews)</span>
          </p>

          <p className="price big-price">
            ₹{product.price} <span>₹{product.oldPrice}</span>
          </p>

          <p className="details-desc">{product.description}</p>

          <div className="details-box">
            <p>
              <strong>Fabric:</strong> {product.fabric}
            </p>

            <p>
              <strong>Stock:</strong>{" "}
              {isOutOfStock ? "Out of Stock" : `${product.stock} available`}
            </p>
          </div>

          {product.sizes && product.sizes.length > 0 && (
            <div className="size-box">
              <h3>Select Size</h3>

              <div>
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    className={selectedSize === size ? "selected-size" : ""}
                    onClick={() => setSelectedSize(size)}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            className={
              isOutOfStock
                ? "primary-btn details-btn disabled-btn"
                : "primary-btn details-btn"
            }
            disabled={isOutOfStock}
            onClick={() => addToCart(product, selectedSize)}
          >
            {isOutOfStock ? "Out of Stock" : "Add to Cart"}
          </button>

          <Link to="/cart" className="secondary-btn details-btn">
            Go to Cart
          </Link>
        </div>
      </div>

      <div className="reviews-section">
        <div className="reviews-header">
          <h2>Customer Reviews</h2>
          <p>Read reviews or share your experience</p>
        </div>

        <div className="review-form-box">
          <h3>Write a Review</h3>

          <form onSubmit={submitReview}>
            <select
              name="rating"
              value={reviewForm.rating}
              onChange={handleReviewChange}
            >
              <option value="5">5 - Excellent</option>
              <option value="4">4 - Very Good</option>
              <option value="3">3 - Good</option>
              <option value="2">2 - Average</option>
              <option value="1">1 - Poor</option>
            </select>

            <textarea
              name="comment"
              placeholder="Write your review..."
              value={reviewForm.comment}
              onChange={handleReviewChange}
              required
            />

            <button type="submit">Submit Review</button>
          </form>
        </div>

        {product.reviews && product.reviews.length > 0 ? (
          <div className="reviews-list">
            {product.reviews.map((review) => (
              <div className="review-card" key={review._id}>
                <div>
                  <h3>{review.userName}</h3>
                  <p>⭐ {review.rating} / 5</p>
                </div>

                <p>{review.comment}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-products">
            <h2>No reviews yet</h2>
            <p>Be the first customer to review this product.</p>
          </div>
        )}
      </div>

      {showImageZoom && (
        <div
          className="image-zoom-overlay"
          onClick={() => setShowImageZoom(false)}
        >
          <button className="zoom-close-btn">×</button>

          <img
            src={selectedImage}
            alt={product.name}
            className="image-zoom-large"
          />
        </div>
      )}
    </div>
  );
}

export default ProductDetails;