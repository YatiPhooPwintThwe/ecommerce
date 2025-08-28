// backend/index.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import passport from "passport";
import session from "express-session";
import http from "http";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServer } from "@apollo/server";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { ApolloServerPluginLandingPageLocalDefault } from "@apollo/server/plugin/landingPage/default";
import { buildContext } from "graphql-passport";
import MongoStore from "connect-mongo";
import path from "path";
import { fileURLToPath } from "url";
import helmet from "helmet"; 

// app modules
import { connectDB } from "./lib/connectDB.js";
import { configurePassport } from "./passport/passport.config.js";
import mergedTypeDefs from "./typeDefs/index.js";
import mergedResolvers from "./resolvers/index.js";
import { createDefaultAdmin } from "./admin/createDefaultAdmin.js";

dotenv.config();
await connectDB();

const isProd = process.env.NODE_ENV === "production";
const PORT = process.env.PORT || 4000; // Render provides PORT
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

if (!process.env.MONGODB_URI) throw new Error("Missing MONGODB_URI");
if (!process.env.SESSION_SECRET) throw new Error("Missing SESSION_SECRET");

// ------------------ express & http ------------------
const app = express();
const httpServer = http.createServer(app);

// when behind Render's proxy and using secure cookies
if (isProd) app.set("trust proxy", 1);

// ---------- Security headers (Helmet) ----------
app.disable("x-powered-by");

// Minimal, safe Helmet configuration (no CSP to avoid breaking SPA)
app.use(
  helmet({
    contentSecurityPolicy: false,        // keep off unless you’ve audited inline scripts/styles
    crossOriginEmbedderPolicy: false,    // typical for SPAs that embed data URIs/images
  })
);

// Extra-strong HSTS only in prod (HTTPS)
if (isProd) {
  app.use(
    helmet.hsts({
      maxAge: 15552000, // 180 days
      includeSubDomains: true,
      preload: false,
    })
  );
}

// ---------- CORS ----------
const allowedOrigins = isProd ? [CLIENT_URL] : [CLIENT_URL, "http://localhost:5173"];
app.use(
  cors({
    origin: (origin, cb) => {
      // allow same-origin or no-origin (curl/health checks)
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

// ---------- Sessions ----------
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      httpOnly: true,
      sameSite: isProd ? "lax" : "lax",
      secure: isProd, // HTTPS on Render
      path: "/",
    },
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      collectionName: "sessions",
    }),
  })
);

// ------------------ passport ------------------
configurePassport();
app.use(passport.initialize());
app.use(passport.session());

// ------------------ apollo server ------------------
const plugins = [ApolloServerPluginDrainHttpServer({ httpServer })];
if (!isProd) plugins.push(ApolloServerPluginLandingPageLocalDefault({ embed: true }));

const server = new ApolloServer({
  typeDefs: mergedTypeDefs,
  resolvers: mergedResolvers,
  plugins,
});

await server.start();
await createDefaultAdmin(); // will create/update admin on boot

// Body limits (trim in prod to reduce DoS/memory pressure)
const BODY_LIMIT = isProd ? "5mb" : "15mb";

app.use(
  "/graphql",
  express.json({ limit: BODY_LIMIT }),
  express.urlencoded({ extended: true, limit: BODY_LIMIT }),
  expressMiddleware(server, {
    context: async ({ req, res }) => buildContext({ req, res }),
  })
);

// ------------------ static (frontend) ------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distDir = path.resolve(__dirname, "../frontend/dist");

if (isProd) {
  app.use(express.static(distDir));
  // Let React Router handle the rest
  app.get("*", (_req, res) => {
    res.sendFile(path.join(distDir, "index.html"));
  });
}

// ------------------ start ------------------
await new Promise((resolve) => httpServer.listen({ port: PORT }, resolve));

console.log(`NODE_ENV   : ${process.env.NODE_ENV || "(not set)"}`);
console.log(`GraphQL    : http://localhost:${PORT}/graphql`);
console.log(`Serving    : ${isProd ? distDir : "development (no static)"} `);
