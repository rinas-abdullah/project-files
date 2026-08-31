import mongoose from "mongoose";

// A lab is entirely data-driven: a set of scenario "items" the trainee must
// classify and annotate with the indicators of compromise they noticed. The
// same schema and the same LabRunner UI on the frontend serve every lab —
// new labs are added by inserting a document, not by writing new code.
const optionSchema = new mongoose.Schema(
  { id: String, labelAr: String, label: String },
  { _id: false }
);

const iocOptionSchema = new mongoose.Schema(
  { id: String, labelAr: String, label: String },
  { _id: false }
);

const itemSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    titleAr: String,
    title: String,
    // Free-form key/value facts rendered as a details table (sender, hash,
    // source IP, etc.) — kept generic so any lab category can reuse it.
    facts: { type: [{ labelAr: String, label: String, value: String }], default: [] },
    bodyAr: String,
    body: String,
    options: { type: [optionSchema], default: [] },
    correctOptionId: { type: String, required: true },
    iocOptions: { type: [iocOptionSchema], default: [] },
    correctIocIds: { type: [String], default: [] },
    explanationAr: String,
    explanation: String,
  },
  { _id: false }
);

const labSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true },
    titleAr: { type: String, required: true },
    title: { type: String, required: true },
    descriptionAr: String,
    description: String,
    category: { type: String, enum: ["phishing", "malware", "network"], required: true },
    difficulty: { type: Number, min: 1, max: 5, default: 2 },
    // Which of the platform's readiness dimensions this lab exercises —
    // used to build the multi-dimensional readiness report.
    dimensions: { type: [String], default: [] },
    timeLimitSeconds: { type: Number, default: 300 },
    items: { type: [itemSchema], default: [] },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Lab = mongoose.model("Lab", labSchema);
