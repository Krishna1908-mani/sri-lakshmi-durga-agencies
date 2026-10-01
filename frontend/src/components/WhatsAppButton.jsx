import { MessageCircle } from "lucide-react";

function WhatsAppButton() {
  const phoneNumber = "919949677382";
  const message = "Hello Sri Lakshmi Durga Agencies, I want to know more about your collection.";
  const whatsappLink = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={whatsappLink}
      className="whatsapp-float-btn"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
    >
      <div className="whatsapp-pulse-ring"></div>
      <MessageCircle size={22} className="whatsapp-icon-svg" />
      <span className="whatsapp-btn-text">WhatsApp Us</span>
    </a>
  );
}

export default WhatsAppButton;