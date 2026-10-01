function WhatsAppButton() {
  const phoneNumber = "919949677382";

  const message =
    "Hello Sri Lakshmi Durga Agencies, I want to know more about your products.";

  const whatsappLink = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
    message
  )}`;

  return (
    <a
      href={whatsappLink}
      className="whatsapp-float"
      target="_blank"
      rel="noopener noreferrer"
    >
      WhatsApp
    </a>
  );
}

export default WhatsAppButton;