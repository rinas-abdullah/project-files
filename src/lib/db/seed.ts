import bcrypt from "bcryptjs";
import { db } from "./client";
import { users, patients, alerts, medicalNotes, devices } from "./schema";

async function seed() {
  console.log("Seeding database...");

  const DOCTOR_PASSWORD = process.env.DEMO_DOCTOR_PASSWORD || "Dithar@Doctor2026!";
  const HOSPITAL_ADMIN_PASSWORD = process.env.DEMO_HOSPITAL_ADMIN_PASSWORD || "Dithar@Admin2026!";
  const PATIENT_PASSWORD = process.env.DEMO_PATIENT_PASSWORD || "Dithar@Patient2026!";

  await db.insert(patients).values([
    {
      id: "pat-1",
      mrn: "#DH-8812",
      name: "سارة بنت أحمد العتيبي",
      age: 62,
      status: "alert",
      statusLabel: "تنبيه حرارة موضعية",
      complianceScore: 96,
      careType: "الرعاية المنزلية HHC",
      diagnosis: "متابعة بعد تنويم قدم سكرية",
      consultant: "د. خالد السليمان",
      lastUpdated: "الآن",
      healthScore: 78,
      healthScoreLabel: "يحتاج انتباه",
      maxTemp: 37.8,
      steps: 4820,
      avgPressure: 124,
      humidity: 45,
      recommendation: "يُظهر التحليل التراكمي لـ 14 يوماً تحسناً ملحوظاً بنسبة 35% في توزيع الضغط الديناميكي، مع انخفاض الفروقات الحرارية بين القدمين. التوصية: الاستمرار بنفس الخطة مع مراقبة مشط القدم.",
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
      lastUpdated: "منذ 15 دقيقة",
      healthScore: 92,
      healthScoreLabel: "ممتاز",
      maxTemp: 36.6,
      steps: 8100,
      avgPressure: 110,
      humidity: 38,
    },
    {
      id: "pat-3",
      mrn: "#DH-5529",
      name: "فهد بن ناصر الشمري",
      age: 48,
      status: "stable",
      statusLabel: "تعافي تام",
      complianceScore: 98,
      careType: "علاج طبيعي وإعادة تأهيل",
      diagnosis: "إعادة تأهيل ما بعد الجراحة",
      consultant: "د. ياسر عبدالمجيد",
      lastUpdated: "منذ ساعة",
      healthScore: 98,
      healthScoreLabel: "ممتاز",
      maxTemp: 36.4,
      steps: 12400,
      avgPressure: 105,
      humidity: 35,
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
      healthScore: 85,
      healthScoreLabel: "مستقر",
      maxTemp: 37.1,
      steps: 4281,
      avgPressure: 118,
      humidity: 42,
    },
    {
      id: "pat-5",
      mrn: "#DH-3301",
      name: "نورة بنت سعد القحطاني",
      age: 71,
      status: "critical",
      statusLabel: "حرج — اشتباه تقرح",
      complianceScore: 74,
      careType: "رعاية مكثفة عن بعد",
      diagnosis: "تقرحات سكرية نشطة",
      consultant: "د. خالد السليمان",
      lastUpdated: "منذ دقيقتين",
      healthScore: 61,
      healthScoreLabel: "حرج",
      maxTemp: 38.4,
      steps: 1850,
      avgPressure: 148,
      humidity: 58,
    },
  ]).onConflictDoNothing();

  await db.insert(alerts).values([
    {
      id: "a1",
      patientId: "pat-1",
      title: "ارتفاع حرارة موضعي في مشط القدم الأيسر",
      description: "ارتفاع في درجة حرارة مشط القدم الأيسر بمقدار 1.2 درجة مقارنة بالخط الأساسي.",
      time: "اليوم 10:30 ص",
      type: "warning",
      recommendation: "تقليل المشي لمدة ساعتين وتخفيف الحمل على القدم اليسرى.",
    },
    {
      id: "a2",
      patientId: "pat-4",
      title: "تنبيه كعب القدم اليمنى",
      description: "ارتفاع مؤقت في الضغط إلى 68 kPa. يُنصح بالاستراحة لمدة 15 دقيقة لتجنب الإجهاد الخلوي.",
      time: "منذ 10 دقائق",
      type: "warning",
      recommendation: "الاستراحة لمدة 15 دقيقة.",
    },
    {
      id: "a3",
      patientId: "pat-5",
      title: "إنذار سريري أحمر: ارتفاع حاد في الضغط والحرارة",
      description: "مستشعرات اللباد الذكي تسجل ضغطاً غير متوازن وحرارة 38.4C على مقدمة القدم.",
      time: "منذ دقيقتين",
      type: "critical",
      recommendation: "يلزم حضور المريضة فوراً للعيادة أو توجيه فريق الرعاية المنزلية.",
    },
  ]).onConflictDoNothing();

  await db.insert(medicalNotes).values([
    {
      id: "n1",
      patientId: "pat-1",
      author: "د. خالد السليمان",
      date: "2025-05-12",
      content: "المريضة تظهر استجابة ممتازة لتوزيع الحمل عبر اللباد الطبي الذكي. التأمت التقرحات السابقة بنسبة 85%.",
    },
    {
      id: "n2",
      patientId: "pat-2",
      author: "د. خلود المطيري",
      date: "2025-05-10",
      content: "القراءات الحيوية طبيعية والامتثال لارتداء اللباد الذكي ممتاز.",
    },
  ]).onConflictDoNothing();

  await db.insert(devices).values([
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
      location: "رعاية منزلية HHC",
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
      location: "منوم جناح 4",
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
      location: "المستودع الرئيسي",
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
      location: "رعاية منزلية HHC",
    },
  ]).onConflictDoNothing();

  await db.insert(users).values([
    {
      id: "doc-1",
      name: "د. خالد السليمان",
      role: "doctor",
      email: "dr.khalid@dithar.sa",
      passwordHash: bcrypt.hashSync(DOCTOR_PASSWORD, 10),
      department: "استشاري جراحة الأوعية الدموية والقدم السكرية",
      hospital: "مدينة الملك عبدالعزيز الطبية",
    },
    {
      id: "admin-1",
      name: "إدارة المنشأة — مستشفى الملك فيصل التخصصي",
      role: "hospital_admin",
      email: "admin@kfshrc.edu.sa",
      passwordHash: bcrypt.hashSync(HOSPITAL_ADMIN_PASSWORD, 10),
      department: "إدارة التحول الرقمي وأسطول الأجهزة الطبية",
      hospital: "مستشفى الملك فيصل التخصصي ومركز الأبحاث",
    },
    {
      id: "pat-1",
      name: "سارة بنت أحمد العتيبي",
      role: "patient",
      email: "sara.alotaibi@dithar.sa",
      passwordHash: bcrypt.hashSync(PATIENT_PASSWORD, 10),
      mrn: "#DH-8812",
      deviceId: "DITHAR-PAD-9842",
      hospital: "مدينة الملك فهد الطبية",
    },
  ]).onConflictDoNothing();

  console.log("Seed complete.");
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
