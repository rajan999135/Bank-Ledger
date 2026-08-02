const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const hpp = require("hpp");
const compression = require("compression");

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  process.env.FRONTEND_URL,
].filter(Boolean);

// Required when deployed behind Render or another reverse proxy.
app.set("trust proxy", 1);

// Security headers
app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
  })
);

// CORS configuration
app.use(
  cors({
    origin(origin, callback) {
      // Allow Postman, mobile apps and server-to-server requests.
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Origin not allowed by CORS"));
    },

    credentials: true,

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  })
);

// Request body parsers
app.use(express.json({ limit: "20kb" }));

app.use(
  express.urlencoded({
    extended: false,
    limit: "20kb",
  })
);

app.use(cookieParser());

// Security and performance middleware
app.use(mongoSanitize());
app.use(hpp());
app.use(compression());

// General API rate limiter
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 200,

  standardHeaders: "draft-7",
  legacyHeaders: false,

  message: {
    message: "Too many requests. Please try again later.",
  },
});

app.use("/api", generalLimiter);

// Stricter limiter for login and registration
const authenticationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,

  standardHeaders: "draft-7",
  legacyHeaders: false,

  skipSuccessfulRequests: true,

  message: {
    message: "Too many authentication attempts. Please try again later.",
  },
});

// These must appear before the authentication router.
app.use("/api/auth/login", authenticationLimiter);
app.use("/api/auth/register", authenticationLimiter);

// Test route
app.get("/test", (req, res) => {
  console.log("Test route reached");

  return res.status(200).json({
    message: "Server is working",
  });
});

// Import routes
const authRouter = require("./routes/auth.routes");
const accountRouter = require("./routes/account.routes");
const transactionRoutes = require("./routes/transaction.routes");

// Mount routes
app.use("/api/auth", authRouter);
app.use("/api/accounts", accountRouter);
app.use("/api/transactions", transactionRoutes);

// Handle unknown routes
app.use((req, res) => {
  return res.status(404).json({
    message: "Route not found",
  });
});

// Central error handler
app.use((error, req, res, next) => {
  console.error(error);

  if (error.message === "Origin not allowed by CORS") {
    return res.status(403).json({
      message: error.message,
    });
  }

  return res.status(error.status || 500).json({
    message:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : error.message,
  });
});

module.exports = app;