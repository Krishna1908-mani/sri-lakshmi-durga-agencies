import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";

function Navbar() {
  const { cartItems } = useCart();
  const navigate = useNavigate();

  const userToken = localStorage.getItem("userToken");
  const userName = localStorage.getItem("userName");

  const adminToken = localStorage.getItem("adminToken");
  const adminName = localStorage.getItem("adminName");

  const logoutUser = () => {
    localStorage.removeItem("userToken");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");

    alert("Customer logged out");
    navigate("/");
  };

  const logoutAdmin = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminName");

    alert("Admin logged out");
    navigate("/");
  };

  return (
    <nav className="navbar">
      <Link to="/" className="logo">
        Sri Lakshmi Durga Agencies
      </Link>
      <div className="nav-links">
  <Link to="/">Home</Link>
  <Link to="/shop">Shop</Link>
  <Link to="/wishlist">Wishlist</Link>
  <Link to="/recently-viewed">Recently Viewed</Link>
  <Link to="/track-order">Track Order</Link>

  {userToken && <Link to="/my-orders">My Orders</Link>}
  {userToken && <Link to="/profile">Profile</Link>}

  {adminToken && <Link to="/admin/dashboard">Admin Dashboard</Link>}

  <a href="#contact">Contact</a>
</div>

      <div className="nav-actions">
        {adminToken ? (
          <button className="login-btn" onClick={logoutAdmin}>
            {adminName || "Admin"} Logout
          </button>
        ) : userToken ? (
          <button className="login-btn" onClick={logoutUser}>
            {userName} Logout
          </button>
        ) : (
          <Link to="/login" className="login-btn">
            Login
          </Link>
        )}

        <Link to="/cart" className="cart-btn">
          Cart 🛒 {cartItems.length}
        </Link>
      </div>
    </nav>
  );
}

export default Navbar;