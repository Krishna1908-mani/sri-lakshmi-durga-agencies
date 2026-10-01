const sendEmail = require("./sendEmail");

const sendAdminOrderEmail = async (order) => {
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!adminEmail) {
    console.log("ADMIN_EMAIL not set");
    return;
  }

  const itemsHtml = order.items
    .map(
      (item) => `
        <tr>
          <td>${item.name}</td>
          <td>${item.selectedSize || "-"}</td>
          <td>${item.quantity}</td>
          <td>₹${item.price}</td>
        </tr>
      `
    )
    .join("");

  const html = `
    <div style="font-family: Arial, sans-serif;">
      <h2>New Order Received</h2>

      <p><strong>Order ID:</strong> ${order.orderId}</p>
      <p><strong>Customer:</strong> ${order.customer.name}</p>
      <p><strong>Mobile:</strong> ${order.customer.mobile}</p>
      <p><strong>Email:</strong> ${order.customer.email}</p>
      <p><strong>Address:</strong> ${order.customer.address}, ${order.customer.city}, ${order.customer.state} - ${order.customer.pincode}</p>

      <h3>Order Items</h3>

      <table border="1" cellpadding="8" cellspacing="0">
        <thead>
          <tr>
            <th>Product</th>
            <th>Size</th>
            <th>Qty</th>
            <th>Price</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <h3>Payment Details</h3>
      <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
      <p><strong>Payment Status:</strong> ${order.paymentStatus}</p>
      <p><strong>Product Total:</strong> ₹${order.totalAmount}</p>
      <p><strong>Delivery:</strong> ₹${order.deliveryCharge || 0}</p>
      <p><strong>Discount:</strong> ₹${order.discountAmount || 0}</p>
      <h2>Grand Total: ₹${order.finalAmount}</h2>

      <p>Login to admin panel to process this order.</p>
    </div>
  `;

  await sendEmail({
    to: adminEmail,
    subject: `New Order Received - ${order.orderId}`,
    html,
  });
};

module.exports = sendAdminOrderEmail;