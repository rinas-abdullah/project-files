import mongoose from "mongoose";
import { createMemoryModel, isMemoryMode } from "../db/memoryModel.js";
import { Lab } from "./Lab.js";

const itemResultSchema = new mongoose.Schema(
  {
    itemId: String,
    selectedOptionId: String,
    optionCorrect: Boolean,
    selectedIocIds: { type: [String], default: [] },
    iocScore: Number, // 0..1
    itemScore: Number, // 0..1
  },
  { _id: false }
);

const attemptSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    lab: { type: mongoose.Schema.Types.ObjectId, ref: "Lab", required: true, index: true },
    startedAt: { type: Date, required: true },
    finishedAt: { type: Date, required: true },
    timeTakenSeconds: { type: Number, required: true },
    itemResults: { type: [itemResultSchema], default: [] },
    score: { type: Number, required: true }, // 0..100
    pointsAwarded: { type: Number, required: true },
    badgesAwarded: { type: [String], default: [] },
  },
  { timestamps: true }
);

export const Attempt = isMemoryMode
  ? createMemoryModel("Attempt", { defaults: { badgesAwarded: [] }, refs: { lab: () => Lab._store } })
  : mongoose.model("Attempt", attemptSchema);
