import { pgTable, text, integer, real, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["patient", "doctor", "hospital_admin"]);
export const patientStatusEnum = pgEnum("patient_status", ["stable", "needs_followup", "alert", "critical"]);
export const alertTypeEnum = pgEnum("alert_type", ["success", "warning", "critical", "info"]);

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  role: userRoleEnum("role").notNull(),
  email: text("email").unique(),
  phone: text("phone").unique(),
  passwordHash: text("password_hash").notNull(),
  mrn: text("mrn"),
  department: text("department"),
  hospital: text("hospital"),
  deviceId: text("device_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const emailVerifications = pgTable("email_verifications", {
  email: text("email").primaryKey(),
  otpHash: text("otp_hash").notNull(),
  attempts: integer("attempts").default(0).notNull(),
  // JSON-encoded pending registration payload (name, phone, passwordHash,
  // department, hospital) applied to the users table once the code is verified.
  payload: text("payload").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const patients = pgTable("patients", {
  id: text("id").primaryKey(),
  mrn: text("mrn").notNull().unique(),
  name: text("name").notNull(),
  age: integer("age").notNull(),
  status: patientStatusEnum("status").notNull(),
  statusLabel: text("status_label").notNull(),
  complianceScore: integer("compliance_score").notNull(),
  careType: text("care_type").notNull(),
  diagnosis: text("diagnosis").notNull(),
  consultant: text("consultant").notNull(),
  lastUpdated: text("last_updated").notNull(),
  healthScore: integer("health_score").notNull(),
  healthScoreLabel: text("health_score_label").notNull(),
  maxTemp: real("max_temp").notNull(),
  steps: integer("steps").notNull(),
  avgPressure: integer("avg_pressure").notNull(),
  humidity: integer("humidity").notNull(),
  recommendation: text("recommendation"),
});

export const alerts = pgTable("alerts", {
  id: text("id").primaryKey(),
  patientId: text("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  time: text("time").notNull(),
  type: alertTypeEnum("type").notNull(),
  recommendation: text("recommendation"),
});

export const medicalNotes = pgTable("medical_notes", {
  id: text("id").primaryKey(),
  patientId: text("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
  author: text("author").notNull(),
  date: text("date").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const devices = pgTable("devices", {
  id: text("id").primaryKey(),
  deviceId: text("device_id").notNull().unique(),
  status: text("status").notNull(),
  patientId: text("patient_id").references(() => patients.id, { onDelete: "set null" }),
  patientName: text("patient_name"),
  assignedDoctor: text("assigned_doctor"),
  batteryLevel: integer("battery_level").notNull(),
  signalQuality: text("signal_quality").notNull(),
  firmwareVersion: text("firmware_version").notNull(),
  lastSync: text("last_sync").notNull(),
  isActive: boolean("is_active").notNull(),
  isStorage: boolean("is_storage").notNull(),
  location: text("location").notNull(),
});
