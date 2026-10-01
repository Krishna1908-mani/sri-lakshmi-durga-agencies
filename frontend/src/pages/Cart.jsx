import { Link } from "react-router-dom";
import { 
  ShoppingBag, 
  Trash2, 
  Plus, 
  Minus, 
  ArrowRight, 
  ShieldCheck, 
  Truck, 
  Sparkles,
  AlertCircle
} from "lucide-react";
import { useCart } from "../context/CartContext";

function Cart() {
  const {
    cartItems,
    increaseQuantity,
    decreaseQuantity,
    removeFromCart,
    totalAmount,
  } = useCart();

  const freeDeliveryThreshold = 999;
  const isFreeDelivery = totalAmount >= freeDeliveryThreshold;
  const deliveryCharge = isFreeDelivery ? 0 : 50;
  const finalAmount = totalAmount + deliveryCharge;
  const amountNeededForFreeDelivery = freeDeliveryThreshold - totalAmount;

  const totalItemCount = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);

  if (cartItems.length === 0) {
    return (
      <div className="page cart-page">
        <div className="cart-empty-state">
          <div className="empty-cart-illustration">
            <ShoppingBag size={52} strokeWidth={1.5} className="empty-cart-icon" />
          </div>
          <h2>Your Shopping Bag is Empty</h2>
          <p>Explore our curated collection of ladies clothing, kurtis, dresses, and essentials.</p>
          <Link to="/shop" className="primary-btn empty-cart-cta">
            <ShoppingBag size={18} />
            <span>Start Shopping Now</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page cart-page">
      {/* Page Header */}
      <div className="cart-page-header">
        <div>
          <div className="cart-title-row">
            <h1>Shopping Bag</h1>
            <span className="cart-count-pill">{totalItemCount} {totalItemCount === 1 ? "Item" : "Items"}</span>
          </div>
          <p className="cart-subtitle">Review your selected items before proceeding to checkout</p>
        </div>

        <Link to="/shop" className="continue-shopping-top-link">
          <span>Continue Shopping</span>
          <ArrowRight size={15} />
        </Link>
      </div>

      {/* Free Delivery Tracker Bar */}
      <div className="free-delivery-tracker-banner">
        <div className="tracker-icon-box">
          <Truck size={18} />
        </div>
        <div className="tracker-text-area">
          {isFreeDelivery ? (
            <p className="tracker-text success">
              <strong>Congratulations!</strong> You have unlocked <strong>FREE Delivery</strong> on this order.
            </p>
          ) : (
            <p className="tracker-text">
              Add <strong>₹{amountNeededForFreeDelivery?.toLocaleString("en-IN")}</strong> more to qualify for <strong>FREE Delivery</strong>!
            </p>
          )}
          <div className="tracker-progress-track">
            <div 
              className="tracker-progress-fill" 
              style={{ width: `${Math.min(100, Math.round((totalAmount / freeDeliveryThreshold) * 100))}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Main 70/30 Split Layout */}
      <div className="cart-layout">
        {/* Left Column: Product Items */}
        <div className="cart-items">
          {cartItems.map((item) => {
            const isMaxStock = item.quantity >= item.stock;
            const itemKey = `${item.productId}-${item.selectedSize}`;

            return (
              <article className="cart-item-card" key={itemKey}>
                <div className="cart-item-image-wrap">
                  <img src={item.image} alt={item.name} className="cart-item-img" />
                </div>

                <div className="cart-item-info">
                  <div className="cart-item-header">
                    <h3 className="cart-item-title">{item.name}</h3>
                    <button
                      type="button"
                      className="cart-remove-icon-btn"
                      onClick={() => removeFromCart(item.productId, item.selectedSize)}
                      title="Remove product"
                      aria-label={`Remove ${item.name} from cart`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="cart-item-meta-row">
                    {item.selectedSize && (
                      <span className="cart-size-pill">
                        Size: <strong>{item.selectedSize}</strong>
                      </span>
                    )}
                    <span className="cart-unit-price">
                      ₹{item.price?.toLocaleString("en-IN")} each
                    </span>
                  </div>

                  {isMaxStock && (
                    <div className="stock-warning-banner">
                      <AlertCircle size={14} />
                      <span>Max stock reached ({item.stock} available)</span>
                    </div>
                  )}

                  <div className="cart-item-actions-row">
                    {/* Stepper Quantity Control */}
                    <div className="cart-stepper">
                      <button
                        type="button"
                        className="stepper-btn"
                        onClick={() => decreaseQuantity(item.productId, item.selectedSize)}
                        aria-label="Decrease quantity"
                      >
                        <Minus size={14} />
                      </button>

                      <span className="stepper-value">{item.quantity}</span>

                      <button
                        type="button"
                        disabled={isMaxStock}
                        className={`stepper-btn ${isMaxStock ? "disabled-btn" : ""}`}
                        onClick={() => increaseQuantity(item.productId, item.selectedSize)}
                        aria-label="Increase quantity"
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    {/* Subtotal */}
                    <div className="cart-item-subtotal">
                      <span className="subtotal-label">Subtotal:</span>
                      <span className="subtotal-amount">
                        ₹{(item.price * item.quantity)?.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* Right Column: Order Summary */}
        <aside className="cart-summary-sidebar">
          <div className="cart-summary-card">
            <h2 className="summary-title">Order Summary</h2>

            <div className="summary-row">
              <span className="summary-label">Items Subtotal</span>
              <span className="summary-val">₹{totalAmount?.toLocaleString("en-IN")}</span>
            </div>

            <div className="summary-row">
              <span className="summary-label">Estimated Delivery</span>
              <span className="summary-val">
                {deliveryCharge === 0 ? (
                  <span className="text-free-delivery">FREE</span>
                ) : (
                  `₹${deliveryCharge}`
                )}
              </span>
            </div>

            <div className="summary-divider"></div>

            <div className="summary-total-row">
              <span className="total-label">Grand Total</span>
              <span className="total-val">₹{finalAmount?.toLocaleString("en-IN")}</span>
            </div>

            <p className="tax-inclusive-note">Inclusive of all applicable taxes</p>

            <Link to="/checkout" className="primary-btn checkout-cta-btn">
              <span>Proceed to Checkout</span>
              <ArrowRight size={18} />
            </Link>

            <Link to="/shop" className="secondary-btn continue-shopping-cta">
              <span>Continue Shopping</span>
            </Link>

            {/* Trust Assurances */}
            <div className="summary-trust-assurances">
              <div className="assurance-bullet">
                <ShieldCheck size={16} className="assurance-icon" />
                <span>100% Secure Checkout via Razorpay or COD</span>
              </div>
              <div className="assurance-bullet">
                <Sparkles size={16} className="assurance-icon" />
                <span>Wholesale & Retail Authentic Quality</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default Cart;