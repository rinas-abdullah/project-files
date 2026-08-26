import { NextResponse } from "next/server";
import { Patient } from "@/lib/types/portal";

// Shared Mock Clinical Data with update support
const PATIENTS_STORE: Record<string, Patient> = {
  "pat-1": {
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
    metrics: {
      healthScore: 78,
      healthScoreLabel: "يحتاج انتباه",
      maxTemp: 37.8,
      steps: 4820,
      avgPressure: 124,
      humidity: 45
    },
    recommendation: "يُظهر التحليل التراكمي لـ 14 يوماً تحسناً ملحوظاً بنسبة 35% في توزيع الضغط الديناميكي، مع انخفاض الفروقات الحرارية بين القدمين. التوصية: الاستمرار بنفس الخطة مع مراقبة مشط القدم.",
    alerts: [
      { 
        id: "a1", 
        title: "ارتفاع حرارة موضعي في مشط القدم الأيسر", 
        description: "ارتفاع في درجة حرارة مشط القدم الأيسر بمقدار 1.2 درجة مقارنة بالخط الأساسي.", 
        time: "اليوم 10:30 ص", 
        type: "warning", 
        recommendation: "تقليل المشي لمدة ساعتين وتخفيف الحمل على القدم اليسرى." 
      }
    ],
    medicalNotes: [
      { 
        id: "n1", 
        author: "د. خالد السليمان", 
        date: "2025-05-12", 
        content: "المريضة تظهر استجابة ممتازة لتوزيع الحمل عبر اللباد الطبي الذكي. التأمت التقرحات السابقة بنسبة 85%." 
      }
    ]
  },
  "pat-2": {
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
  "pat-4": {
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
      { 
        id: "a2", 
        title: "تنبيه كعب القدم اليمنى", 
        description: "ارتفاع مؤقت في الضغط إلى 68 kPa. يُنصح بالاستراحة لمدة 15 دقيقة لتجنب الإجهاد الخلوي.", 
        time: "منذ 10 دقائق", 
        type: "warning", 
        recommendation: "الاستراحة لمدة 15 دقيقة." 
      }
    ],
    medicalNotes: []
  }
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const patient = PATIENTS_STORE[id] || PATIENTS_STORE["pat-1"];

  return NextResponse.json({
    success: true,
    patient
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const patient = PATIENTS_STORE[id] || PATIENTS_STORE["pat-1"];
  const body = await request.json();

  if (body.type === "add_note" && body.content) {
    const newNote = {
      id: `n-${Date.now()}`,
      author: body.author || "الطبيب المعالج",
      date: new Date().toISOString().split("T")[0],
      content: body.content
    };
    patient.medicalNotes.unshift(newNote);

    return NextResponse.json({
      success: true,
      message: "تم حفظ الملاحظة السريرية بنجاح",
      patient
    });
  }

  if (body.type === "update_recommendation" && body.recommendation) {
    patient.recommendation = body.recommendation;
    return NextResponse.json({
      success: true,
      message: "تم تحديث التوصية الطبية",
      patient
    });
  }

  return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
}
