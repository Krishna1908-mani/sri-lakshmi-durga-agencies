const sendEmail = require("./sendEmail");

const sendAdminOrderEmail = async (order) => {
  if (!order) {
    console.warn("[Admin Order Email] Empty order payload passed. Cannot dispatch email.");
    return { success: false, skipped: true, error: "Empty order payload" };
  }

  // Gracefully fallback to EMAIL_USER if ADMIN_EMAIL is not explicitly defined in production
  const adminEmail = (process.env.ADMIN_EMAIL || process.env.EMAIL_USER || "").trim();

  if (!adminEmail) {
    console.warn("[Admin Order Email] Neither ADMIN_EMAIL nor EMAIL_USER is set in environment variables. Email notification skipped.");
    return { success: false, skipped: true, error: "No admin recipient configured" };
  }

  // Safe extraction of items (array or JSON string)
  let items = order.items || [];
  if (typeof items === "string") {
    try {
      items = JSON.parse(items);
    } catch {
      items = [];
    }
  }
  if (!Array.isArray(items)) {
    items = [];
  }

  const itemsHtml = items.length > 0
    ? items
        .map(
          (item) => `
            <tr>
              <td style="padding: 10px; border: 1px solid #e2e8f0; font-size: 14px; color: #1e293b;">${item.name || "Product"}</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center; font-size: 14px; color: #1e293b;">${item.selectedSize || "-"}</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center; font-size: 14px; color: #1e293b;">${item.quantity || 1}</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: right; font-size: 14px; color: #1e293b;">₹${item.price || 0}</td>
            </tr>
          `
        )
        .join("")
    : `<tr><td colspan="4" style="padding: 12px; text-align: center; color: #64748b; border: 1px solid #e2e8f0;">No item details available</td></tr>`;

  // Safe extraction of customer details
  let customer = order.customer || {};
  if (typeof customer === "string") {
    try {
      customer = JSON.parse(customer);
    } catch {
      customer = {};
    }
  }

  const customerName = customer.name || order.customer_name || "Valued Customer";
  const customerMobile = customer.mobile || order.customer_mobile || "Not provided";
  const customerEmail = customer.email || order.customer_email || "Not provided";
  const customerAddress = customer.address
    ? `${customer.address}, ${customer.city || ""}, ${customer.state || ""} - ${customer.pincode || ""}`
    : "Not provided";

  const orderId = order.orderId || order.id || "N/A";
  const totalAmount = order.totalAmount || order.total_amount || 0;
  const deliveryCharge = order.deliveryCharge || order.delivery_charge || 0;
  const discountAmount = order.discountAmount || order.discount_amount || 0;
  const finalAmount = order.finalAmount || order.final_amount || 0;
  const paymentMethod = order.paymentMethod || order.payment_method || "COD";
  const paymentStatus = order.paymentStatus || order.payment_status || "Pending";

  const adminPortalUrl = (
    process.env.ADMIN_PORTAL_URL ||
    process.env.FRONTEND_URL ||
    "https://admin.srilakshmidurgaagencies.com"
  )
    .split(",")[0]
    .trim();

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; padding: 0;">
      <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); color: #ffffff; padding: 24px; text-align: center;">
        <h2 style="margin: 0 0 6px 0; font-size: 22px;">🛍️ New Customer Order Received!</h2>
        <p style="margin: 0; font-size: 14px; opacity: 0.9;">Order ID: #${orderId}</p>
      </div>

      <div style="padding: 24px;">
        <h3 style="margin-top: 0; font-size: 16px; color: #0f172a; border-bottom: 2px solid #059669; padding-bottom: 6px;">Customer Information</h3>
        <p style="margin: 6px 0; font-size: 14px;"><strong>Customer Name:</strong> ${customerName}</p>
        <p style="margin: 6px 0; font-size: 14px;"><strong>Mobile:</strong> <a href="tel:${customerMobile}" style="color: #059669; text-decoration: none;">${customerMobile}</a></p>
        <p style="margin: 6px 0; font-size: 14px;"><strong>Email:</strong> <a href="mailto:${customerEmail}" style="color: #059669; text-decoration: none;">${customerEmail}</a></p>
        <p style="margin: 6px 0; font-size: 14px;"><strong>Delivery Address:</strong> ${customerAddress}</p>

        <h3 style="margin: 24px 0 12px 0; font-size: 16px; color: #0f172a; border-bottom: 2px solid #059669; padding-bottom: 6px;">Order Items</h3>
        <table border="0" cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background: #f8fafc;">
              <th style="padding: 10px; border: 1px solid #e2e8f0; text-align: left; font-size: 13px; color: #475569;">Product</th>
              <th style="padding: 10px; border: 1px solid #e2e8f0; text-align: center; font-size: 13px; color: #475569;">Size</th>
              <th style="padding: 10px; border: 1px solid #e2e8f0; text-align: center; font-size: 13px; color: #475569;">Qty</th>
              <th style="padding: 10px; border: 1px solid #e2e8f0; text-align: right; font-size: 13px; color: #475569;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <h3 style="margin: 24px 0 12px 0; font-size: 16px; color: #0f172a; border-bottom: 2px solid #059669; padding-bottom: 6px;">Payment Summary</h3>
        <table style="width: 100%; font-size: 14px; line-height: 1.8;">
          <tr>
            <td>Payment Method:</td>
            <td style="text-align: right; font-weight: 700;">${paymentMethod === "ONLINE" ? "Online Prepaid (Razorpay)" : "Cash on Delivery (COD)"}</td>
          </tr>
          <tr>
            <td>Payment Status:</td>
            <td style="text-align: right; font-weight: 700; color: ${paymentStatus === "Paid" ? "#059669" : "#d97706"};">${paymentStatus}</td>
          </tr>
          <tr>
            <td>Items Subtotal:</td>
            <td style="text-align: right; font-weight: 600;">₹${totalAmount}</td>
          </tr>
          <tr>
            <td>Delivery Charge:</td>
            <td style="text-align: right; font-weight: 600;">${Number(deliveryCharge) === 0 ? "FREE" : `₹${deliveryCharge}`}</td>
          </tr>
          ${Number(discountAmount) > 0 ? `
          <tr>
            <td style="color: #e11d48;">Discount:</td>
            <td style="text-align: right; color: #e11d48; font-weight: 600;">-₹${discountAmount}</td>
          </tr>` : ""}
          <tr style="border-top: 2px solid #e2e8f0; font-size: 18px;">
            <td style="padding-top: 8px; font-weight: 800; color: #059669;">Grand Total:</td>
            <td style="padding-top: 8px; text-align: right; font-weight: 800; color: #059669;">₹${finalAmount}</td>
          </tr>
        </table>

        <div style="text-align: center; margin: 32px 0 16px 0;">
          <a href="${adminPortalUrl}/admin/orders" style="display: inline-block; background: #059669; color: #ffffff !important; padding: 12px 28px; border-radius: 9999px; text-decoration: none; font-weight: 700; font-size: 14px;">
            View Order in Admin Portal
          </a>
        </div>
      </div>

      <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px; text-align: center; font-size: 12px; color: #64748b;">
        <p style="margin: 0;">Sri Lakshmi Durga Agencies — Automated Admin Notification</p>
      </div>
    </div>
  `;

  try {
    const result = await sendEmail({
      to: adminEmail,
      subject: `🚨 New Order Received - #${orderId} (₹${finalAmount})`,
      html,
    });

    if (result && result.success === false) {
      console.error(`[Admin Order Email] Dispatch to ${adminEmail} failed:`, result.error || result.message);
    } else {
      console.log(`[Admin Order Email] Alert successfully dispatched to ${adminEmail} for Order #${orderId}`);
    }

    return result;
  } catch (err) {
    console.error("[Admin Order Email] Unexpected dispatch error:", err.message);
    return { success: false, error: err.message };
  }
};

module.exports = sendAdminOrderEmail;