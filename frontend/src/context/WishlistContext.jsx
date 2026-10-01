import { createContext, useContext, useEffect, useState } from "react";

const WishlistContext = createContext();

export function WishlistProvider({ children }) {
  const [wishlistItems, setWishlistItems] = useState(() => {
    try {
      const savedWishlist = localStorage.getItem("wishlistItems");
      return savedWishlist ? JSON.parse(savedWishlist) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("wishlistItems", JSON.stringify(wishlistItems));
  }, [wishlistItems]);

  const addToWishlist = (product) => {
    const prodId = String(product.id || product._id);
    const exists = wishlistItems.find(
      (item) => String(item.id || item._id) === prodId
    );

    if (exists) {
      alert("Product already in wishlist");
      return;
    }

    setWishlistItems([...wishlistItems, product]);
    alert("Added to wishlist");
  };

  const removeFromWishlist = (id) => {
    setWishlistItems(
      wishlistItems.filter((item) => String(item.id || item._id) !== String(id))
    );
  };

  const isInWishlist = (id) => {
    if (!id) return false;
    return wishlistItems.some(
      (item) => String(item.id || item._id) === String(id)
    );
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlistItems,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  return useContext(WishlistContext);
}