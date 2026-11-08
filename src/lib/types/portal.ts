export type UserRole = "patient" | "doctor" | "hospital_admin";

export type PatientStatus = "stable" | "needs_followup" | "alert" | "critical";

export interface Patient {
  id: string;
  mrn: string;
  name: string;
  age: number;
  status: PatientStatus;
  statusLabel: string;
  complianceScore: number;
  careType: string;
  diagnosis: string;
  consultant: string;
  lastUpdated: string;
  metrics: {
    healthScore: number;
    healthScoreLabel: string;
    maxTemp: number;
    steps: number;
    avgPressure: number;
    humidity: number;
  };
  recommendation?: string;
  alerts: Alert[];
  medicalNotes: MedicalNote[];
}

export interface Device {
  id: string;
  deviceId: string;
  status: "connected" | "disconnected" | "low_battery" | "needs_maintenance";
  patientId: string | null;
  patientName: string | null;
  assignedDoctor: string | null;
  batteryLevel: number;
  signalQuality: "Excellent" | "Good" | "Fair" | "Poor";
  firmwareVersion: string;
  lastSync: string;
  isActive: boolean;
  isStorage: boolean;
  location: string;
}

export interface Alert {
  id: string;
  title: string;
  description: string;
  time: string;
  type: "success" | "warning" | "critical" | "info";
  recommendation?: string;
}

export interface MedicalNote {
  id: string;
  author: string;
  date: string;
  content: string;
}

export interface VitalsHistory {
  date: string;
  steps: number;
  temp: number;
  pressure: number;
  humidity: number;
}
