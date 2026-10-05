const nodemailer = require("nodemailer");

/**
 * ============================================================================
 * SRI LAKSHMI DURGA AGENCIES — PRODUCTION EMAIL NOTIFICATION SERVICE
 * Supports:
 * 1. Resend API (via RESEND_API_KEY)
 * 2. SMTP (via SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS)
 * 3. Gmail App Password fallback (via EMAIL_USER, EMAIL_PASS)
 * Safe failure handling: Never throws unhandled exceptions or crashes operations.
 * ============================================================================
 */

function createTransporter() {
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true" || process.env.SMTP_PORT === "465",
      auth: {
        user: (process.env.SMTP_USER || process.env.EMAIL_USER || "").trim(),
        pass: (process.env.SMTP_PASS || process.env.EMAIL_PASS || "").trim(),
      },
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 20000,
    });
  }

  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    const cleanUser = process.env.EMAIL_USER.trim();
    const cleanPass = (process.env.EMAIL_PASS || "").replace(/\s+/g, "").trim();

    return nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: cleanUser,
        pass: cleanPass,
      },
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 20000,
    });
  }

  return null;
}

/**
 * Diagnostics: Verify email transporter connection
 */
async function verifyEmailConnection() {
  const transporter = createTransporter();
  if (!transporter) {
    return {
      connected: false,
      message: "No email transporter configured (EMAIL_USER/EMAIL_PASS or SMTP_HOST missing)",
    };
  }

  try {
    await transporter.verify();
    return {
      connected: true,
      message: "Email transporter verified successfully",
      provider: process.env.SMTP_HOST ? "Custom SMTP" : "Gmail (Port 465 Direct SSL)",
      sender: process.env.EMAIL_USER || process.env.SMTP_USER,
    };
  } catch (error) {
    return {
      connected: false,
      message: error.message,
      provider: process.env.SMTP_HOST ? "Custom SMTP" : "Gmail (Port 465 Direct SSL)",
      sender: process.env.EMAIL_USER || process.env.SMTP_USER,
    };
  }
}

/**
 * Low-level dispatch helper
 */
async function sendRawEmail({ to, subject, html, text }) {
  if (!to || !subject) {
    return { success: false, error: "Recipient and subject are required" };
  }

  const userEmail = (process.env.EMAIL_USER || "").trim();
  const smtpUser = (process.env.SMTP_USER || "").trim();

  // If using Gmail without custom domain SMTP/Resend, enforce that sender email matches authenticated Gmail account
  const isGmailDirect = !process.env.SMTP_HOST && !process.env.RESEND_API_KEY && Boolean(userEmail);
  const fromAddress = isGmailDirect
    ? `"Sri Lakshmi Durga Agencies" <${userEmail}>`
    : (process.env.EMAIL_FROM || `"Sri Lakshmi Durga Agencies" <${smtpUser || userEmail || "no-reply@srilakshmidurgaagencies.com"}>`);

  // 1. Resend API support (if configured)
  if (process.env.RESEND_API_KEY) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromAddress,
          to: Array.isArray(to) ? to : [to],
          subject,
          html,
          text,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn("[Email Service] Resend API error:", errorText);
        // Fall back to transporter if available
      } else {
        const resData = await response.json();
        console.log(`[Email Service] Sent via Resend to ${Array.isArray(to) ? to.join(", ") : to} (ID: ${resData.id})`);
        return { success: true, id: resData.id };
      }
    } catch (resendErr) {
      console.warn("[Email Service] Resend fetch exception:", resendErr.message);
    }
  }

  // 2. SMTP / Nodemailer fallback
  const transporter = createTransporter();
  if (!transporter) {
    console.warn("[Email Service] No SMTP or Gmail credentials configured. Dispatch skipped safely.");
    return { success: false, skipped: true, message: "No email provider configured" };
  }

  try {
    const info = await transporter.sendMail({
      from: fromAddress,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
    });
    console.log(`[Email Service] Email dispatched successfully to ${to} (MessageId: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[Email Service] Nodemailer dispatch failed to ${to}:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * 1. Customer Welcome Email
 */
async function sendWelcomeEmail({ to, customerName }) {
  const name = customerName || "Valued Customer";
  const subject = "Welcome to Sri Lakshmi Durga Agencies";

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #0f172a; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05); }
    .header { background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0 0 8px 0; font-size: 24px; font-weight: 800; letter-spacing: -0.02em; }
    .header p { margin: 0; font-size: 14px; opacity: 0.9; }
    .content { padding: 32px 24px; }
    .greeting { font-size: 18px; font-weight: 700; margin-bottom: 16px; color: #0f172a; }
    .intro { font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
    .feature-card { background: #f0fdf4; border: 1px solid #d1fae5; border-radius: 12px; padding: 20px; margin-bottom: 24px; }
    .feature-card h3 { margin: 0 0 12px 0; font-size: 15px; color: #065f46; }
    .feature-list { margin: 0; padding-left: 20px; color: #334155; font-size: 14px; line-height: 1.8; }
    .cta-container { text-align: center; margin: 32px 0 16px 0; }
    .cta-btn { display: inline-block; background: #059669; color: #ffffff !important; padding: 14px 32px; border-radius: 9999px; text-decoration: none; font-weight: 700; font-size: 14px; }
    .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 24px; text-align: center; font-size: 12px; color: #64748b; line-height: 1.6; }
    .footer p { margin: 4px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Sri Lakshmi Durga Agencies</h1>
      <p>Premium Ladies Fashion & Essentials</p>
    </div>
    <div class="content">
      <div class="greeting">Hello ${name},</div>
      <p class="intro">
        Welcome to <strong>Sri Lakshmi Durga Agencies</strong>! Your account has been created successfully.
      </p>

      <div class="feature-card">
        <h3>With your account, you can:</h3>
        <ul class="feature-list">
          <li>Browse the latest authentic kurtis, dresses, and daily fashion collections</li>
          <li>Add favorite styles to your personal wishlist</li>
          <li>Enjoy fast checkout with Cash on Delivery (COD) or Instant Online Payment</li>
          <li>Track your orders and delivery statuses in real-time</li>
          <li>View complete order history anytime</li>
        </ul>
      </div>

      <div class="cta-container">
        <a href="${(process.env.FRONTEND_URL || "https://app.srilakshmidurgaagencies.com").split(",")[0].trim()}/shop" class="cta-btn">
          Explore Collection
        </a>
      </div>

      <p style="font-size: 14px; color: #64748b; text-align: center; margin-top: 24px;">
        Thank you for shopping with us.
      </p>
    </div>
    <div class="footer">
      <p><strong>Sri Lakshmi Durga Agencies</strong></p>
      <p>Andhra Pradesh, India | Phone: +91 9949677382</p>
      <p>&copy; ${new Date().getFullYear()} Sri Lakshmi Durga Agencies. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;

  return sendRawEmail({ to, subject, html });
}

/**
 * 2. Order Confirmation Email
 */
async function sendOrderConfirmationEmail(order) {
  if (!order || !order.customer || !order.customer.email) {
    return { success: false, skipped: true, error: "Missing order customer email" };
  }

  const to = order.customer.email;
  const name = order.customer.name || "Valued Customer";
  const orderId = order.orderId || order.id || "N/A";
  const subject = `Order Confirmed - Sri Lakshmi Durga Agencies (#${orderId})`;

  const itemsRows = (order.items || [])
    .map(
      (item) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #1e293b;">
          <strong>${item.name}</strong>
          ${item.selectedSize ? `<br><span style="font-size: 12px; color: #64748b;">Size: ${item.selectedSize}</span>` : ""}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #1e293b; text-align: center;">
          ${item.quantity || 1}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #1e293b; text-align: right;">
          ₹${Number(item.price) || 0}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #1e293b; text-align: right;">
          ₹${(Number(item.price) || 0) * (Number(item.quantity) || 1)}
        </td>
      </tr>
    `
    )
    .join("");

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #0f172a; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; }
    .header { background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0 0 6px 0; font-size: 22px; font-weight: 800; }
    .badge { display: inline-block; background: rgba(255, 255, 255, 0.2); padding: 4px 12px; border-radius: 9999px; font-size: 13px; font-weight: 700; margin-top: 8px; }
    .content { padding: 32px 24px; }
    .section-title { font-size: 16px; font-weight: 700; color: #0f172a; margin: 24px 0 12px 0; border-bottom: 2px solid #059669; padding-bottom: 6px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th { background: #f8fafc; color: #475569; font-size: 12px; font-weight: 700; text-transform: uppercase; padding: 10px 12px; border-bottom: 1px solid #cbd5e1; }
    .summary-table td { padding: 6px 12px; font-size: 14px; }
    .grand-total { font-size: 18px; font-weight: 800; color: #059669; }
    .shipping-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; font-size: 14px; line-height: 1.6; color: #334155; }
    .cta-container { text-align: center; margin: 32px 0 16px 0; }
    .cta-btn { display: inline-block; background: #059669; color: #ffffff !important; padding: 12px 28px; border-radius: 9999px; text-decoration: none; font-weight: 700; font-size: 14px; }
    .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px; text-align: center; font-size: 12px; color: #64748b; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Order Confirmed!</h1>
      <p style="margin: 0;">Thank you for shopping with Sri Lakshmi Durga Agencies</p>
      <div class="badge">Order ID: #${orderId}</div>
    </div>
    <div class="content">
      <p style="font-size: 16px;">Hello <strong>${name}</strong>,</p>
      <p style="color: #475569; line-height: 1.6;">
        We have received your order and our team has started processing it. You will receive updates as your items are packed and shipped.
      </p>

      <div class="section-title">Order Items</div>
      <table>
        <thead>
          <tr>
            <th style="text-align: left;">Product</th>
            <th style="text-align: center;">Qty</th>
            <th style="text-align: right;">Price</th>
            <th style="text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>

      <div class="section-title">Payment & Totals</div>
      <table class="summary-table">
        <tr>
          <td>Product Subtotal:</td>
          <td style="text-align: right; font-weight: 600;">₹${order.totalAmount || 0}</td>
        </tr>
        <tr>
          <td>Delivery Charge:</td>
          <td style="text-align: right; color: ${order.deliveryCharge === 0 ? "#059669" : "#1e293b"}; font-weight: 600;">
            ${order.deliveryCharge === 0 ? "FREE" : `₹${order.deliveryCharge}`}
          </td>
        </tr>
        ${
          order.discountAmount > 0
            ? `
        <tr>
          <td style="color: #e11d48;">Discount ${order.couponCode ? `(${order.couponCode})` : ""}:</td>
          <td style="text-align: right; color: #e11d48; font-weight: 600;">-₹${order.discountAmount}</td>
        </tr>
        `
            : ""
        }
        <tr style="border-top: 2px solid #e2e8f0;">
          <td class="grand-total">Total Amount:</td>
          <td style="text-align: right;" class="grand-total">₹${order.finalAmount || 0}</td>
        </tr>
        <tr>
          <td>Payment Method:</td>
          <td style="text-align: right; font-weight: 600;">${order.paymentMethod === "ONLINE" ? "Online (Prepaid)" : "Cash on Delivery (COD)"}</td>
        </tr>
        <tr>
          <td>Payment Status:</td>
          <td style="text-align: right; font-weight: 600; color: ${order.paymentStatus === "Paid" ? "#059669" : "#d97706"};">${order.paymentStatus || "Pending"}</td>
        </tr>
      </table>

      <div class="section-title">Delivery Address</div>
      <div class="shipping-box">
        <strong>${order.customer?.name}</strong><br>
        Phone: ${order.customer?.mobile}<br>
        ${order.customer?.address}<br>
        ${order.customer?.city}, ${order.customer?.state} - ${order.customer?.pincode}
      </div>

      <div class="cta-container">
        <a href="${(process.env.FRONTEND_URL || "https://app.srilakshmidurgaagencies.com").split(",")[0].trim()}/track-order" class="cta-btn">
          Track Your Order
        </a>
      </div>
    </div>
    <div class="footer">
      <p>Have questions? Reach us on WhatsApp at <strong>+91 9949677382</strong></p>
      <p>&copy; ${new Date().getFullYear()} Sri Lakshmi Durga Agencies. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;

  return sendRawEmail({ to, subject, html });
}

/**
 * 3. Order Status Update Email
 */
async function sendOrderStatusUpdateEmail({ order, newStatus }) {
  if (!order || !order.customer || !order.customer.email) {
    return { success: false, skipped: true, error: "Missing customer email in order" };
  }

  const to = order.customer.email;
  const name = order.customer.name || "Valued Customer";
  const orderId = order.orderId || order.id || "N/A";
  const status = newStatus || order.orderStatus || "Updated";
  const subject = `Order Update: #${orderId} has been ${status}`;

  let statusExplanation = "Your order status has been updated.";
  let statusBadgeColor = "#059669";

  if (status === "Order Confirmed" || status === "Confirmed") {
    statusExplanation = "Your order has been verified and confirmed by our team.";
    statusBadgeColor = "#059669";
  } else if (status === "Processing" || status === "Packed") {
    statusExplanation = "Your items have passed quality checks and are packed for dispatch.";
    statusBadgeColor = "#0284c7";
  } else if (status === "Shipped") {
    statusExplanation = order.trackingId
      ? `Your package is on its way! Tracking Number: ${order.trackingId}`
      : "Your package has been handed over to our courier partner and is on its way.";
    statusBadgeColor = "#7c3aed";
  } else if (status === "Out for Delivery") {
    statusExplanation = "Your package is out for delivery today. Please keep your phone accessible.";
    statusBadgeColor = "#d97706";
  } else if (status === "Delivered") {
    statusExplanation = "Your order has been delivered! We hope you love your new purchase.";
    statusBadgeColor = "#16a34a";
  } else if (status === "Cancelled") {
    statusExplanation = "Your order has been cancelled. Any eligible refund will be processed promptly.";
    statusBadgeColor = "#dc2626";
  }

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #0f172a; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; }
    .header { background: #0f172a; padding: 28px 24px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0 0 6px 0; font-size: 20px; font-weight: 800; }
    .content { padding: 32px 24px; }
    .status-card { background: #f8fafc; border: 2px solid ${statusBadgeColor}; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0; }
    .status-title { font-size: 13px; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 6px; }
    .status-badge { display: inline-block; background: ${statusBadgeColor}; color: #ffffff; font-size: 16px; font-weight: 800; padding: 6px 18px; border-radius: 9999px; }
    .status-desc { font-size: 14px; color: #334155; margin-top: 12px; line-height: 1.6; }
    .cta-container { text-align: center; margin: 28px 0 16px 0; }
    .cta-btn { display: inline-block; background: #059669; color: #ffffff !important; padding: 12px 28px; border-radius: 9999px; text-decoration: none; font-weight: 700; font-size: 14px; }
    .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px; text-align: center; font-size: 12px; color: #64748b; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Sri Lakshmi Durga Agencies</h1>
      <p style="margin: 0; font-size: 13px; opacity: 0.8;">Order Status Update</p>
    </div>
    <div class="content">
      <p style="font-size: 16px;">Hello <strong>${name}</strong>,</p>

      <div class="status-card">
        <div class="status-title">Order #${orderId}</div>
        <div class="status-badge">${status}</div>
        <p class="status-desc">${statusExplanation}</p>
        ${order.trackingId ? `<p style="font-size: 13px; font-weight: 700; color: #0f172a; margin: 8px 0 0 0;">Courier Tracking ID: ${order.trackingId}</p>` : ""}
      </div>

      <p style="font-size: 14px; color: #475569; line-height: 1.6;">
        You can log in to your account anytime to view complete order history, track live delivery status, and view invoices.
      </p>

      <div class="cta-container">
        <a href="${(process.env.FRONTEND_URL || "https://app.srilakshmidurgaagencies.com").split(",")[0].trim()}/track-order" class="cta-btn">
          View Live Order Status
        </a>
      </div>
    </div>
    <div class="footer">
      <p>Thank you for choosing Sri Lakshmi Durga Agencies.</p>
      <p>&copy; ${new Date().getFullYear()} Sri Lakshmi Durga Agencies. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;

  return sendRawEmail({ to, subject, html });
}

/**
 * 4. Promotional / Offers Email (Only sent to opted-in customers)
 */
async function sendPromotionalEmail({ to, customerName, subject, headline, bodyContent, discountCode, callToActionUrl }) {
  const name = customerName || "Valued Customer";
  const emailSubject = subject || "Special Offers from Sri Lakshmi Durga Agencies";

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #0f172a; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; }
    .header { background: linear-gradient(135deg, #e11d48 0%, #be123c 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0 0 6px 0; font-size: 22px; font-weight: 800; }
    .content { padding: 32px 24px; }
    .promo-card { background: #fff1f2; border: 2px dashed #f43f5e; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
    .coupon-code { display: inline-block; font-size: 20px; font-weight: 800; letter-spacing: 2px; color: #be123c; background: #ffffff; padding: 8px 20px; border-radius: 8px; border: 1px solid #fecdd3; margin-top: 8px; }
    .cta-container { text-align: center; margin: 28px 0 16px 0; }
    .cta-btn { display: inline-block; background: #e11d48; color: #ffffff !important; padding: 12px 28px; border-radius: 9999px; text-decoration: none; font-weight: 700; font-size: 14px; }
    .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px; text-align: center; font-size: 12px; color: #64748b; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${headline || "Exclusive Festive Collection & Offers"}</h1>
      <p style="margin: 0; opacity: 0.9;">Sri Lakshmi Durga Agencies</p>
    </div>
    <div class="content">
      <p style="font-size: 16px;">Hello <strong>${name}</strong>,</p>
      <p style="color: #475569; line-height: 1.6;">
        ${bodyContent || "We have added stunning new arrivals in kurtis, dresses, and daily fashion essentials to our catalog. Don't miss out on special discounts available for a limited time!"}
      </p>

      ${
        discountCode
          ? `
      <div class="promo-card">
        <div style="font-size: 13px; font-weight: 700; color: #9f1239; text-transform: uppercase;">Use Coupon Code at Checkout</div>
        <div class="coupon-code">${discountCode}</div>
      </div>
      `
          : ""
      }

      <div class="cta-container">
        <a href="${callToActionUrl || (process.env.FRONTEND_URL || "https://app.srilakshmidurgaagencies.com").split(",")[0].trim() + "/shop"}" class="cta-btn">
          Shop Special Offers
        </a>
      </div>
    </div>
    <div class="footer">
      <p>You received this promotional email because you opted in to offers from Sri Lakshmi Durga Agencies.</p>
      <p>You can update your email preferences anytime in your <a href="${(process.env.FRONTEND_URL || "https://app.srilakshmidurgaagencies.com").split(",")[0].trim()}/profile" style="color: #059669;">Profile Settings</a>.</p>
      <p>&copy; ${new Date().getFullYear()} Sri Lakshmi Durga Agencies. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;

  return sendRawEmail({ to, subject: emailSubject, html });
}

module.exports = {
  sendRawEmail,
  verifyEmailConnection,
  sendWelcomeEmail,
  sendOrderConfirmationEmail,
  sendOrderStatusUpdateEmail,
  sendPromotionalEmail,
};
