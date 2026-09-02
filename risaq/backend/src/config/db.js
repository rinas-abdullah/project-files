import mongoose from "mongoose";

export async function connectDb() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not set. Copy .env.example to .env and configure it.");
  }

  if (uri === "memory") {
    // No real MongoDB reachable — models fall back to an in-process store
    // (see db/memoryModel.js). Data does not persist across restarts.
    console.log("[mongo] MONGODB_URI=memory — using in-memory data store, nothing will persist");
    return;
  }

  mongoose.connection.on("error", (err) => {
    console.error("[mongo] connection error:", err.message);
  });

  await mongoose.connect(uri);
  console.log(`[mongo] connected to ${mongoose.connection.name}`);
}
