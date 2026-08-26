import { Patient, Device, PatientStatus } from "../types/portal";
import { PATIENTS as MOCK_PATIENTS } from "../data/patients";

// --- MOCK DATA ---

const MOCK_DEVICES: Device[] = [
  {
    id: "dev-1",
    deviceId: "DITHAR-PAD-9842",
    status: "connected",
    patientId: "pat-4",
    patientName: "أحمد بن عبد الله السلمان",
    assignedDoctor: "د. خلود المطيري",
    batteryLevel: 92,
    signalQuality: "Excellent",
    firmwareVersion: "v2.4.1",
    lastSync: "الآن",
    isActive: true,
    isStorage: false,
    location: "رعاية منزلية HHC"
  },
  {
    id: "dev-2",
    deviceId: "DITHAR-PAD-8812",
    status: "connected",
    patientId: "pat-1",
    patientName: "سارة بنت أحمد العتيبي",
    assignedDoctor: "د. خالد السليمان",
    batteryLevel: 88,
    signalQuality: "Good",
    firmwareVersion: "v2.4.1",
    lastSync: "منذ 5 دقائق",
    isActive: true,
    isStorage: false,
    location: "منوم جناح 4"
  },
  {
    id: "dev-3",
    deviceId: "DITHAR-PAD-4091",
    status: "disconnected",
    patientId: null,
    patientName: "غير مرتبط",
    assignedDoctor: null,
    batteryLevel: 100,
    signalQuality: "Poor",
    firmwareVersion: "v2.4.0",
    lastSync: "قبل أسبوع",
    isActive: false,
    isStorage: true,
    location: "المستودع الرئيسي"
  },
  {
    id: "dev-4",
    deviceId: "DITHAR-PAD-7733",
    status: "low_battery",
    patientId: "pat-2",
    patientName: "محمد بن عبد العزيز الغامدي",
    assignedDoctor: "د. خلود المطيري",
    batteryLevel: 12,
    signalQuality: "Fair",
    firmwareVersion: "v2.3.9",
    lastSync: "منذ ساعتين",
    isActive: true,
    isStorage: false,
    location: "رعاية منزلية HHC"
  }
];

// --- MOCK API SERVICE ---
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export class MockAPI {
  // Patients
  static async getPatients(query: string = "", filterStatus: string = "all"): Promise<Patient[]> {
    await delay(800); // Simulate network
    let result = MOCK_PATIENTS;
    
    if (query) {
      const q = query.toLowerCase();
      result = result.filter(p => p.name.includes(q) || p.mrn.toLowerCase().includes(q));
    }
    
    if (filterStatus !== "all") {
      result = result.filter(p => p.status === filterStatus);
    }
    
    return result;
  }

  static async getPatientById(id: string): Promise<Patient | null> {
    await delay(600);
    return MOCK_PATIENTS.find(p => p.id === id) || null;
  }

  static async addMedicalNote(patientId: string, content: string): Promise<boolean> {
    await delay(1000);
    const patient = MOCK_PATIENTS.find(p => p.id === patientId);
    if (!patient) throw new Error("Patient not found");
    
    patient.medicalNotes.push({
      id: `n-${Date.now()}`,
      author: "د. المستخدم الحالي", // Should come from auth context
      date: new Date().toISOString().split('T')[0],
      content
    });
    return true;
  }

  // Devices
  static async getDevices(query: string = "", filterLocation: string = "all"): Promise<Device[]> {
    await delay(900);
    let result = MOCK_DEVICES;
    
    if (query) {
      const q = query.toLowerCase();
      result = result.filter(d => 
        d.deviceId.toLowerCase().includes(q) || 
        (d.patientName && d.patientName.includes(q))
      );
    }
    
    if (filterLocation === "storage") {
      result = result.filter(d => d.isStorage);
    } else if (filterLocation === "active") {
      result = result.filter(d => !d.isStorage);
    }
    
    return result;
  }

  // Hospital Stats
  static async getHospitalStats() {
    await delay(500);
    return {
      fallReduction: 42,
      ulcerReduction: 58,
      savingsEstimate: 1.45, // In Millions
      activeDevices: MOCK_DEVICES.filter(d => d.isActive).length,
      totalDevices: MOCK_DEVICES.length,
      stablePatientsPercentage: Math.round((MOCK_PATIENTS.filter(p => p.status === 'stable').length / MOCK_PATIENTS.length) * 100)
    };
  }
}
