require("dotenv").config();
const express = require("express");
const cors = require("cors");
const otpRoutes = require("./routes/otp.routes");
const bulkRoutes = require("./routes/bulk.routes");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Favicon handler - suppress favicon 404 errors
app.get("/favicon.ico", (req, res) => {
  res.status(204).end();
});

// Request logging middleware
app.use((req, res, next) => {
  console.log(`\n📨 [${new Date().toLocaleTimeString()}] ${req.method} ${req.path}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('📦 Body:', req.body);
  }
  
  const originalJson = res.json;
  res.json = function(data) {
    console.log('📤 Response:', data);
    return originalJson.call(this, data);
  };
  
  next();
});

// Routes
app.use("/api", otpRoutes);
app.use("/api", bulkRoutes);

// 404 handler
app.use((req, res) => {
  console.log('❌ 404 - Route not found:', req.path);
  res.status(404).json({ success: false, message: "Route not found" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ ERROR:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });
  res.status(500).json({
    success: false,
    message: "Server error: " + err.message
  });
});

app.listen(process.env.PORT, () => {
  console.log(`\n✅ Server running on http://localhost:${process.env.PORT}\n`);
});
