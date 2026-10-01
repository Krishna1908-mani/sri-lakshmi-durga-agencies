import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";

function Cart() {
  const {
    cartItems,
    increaseQuantity,
    decreaseQuantity,
    removeFromCart,
    totalAmount,
  } = useCart();

  const deliveryCharge = totalAmount >= 999 ? 0 : 50;
  const finalAmount = totalAmount + deliveryCharge;

  if (cartItems.length === 0) {
    return (
      <div className="page">
        <div className="no-products">
          <h2>Your cart is empty</h2>
          <p>Add products to cart and continue shopping.</p>

          <Link to="/shop" className="primary-btn">
            Shop Now
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Shopping Cart</h1>
        <p>Review your products before checkout</p>
      </div>

      <div className="cart-layout">
        <div className="cart-items">
          {cartItems.map((item) => (
            <div
              className="cart-item"
              key={`${item.productId}-${item.selectedSize}`}
            >
              <img src={item.image} alt={item.name} />

              <div className="cart-item-info">
                <h3>{item.name}</h3>

                {item.selectedSize && (
                  <p>
                    <strong>Size:</strong> {item.selectedSize}
                  </p>
                )}

                <p>
                  <strong>Price:</strong> ₹{item.price}
                </p>

                <p>
                  <strong>Stock:</strong> {item.stock}
                </p>

                {item.quantity >= item.stock && (
                  <p className="stock-warning">
                    Maximum available stock reached
                  </p>
                )}
              </div>

              <div className="quantity-box">
                <button
                  onClick={() =>
                    decreaseQuantity(item.productId, item.selectedSize)
                  }
                >
                  -
                </button>

                <span>{item.quantity}</span>

                <button
                  disabled={item.quantity >= item.stock}
                  className={item.quantity >= item.stock ? "disabled-btn" : ""}
                  onClick={() =>
                    increaseQuantity(item.productId, item.selectedSize)
                  }
                >
                  +
                </button>
              </div>

              <div className="cart-item-total">
                <h3>₹{item.price * item.quantity}</h3>

                <button
                  className="remove-btn"
                  onClick={() =>
                    removeFromCart(item.productId, item.selectedSize)
                  }
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="cart-summary">
          <h2>Order Summary</h2>

          <p>
            <span>Product Total</span>
            <strong>₹{totalAmount}</strong>
          </p>

          <p>
            <span>Delivery Charge</span>
            <strong>₹{deliveryCharge}</strong>
          </p>

          <h3>
            <span>Grand Total</span>
            <strong>₹{finalAmount}</strong>
          </h3>

          <Link to="/checkout" className="primary-btn checkout-btn">
            Proceed to Checkout
          </Link>

          <Link to="/shop" className="secondary-btn checkout-btn">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Cart;