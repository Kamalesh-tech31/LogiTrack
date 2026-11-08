require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");
const deliveryAgentRoutes = require("./routes/deliveryAgents");
const adminRoutes = require("./routes/adminRoutes");


/* =========================
   Middleware Imports
========================= */
const corsConfig = require("./middleware/corsConfig");
const errorHandler = require("./middleware/errorHandler");
const requestLogger = require("./middleware/requestLogger");
const authenticateToken = require("./middleware/authenticateToken");

/* =========================
   Customer Routes
========================= */
const customerProductRoutes = require("./routes/customerProductRoutes");
const customerOrderRoutes = require("./routes/customerOrderRoutes");
const orderTrackingRoutes = require("./routes/orderTrackingRoutes");
const deliveryTrackingRoutes = require("./routes/deliveryTrackingRoutes");
const customerAnalyticsRoutes = require("./routes/customerAnalyticsRoutes");
const dashboardStatsRoutes = require("./routes/dashboardStatsRoutes");

/* =========================
   Admin / Delivery Routes
========================= */
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const inventoryRoutes = require("./routes/inventoryRoutes");
const deliveryRoutes = require("./routes/deliveries");
const analyticsRoutes = require("./routes/analyticsRoutes");
const authRoutes = require("./routes/authRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const locationRoutes = require("./routes/locations");

/* =========================
   App Setup
========================= */
const app = express();



const PORT = Number(process.env.PORT || 5000);
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

/* =========================
   Global Middleware
========================= */
app.use(corsConfig);





app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

app.use(
  "/uploads",
  express.static(path.join(__dirname, "../uploads"))
);

app.use(requestLogger);

/* =========================
   Health Routes
========================= */
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: "MongoDB",
  });
});

app.get("/", (req, res) => {
  res.send("Backend Running");
});

/* =========================
   Authentication Routes
========================= */
app.use("/api/auth", authRoutes);

/* =========================
   Customer APIs
========================= */
app.use("/api/customer/products", customerProductRoutes);
app.use("/api/customer/orders", customerOrderRoutes);
app.use("/api/tracking", orderTrackingRoutes);
app.use("/api/delivery", deliveryTrackingRoutes);
app.use("/api/customer/analytics", customerAnalyticsRoutes);
app.use("/api/stats", dashboardStatsRoutes);

/* =========================
   Admin / Delivery APIs
========================= */
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/deliveries", deliveryRoutes);
app.use("/api/delivery-agents", deliveryAgentRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/location-updates", locationRoutes);
app.use("/api/admin", adminRoutes);



/* =========================
   404 Handler
========================= */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

/* =========================
   Error Handler
========================= */
app.use(errorHandler);

/* =========================
   Start Server
========================= */
const startServer = async () => {
  try {
    await connectDB();

    const server = app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Frontend URL: ${FRONTEND_URL}`);
      console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
    });

    server.on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        console.error(
          `[CRITICAL] Port ${PORT} is already in use by another process. Please free port ${PORT} or update PORT in backend/.env`,
        );
      }
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
