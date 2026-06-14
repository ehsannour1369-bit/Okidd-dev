import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.set("trust proxy", 1);

// ── Security headers (Helmet) ──
app.use(
  helmet({
    // Enable a permissive CSP that still blocks the most common injection vectors
    contentSecurityPolicy: process.env.NODE_ENV === "production"
      ? {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],   // needed for Vite HMR in prod build
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "blob:", "https:"],
            mediaSrc: ["'self'", "blob:", "https:"],
            connectSrc: ["'self'", "https:"],
            frameSrc: ["'self'", "https:"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: [],
          },
        }
      : false,
    crossOriginEmbedderPolicy: false,
    // Prevent browsers from MIME-sniffing
    noSniff: true,
    // Disable X-Powered-By
    hidePoweredBy: true,
    // Force HTTPS in production
    hsts: process.env.NODE_ENV === "production"
      ? { maxAge: 31536000, includeSubDomains: true }
      : false,
  }),
);

// ── CORS ──
const corsOrigin = process.env.CORS_ORIGIN;
app.use(
  cors({
    origin: corsOrigin || (process.env.NODE_ENV === "production" ? false : "*"),
    credentials: true,
  }),
);

// ── Request logging ──
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

// ── Body parsers with size limits ──
app.use(express.json({ limit: "2mb" }));
// extended:false uses the simpler querystring library — avoids prototype-pollution vectors
app.use(express.urlencoded({ extended: false, limit: "2mb" }));

// ── Rate limiting ──
// Strict limiter on login (per-IP, applied per request)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: "تعداد درخواست‌ها زیاد است. لطفاً ۱۵ دقیقه دیگر تلاش کنید." },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV !== "production",
});

// General API rate limiter — generous enough for normal use, blocks brute-force bots
const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,   // 1 minute window
  max: 300,                   // 300 req/min per IP
  message: { error: "تعداد درخواست‌ها زیاد است. لطفاً کمی صبر کنید." },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV !== "production",
});

app.use("/api/auth/login", loginLimiter);
app.use("/api", generalLimiter);
app.use("/api", router);

export default app;
