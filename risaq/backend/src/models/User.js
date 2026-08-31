import mongoose from "mongoose";

const badgeAwardSchema = new mongoose.Schema(
  {
    code: { type: String, required: true },
    earnedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    points: { type: Number, default: 0 },
    badges: { type: [badgeAwardSchema], default: [] },
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
