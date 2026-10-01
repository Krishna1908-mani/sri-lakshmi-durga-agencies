import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import API from "../api/axios";

function AdminReports() {
  const token = localStorage.getItem("adminToken");

  const [orders, setOrders] = useState([]);

  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    paymentMethod: "ALL",
    orderStatus: "ALL",
  });

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await API.get("/orders", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setOrders(res.data.orders);
      } catch (error) {
        console.log(error);
        alert("Failed to fetch report data");
      }
    };

    fetchOrders();
  }, [token]);

  const handleChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const orderDate = new Date(order.createdAt);

      const startDate = filters.startDate
        ? new Date(filters.startDate + "T00:00:00")
        : null;

      const endDate = filters.endDate
        ? new Date(filters.endDate + "T23:59:59")
        : null;

      if (startDate && orderDate < startDate) return false;
      if (endDate && orderDate > endDate) return false;

      if (
        filters.paymentMethod !== "ALL" &&
        order.paymentMethod !== filters.paymentMethod
      ) {
        return false;
      }

      if (
        filters.orderStatus !== "ALL" &&
        order.orderStatus !== filters.orderStatus
      ) {
        return false;
      }

      return true;
    });
  }, [orders, filters]);

  const reportStats = useMemo(() => {
    const validSalesOrders = filteredOrders.filter(
      (order) =>
        order.orderStatus !== "Cancelled" && order.orderStatus !== "Returned"
    );

    const totalSales = validSalesOrders.reduce(
      (sum, order) => sum + Number(order.finalAmount || 0),
      0
    );

    const codSales = validSalesOrders
      .filter((order) => order.paymentMethod === "COD")
      .reduce((sum, order) => sum + Number(order.finalAmount || 0), 0);

    const onlineSales = validSalesOrders
      .filter((order) => order.paymentMethod === "ONLINE")
      .reduce((sum, order) => sum + Number(order.finalAmount || 0), 0);

    const deliveredOrders = filteredOrders.filter(
      (order) => order.orderStatus === "Delivered"
    ).length;

    const cancelledOrders = filteredOrders.filter(
      (order) => order.orderStatus === "Cancelled"
    ).length;

    return {
      totalOrders: filteredOrders.length,
      totalSales,
      codSales,
      onlineSales,
      deliveredOrders,
      cancelledOrders,
    };
  }, [filteredOrders]);

  const exportCSV = () => {
    if (filteredOrders.length === 0) {
      alert("No orders to export");
      return;
    }

    const headers = [
      "Order ID",
      "Date",
      "Customer",
      "Mobile",
      "Email",
      "Payment Method",
      "Payment Status",
      "Order Status",
      "Product Total",
      "Delivery",
      "Coupon",
      "Discount",
      "Final Amount",
    ];

    const rows = filteredOrders.map((order) => [
      order.orderId,
      new Date(order.createdAt).toLocaleDateString("en-IN"),
      order.customer?.name || "",
      order.customer?.mobile || "",
      order.customer?.email || "",
      order.paymentMethod,
      order.paymentStatus,
      order.orderStatus,
      order.totalAmount || 0,
      order.deliveryCharge || 0,
      order.couponCode || "",
      order.discountAmount || 0,
      order.finalAmount || 0,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `sales-report-${Date.now()}.csv`;
    link.click();

    URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setFilters({
      startDate: "",
      endDate: "",
      paymentMethod: "ALL",
      orderStatus: "ALL",
    });
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div>
          <h1>Sales Report</h1>
          <p>View sales, orders, payments and export CSV report</p>
        </div>

        <Link to="/admin/dashboard" className="back-btn">
          Dashboard
        </Link>
      </div>

      <div className="report-filter-box">
        <input
          type="date"
          name="startDate"
          value={filters.startDate}
          onChange={handleChange}
        />

        <input
          type="date"
          name="endDate"
          value={filters.endDate}
          onChange={handleChange}
        />

        <select
          name="paymentMethod"
          value={filters.paymentMethod}
          onChange={handleChange}
        >
          <option value="ALL">All Payments</option>
          <option value="COD">COD</option>
          <option value="ONLINE">Online</option>
        </select>

        <select
          name="orderStatus"
          value={filters.orderStatus}
          onChange={handleChange}
        >
          <option value="ALL">All Status</option>
          <option value="Order Placed">Order Placed</option>
          <option value="Confirmed">Confirmed</option>
          <option value="Packed">Packed</option>
          <option value="Shipped">Shipped</option>
          <option value="Out for Delivery">Out for Delivery</option>
          <option value="Delivered">Delivered</option>
          <option value="Cancelled">Cancelled</option>
          <option value="Returned">Returned</option>
        </select>

        <button onClick={clearFilters}>Clear</button>
        <button onClick={exportCSV}>Export CSV</button>
      </div>

      <div className="admin-stats">
        <div>
          <h2>{reportStats.totalOrders}</h2>
          <p>Total Orders</p>
        </div>

        <div>
          <h2>₹{reportStats.totalSales}</h2>
          <p>Total Sales</p>
        </div>

        <div>
          <h2>₹{reportStats.codSales}</h2>
          <p>COD Sales</p>
        </div>

        <div>
          <h2>₹{reportStats.onlineSales}</h2>
          <p>Online Sales</p>
        </div>

        <div>
          <h2>{reportStats.deliveredOrders}</h2>
          <p>Delivered</p>
        </div>

        <div>
          <h2>{reportStats.cancelledOrders}</h2>
          <p>Cancelled</p>
        </div>
      </div>

      <div className="admin-table-wrap report-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Payment</th>
              <th>Status</th>
              <th>Coupon</th>
              <th>Total</th>
            </tr>
          </thead>

          <tbody>
            {filteredOrders.map((order) => (
              <tr key={order._id}>
                <td>{order.orderId}</td>
                <td>{new Date(order.createdAt).toLocaleDateString("en-IN")}</td>
                <td>{order.customer?.name}</td>
                <td>{order.paymentMethod}</td>
                <td>{order.orderStatus}</td>
                <td>
                  {order.couponCode
                    ? `${order.couponCode} (-₹${order.discountAmount})`
                    : "No Coupon"}
                </td>
                <td>₹{order.finalAmount}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredOrders.length === 0 && <p>No report data found.</p>}
      </div>
    </div>
  );
}

export default AdminReports;