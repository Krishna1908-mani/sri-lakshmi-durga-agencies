import { createContext, useContext, useEffect, useState } from "react";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const savedCart = localStorage.getItem("cartItems");
      return savedCart ? JSON.parse(savedCart) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("cartItems", JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product, selectedSize = "") => {
    const productId = product.id || product._id || product.productId;

    const existingItem = cartItems.find(
      (item) =>
        item.productId === productId &&
        (item.selectedSize || "") === (selectedSize || "")
    );

    if (existingItem) {
      if (existingItem.quantity >= product.stock) {
        alert(`Only ${product.stock} items available in stock`);
        return;
      }

      setCartItems(
        cartItems.map((item) =>
          item.productId === productId &&
          (item.selectedSize || "") === (selectedSize || "")
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );

      alert("Product quantity updated");
      return;
    }

    if (product.stock <= 0) {
      alert("Product is out of stock");
      return;
    }

    const cartProduct = {
      _id: productId,
      productId: productId,
      name: product.name,
      category: product.category,
      price: product.price,
      oldPrice: product.oldPrice,
      image: product.image,
      stock: product.stock,
      selectedSize: selectedSize || "",
      quantity: 1,
    };

    setCartItems([...cartItems, cartProduct]);
    alert("Product added to cart");
  };

  const increaseQuantity = (productId, selectedSize = "") => {
    setCartItems(
      cartItems.map((item) => {
        if (
          item.productId === productId &&
          (item.selectedSize || "") === (selectedSize || "")
        ) {
          if (item.quantity >= item.stock) {
            alert(`Only ${item.stock} items available in stock`);
            return item;
          }

          return { ...item, quantity: item.quantity + 1 };
        }

        return item;
      })
    );
  };

  const decreaseQuantity = (productId, selectedSize = "") => {
    setCartItems(
      cartItems.map((item) =>
        item.productId === productId &&
        (item.selectedSize || "") === (selectedSize || "")
          ? { ...item, quantity: item.quantity > 1 ? item.quantity - 1 : 1 }
          : item
      )
    );
  };

  const removeFromCart = (productId, selectedSize = "") => {
    setCartItems(
      cartItems.filter(
        (item) =>
          !(
            item.productId === productId &&
            (item.selectedSize || "") === (selectedSize || "")
          )
      )
    );
  };

  const updateQuantity = (productId, selectedSize = "", quantity) => {
    const newQuantity = Number(quantity);

    if (newQuantity < 1) return;

    setCartItems(
      cartItems.map((item) => {
        if (
          item.productId === productId &&
          (item.selectedSize || "") === (selectedSize || "")
        ) {
          if (newQuantity > item.stock) {
            alert(`Only ${item.stock} items available in stock`);
            return item;
          }

          return { ...item, quantity: newQuantity };
        }

        return item;
      })
    );
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem("cartItems");
  };

  const totalAmount = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        increaseQuantity,
        decreaseQuantity,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalAmount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}