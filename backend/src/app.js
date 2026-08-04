const express = require("express");


const cookieParser = require("cookie-parser");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
// const hpp = require("hpp");
const compression = require("compression");

const app = express();


/**
 * Health route must come after:
 * const app = express();
 */
app.get("/health", (req, res) => {
  return res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

/**
 * Frontend URLs allowed to call this backend.
 *
 * Local:
 * - http://localhost:5173
 * - http://localhost:5174
 *
 * Production:
 * - process.env.FRONTEND_URL from Render
 */
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  process.env.FRONTEND_URL,
].filter(Boolean);

/**
 * Render runs the application behind a reverse proxy.
 * This allows Express to correctly understand the client IP
 * for rate limiting and secure requests.
 */
app.set("trust proxy", 1);

/**
 * Security headers
 */
app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
  })
);

/**
 * CORS configuration
 *
 * credentials: true is required because authentication
 * uses cookies.
 */
app.use(
  cors({
    origin(origin, callback) {
      /**
       * Requests from Postman or server-to-server calls
       * may not contain an Origin header.
       */
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
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
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  })
);

/**
 * Request body parsers
 *
 * The 20 KB limit reduces the risk of excessively
 * large request bodies.
 */
app.use(
  express.json({
    limit: "20kb",
  })
);

app.use(
  express.urlencoded({
    extended: false,
    limit: "20kb",
  })
);

/**
 * Parse cookies such as the JWT authentication cookie.
 */
app.use(cookieParser());

/**
 * Prevent HTTP parameter pollution.
 */
// app.use(hpp());

/**
 * Compress HTTP responses.
 */
app.use(compression());

/**
 * General API rate limiter.
 *
 * Maximum 200 requests per IP during a 15-minute window.
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 200,
  standardHeaders: "draft-7",
  legacyHeaders: false,

  message: {
    message: "Too many requests. Please try again later.",
  },
});

/**
 * Apply the general limiter only to API routes.
 *
 * This means /health is not rate limited, which is useful
 * for Render health checks.
 */
app.use("/api", generalLimiter);

/**
 * Stricter limiter for login and registration.
 *
 * Successful requests do not count toward the limit.
 */
const authenticationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skipSuccessfulRequests: true,

  message: {
    message:
      "Too many authentication attempts. Please try again later.",
  },
});

/**
 * These limiters must appear before the auth router.
 */
app.use(
  "/api/auth/login",
  authenticationLimiter
);

app.use(
  "/api/auth/register",
  authenticationLimiter
);

/**
 * Basic test route.
 */
app.get("/test", (req, res) => {
  return res.status(200).json({
    message: "Server is working",
  });
});

/**
 * Health-check route.
 *
 * Render will call this endpoint to confirm
 * that the backend is running.
 */


/**
 * Import routers.
 */
const authRouter = require("./routes/auth.routes");
const accountRouter = require("./routes/account.routes");
const transactionRouter = require("./routes/transaction.routes");

/**
 * Mount API routes.
 */
app.use(
  "/api/auth",
  authRouter
);

app.use(
  "/api/accounts",
  accountRouter
);

app.use(
  "/api/transactions",
  transactionRouter
);

/**
 * Handle unknown routes.
 *
 * This must remain after all valid routes.
 */
app.use((req, res) => {
  return res.status(404).json({
    message: "Route not found",
  });
});

/**
 * Central error handler.
 *
 * This must be the final middleware in the file.
 */
app.use((error, req, res, next) => {
  console.error("Application error:", error.message);

  if (error.message === "Origin not allowed by CORS") {
    return res.status(403).json({
      message: "Origin not allowed by CORS",
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