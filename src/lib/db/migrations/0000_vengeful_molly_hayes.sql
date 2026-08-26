CREATE TYPE "public"."alert_type" AS ENUM('success', 'warning', 'critical', 'info');--> statement-breakpoint
CREATE TYPE "public"."patient_status" AS ENUM('stable', 'needs_followup', 'alert', 'critical');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('patient', 'doctor', 'hospital_admin');--> statement-breakpoint
CREATE TABLE "alerts" (
	"id" text PRIMARY KEY NOT NULL,
	"patient_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"time" text NOT NULL,
	"type" "alert_type" NOT NULL,
	"recommendation" text
);
--> statement-breakpoint
CREATE TABLE "devices" (
	"id" text PRIMARY KEY NOT NULL,
	"device_id" text NOT NULL,
	"status" text NOT NULL,
	"patient_id" text,
	"patient_name" text,
	"assigned_doctor" text,
	"battery_level" integer NOT NULL,
	"signal_quality" text NOT NULL,
	"firmware_version" text NOT NULL,
	"last_sync" text NOT NULL,
	"is_active" boolean NOT NULL,
	"is_storage" boolean NOT NULL,
	"location" text NOT NULL,
	CONSTRAINT "devices_device_id_unique" UNIQUE("device_id")
);
--> statement-breakpoint
CREATE TABLE "medical_notes" (
	"id" text PRIMARY KEY NOT NULL,
	"patient_id" text NOT NULL,
	"author" text NOT NULL,
	"date" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "patients" (
	"id" text PRIMARY KEY NOT NULL,
	"mrn" text NOT NULL,
	"name" text NOT NULL,
	"age" integer NOT NULL,
	"status" "patient_status" NOT NULL,
	"status_label" text NOT NULL,
	"compliance_score" integer NOT NULL,
	"care_type" text NOT NULL,
	"diagnosis" text NOT NULL,
	"consultant" text NOT NULL,
	"last_updated" text NOT NULL,
	"health_score" integer NOT NULL,
	"health_score_label" text NOT NULL,
	"max_temp" real NOT NULL,
	"steps" integer NOT NULL,
	"avg_pressure" integer NOT NULL,
	"humidity" integer NOT NULL,
	"recommendation" text,
	CONSTRAINT "patients_mrn_unique" UNIQUE("mrn")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"role" "user_role" NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"mrn" text,
	"department" text,
	"hospital" text,
	"device_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "devices" ADD CONSTRAINT "devices_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medical_notes" ADD CONSTRAINT "medical_notes_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;