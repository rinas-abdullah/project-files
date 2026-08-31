// Idempotent seed script: inserts (or updates) the built-in labs.
// Usage: npm run seed  (reads MONGODB_URI from .env)
import "dotenv/config";
import mongoose from "mongoose";
import { connectDb } from "./config/db.js";
import { Lab } from "./models/Lab.js";
import { LAB_SEED_DATA } from "./data/labs.js";

async function run() {
  await connectDb();

  for (const lab of LAB_SEED_DATA) {
    await Lab.findOneAndUpdate({ slug: lab.slug }, lab, { upsert: true, new: true, setDefaultsOnInsert: true });
    console.log(`[seed] upserted lab: ${lab.slug}`);
  }

  console.log(`[seed] done — ${LAB_SEED_DATA.length} labs seeded`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("[seed] failed:", err);
  process.exit(1);
});
