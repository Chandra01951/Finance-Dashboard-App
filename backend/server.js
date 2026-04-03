const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorHandler");

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();


// ─── Middleware ───────────────────────────────────────────────────────────────

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ✅ CORS FIX (IMPORTANT)
const allowedOrigins = [
  "http://localhost:3000",
  "https://finance-dashboard-app-1.onrender.com"
];

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like Postman)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));

// Logging (only in development)
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}


// ─── Rate Limiting ────────────────────────────────────────────────────────────

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    success: false,
    message: "Too many requests, please try again later."
  }
});

app.use("/api", limiter);


// ─── Routes ──────────────────────────────────────────────────────────────────

app.use("/api/auth",      require("./routes/authRoutes"));
app.use("/api/users",     require("./routes/userRoutes"));
app.use("/api/records",   require("./routes/recordRoutes"));
app.use("/api/dashboard", require("./routes/dashboardRoutes"));


// ─── Health Check ────────────────────────────────────────────────────────────

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Finance Dashboard API is running",
    timestamp: new Date()
  });
});


// ─── 404 Handler ─────────────────────────────────────────────────────────────

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});


// ─── Global Error Handler ────────────────────────────────────────────────────

app.use(errorHandler);


// ─── Start Server ────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  console.log(`🌐 API URL: https://finance-dashboard-app-ggbu.onrender.com/api`);
});


// ─── Handle Unhandled Promise Rejections ─────────────────────────────────────

process.on("unhandledRejection", (err) => {
  console.error(`❌ Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});