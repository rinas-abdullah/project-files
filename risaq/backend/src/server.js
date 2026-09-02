import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDb } from "./config/db.js";
import { Lab } from "./models/Lab.js";
import { LAB_SEED_DATA } from "./data/labs.js";
import authRoutes from "./routes/authRoutes.js";
import labRoutes from "./routes/labRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import leaderboardRoutes from "./routes/leaderboardRoutes.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";

const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim());

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ ok: true, service: "risaq-backend" }));

app.use("/api/auth", authRoutes);
app.use("/api/labs", labRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/leaderboard", leaderboardRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

connectDb()
  .then(async () => {
    if (process.env.MONGODB_URI === "memory") {
      // In-memory store starts empty every run (nothing persists across
      // process restarts), so seed the built-in labs automatically instead
      // of requiring a separate `npm run seed` against a store this process
      // can't see.
      for (const lab of LAB_SEED_DATA) {
        await Lab.findOneAndUpdate({ slug: lab.slug }, lab, { upsert: true });
      }
      console.log(`[risaq-backend] auto-seeded ${LAB_SEED_DATA.length} labs into the in-memory store`);
    }
    app.listen(PORT, () => console.log(`[risaq-backend] listening on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error("[risaq-backend] failed to start:", err.message);
    process.exit(1);
  });
