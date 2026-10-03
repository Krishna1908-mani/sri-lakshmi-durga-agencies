import { Link } from "react-router-dom";
import { 
  ShieldCheck, 
  Zap, 
  Phone, 
  Mail, 
  MapPin, 
  MessageCircle, 
  Lock,
  Heart
} from "lucide-react";

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer" id="contact">
      {/* Trust Banner Top Strip */}
      <div className="footer-trust-strip">
        <div className="trust-strip-inner">
          <div className="trust-strip-item">
            <ShieldCheck size={18} className="trust-icon" />
            <span>100% Quality Guaranteed</span>
          </div>
          <div className="trust-strip-item">
            <Zap size={18} className="trust-icon" />
            <span>Fast Dispatch Across India</span>
          </div>
          <div className="trust-strip-item">
            <Lock size={18} className="trust-icon" />
            <span>Secure Online & COD Checkout</span>
          </div>
        </div>
      </div>

      <div className="footer-container">
        <div className="footer-col brand-col">
          <Link to="/" className="footer-logo">
            <img src="/logo.png" alt="Sri Lakshmi Durga Agencies" className="footer-logo-img" />
            <span>Sri Lakshmi Durga Agencies</span>
          </Link>
          <p className="footer-tagline">
            Your trusted destination for premium ladies clothing, kurtis, dresses, tops, and daily fashion essentials at wholesale & retail prices.
          </p>
        </div>

        <div className="footer-col">
          <h4>Quick Links</h4>
          <ul className="footer-links">
            <li><Link to="/">Home</Link></li>
            <li><Link to="/shop">Shop Collection</Link></li>
            <li><Link to="/wishlist">My Wishlist</Link></li>
            <li><Link to="/track-order">Track Your Order</Link></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>Customer Care</h4>
          <ul className="footer-links">
            <li><Link to="/profile">My Account</Link></li>
            <li><Link to="/my-orders">Order History</Link></li>
            <li>
              <a 
                href="https://wa.me/919949677382" 
                target="_blank" 
                rel="noopener noreferrer"
                className="whatsapp-help-link"
              >
                <MessageCircle size={15} />
                <span>WhatsApp Helpdesk</span>
              </a>
            </li>
            <li><Link to="/admin/login" className="admin-footer-link">Admin Portal</Link></li>
          </ul>
        </div>

        <div className="footer-col contact-col">
          <h4>Store Contact</h4>
          <div className="contact-list">
            <a href="tel:+919949677382" className="contact-item">
              <Phone size={16} className="contact-icon" />
              <span>+91 9949677382</span>
            </a>
            <a href="mailto:support@srilakshmidurga.com" className="contact-item">
              <Mail size={16} className="contact-icon" />
              <span>support@srilakshmidurga.com</span>
            </a>
            <div className="contact-item">
              <MapPin size={16} className="contact-icon" />
              <span>Andhra Pradesh, India</span>
            </div>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-bottom-inner">
          <p>© {currentYear} Sri Lakshmi Durga Agencies. All rights reserved.</p>
          <p className="footer-love">
            <span>Crafted with</span>
            <Heart size={14} className="heart-love" fill="#ef4444" stroke="#ef4444" />
            <span>for authentic Indian fashion</span>
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;