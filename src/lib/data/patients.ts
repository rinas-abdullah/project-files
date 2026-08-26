import { Patient } from "@/lib/types/portal";

// Single source of truth for the mock clinical registry, shared by the
// patients list/detail API routes and the client-side MockAPI. Every
// consumer mutates the same objects, so a note added via one entry point
// (e.g. POST /api/patients/[id]) is visible everywhere else too.
export const PATIENTS: Patient[] = [
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
    metrics: {
      healthScore: 92,
      healthScoreLabel: "ممتاز",
      maxTemp: 36.6,
      steps: 8100,
      avgPressure: 110,
      humidity: 38
    },
    alerts: [],
    medicalNotes: [
      {
        id: "n2",
        author: "د. خلود المطيري",
        date: "2025-05-10",
        content: "القراءات الحيوية طبيعية والامتثال لارتداء اللباد الذكي ممتاز."
      }
    ]
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
    metrics: {
      healthScore: 61,
      healthScoreLabel: "حرج",
      maxTemp: 38.4,
      steps: 1850,
      avgPressure: 148,
      humidity: 58
    },
    alerts: [
      {
        id: "a3",
        title: "إنذار سريري أحمر: ارتفاع حاد في الضغط والحرارة",
        description: "مستشعرات اللباد الذكي تسجل ضغطاً غير متوازن وحرارة 38.4C على مقدمة القدم.",
        time: "منذ دقيقتين",
        type: "critical",
        recommendation: "يلزم حضور المريضة فوراً للعيادة أو توجيه فريق الرعاية المنزلية."
      }
    ],
    medicalNotes: []
  }
];

export function getPatientById(id: string): Patient | undefined {
  return PATIENTS.find(p => p.id === id);
}
