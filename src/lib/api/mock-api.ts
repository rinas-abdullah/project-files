import { Patient, Device, PatientStatus } from "../types/portal";

// --- MOCK DATA ---
const MOCK_PATIENTS: Patient[] = [
  {
    id: "pat-1",
    mrn: "#DH-8812",
    name: "سارة بنت أحمد العتيبي",
    age: 62,
    status: "alert",
    statusLabel: "تنبيه حرارة",
    complianceScore: 96,
    careType: "الرعاية المنزلية HHC",
    diagnosis: "متابعة بعد تنويم قدم سكرية",
    consultant: "د. خالد السليمان",
    lastUpdated: "منذ 10 دقائق",
    metrics: {
      healthScore: 78,
      healthScoreLabel: "يحتاج انتباه",
      maxTemp: 37.8,
      steps: 4820,
      avgPressure: 124,
      humidity: 45
    },
    recommendation: "يُظهر التحليل التراكمي لـ 14 يوماً تحسناً ملحوظاً بنسبة 35% في توزيع الضغط الديناميكي أثناء المشي، مع انخفاض الفروقات الحرارية بين القدمين. التوصية: الاستمرار بنفس الخطة مع زيادة هدف المشي اليومي بمعدل 500 خطوة.",
    alerts: [
      { id: "a1", title: "ارتفاع حرارة موضعي", description: "ارتفاع في درجة حرارة مشط القدم الأيسر بمقدار 1.2 درجة.", time: "اليوم 10:30 ص", type: "warning", recommendation: "تقليل المشي لمدة ساعتين." }
    ],
    medicalNotes: [
      { id: "n1", author: "د. خالد السليمان", date: "2024-05-12", content: "المريضة تظهر استجابة جيدة للخطة العلاجية. الجرح في القدم اليمنى التأم بنسبة 80%." }
    ]
  },
  {
    id: "pat-2",
    mrn: "#DH-7741",
    name: "محمد بن عبد العزيز الغامدي",
    age: 55,
    status: "stable",
    statusLabel: "مستقر",
    complianceScore: 91,
    careType: "متابعة دورية",
    diagnosis: "قدم سكرية مستوى أول",
    consultant: "د. خلود المطيري",
    lastUpdated: "قبل ساعتين",
    metrics: {
      healthScore: 92,
      healthScoreLabel: "ممتاز",
      maxTemp: 36.6,
      steps: 8100,
      avgPressure: 110,
      humidity: 38
    },
    alerts: [],
    medicalNotes: []
  },
  {
    id: "pat-3",
    mrn: "#DH-5529",
    name: "فهد بن ناصر الشمري",
    age: 48,
    status: "stable",
    statusLabel: "تعافي تام",
    complianceScore: 98,
    careType: "علاج طبيعي",
    diagnosis: "إعادة تأهيل ما بعد الجراحة",
    consultant: "د. ياسر عبدالمجيد",
    lastUpdated: "قبل يوم",
    metrics: {
      healthScore: 98,
      healthScoreLabel: "ممتاز",
      maxTemp: 36.4,
      steps: 12400,
      avgPressure: 105,
      humidity: 35
    },
    alerts: [],
    medicalNotes: []
  },
  {
    id: "pat-4",
    mrn: "#DH-94821",
    name: "أحمد بن عبد الله السلمان",
    age: 68,
    status: "needs_followup",
    statusLabel: "يحتاج متابعة",
    complianceScore: 82,
    careType: "متابعة عن بعد",
    diagnosis: "اعتلال عصبي سكري",
    consultant: "د. خلود المطيري",
    lastUpdated: "منذ 5 دقائق",
    metrics: {
      healthScore: 85,
      healthScoreLabel: "مستقر",
      maxTemp: 37.1,
      steps: 4281,
      avgPressure: 118,
      humidity: 42
    },
    alerts: [
      { id: "a2", title: "تنبيه كعب القدم اليمنى", description: "ارتفاع مؤقت في الضغط إلى 68 kPa. يُنصح بالاستراحة لمدة 15 دقيقة لتجنب الإجهاد الخلوي.", time: "منذ 10 دقائق", type: "warning", recommendation: "الاستراحة لمدة 15 دقيقة." },
      { id: "a3", title: "حرارة القدم طبيعية", description: "جميع مناطق القدم ضمن النطاق الحراري الآمن دون أي مؤشرات لالتهاب صامت.", time: "36.4°C", type: "success" }
    ],
    medicalNotes: []
  }
];

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
