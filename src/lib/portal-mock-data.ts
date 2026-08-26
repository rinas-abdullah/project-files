export const portalMockData = {
  patientPortal: {
    nafathUser: {
      name: "أحمد بن عبد الله السلمان",
      idPrefix: "10849****",
      mrn: "#DH-94821",
    },
    treatmentPlan: {
      stepsTarget: 8000,
      stepsCurrent: 6240,
      pressureReliefTarget: 3,
      pressureReliefCurrent: 2.5,
      balanceScore: 94.2,
    },
    livePlantar: {
      metatarsals: { value: 28, status: "آمن" },
      midfoot: { value: 14, status: "متوازن" },
      heel: { value: 48, status: "متوسط" },
    },
    alerts: [
      {
        id: 1,
        title: "تنبيه كعب القدم اليمنى",
        time: "منذ 10 دقائق",
        description: "ارتفاع مؤقت في الضغط إلى 68 kPa. يُنصح بالاستراحة لمدة 15 دقيقة لتجنب الإجهاد الخلوي.",
        type: "warning"
      },
      {
        id: 2,
        title: "حرارة القدم طبيعية",
        time: "36.4°C",
        description: "جميع مناطق القدم ضمن النطاق الحراري الآمن دون أي مؤشرات لالتهاب صامت.",
        type: "success"
      }
    ]
  },
  doctorPortal: {
    patients: [
      {
        id: 1,
        mrn: "#DH-8812",
        name: "سارة بنت أحمد العتيبي",
        age: 62,
        statusLabel: "تنبيه حرارة",
        statusType: "critical",
        compliance: 96,
        type: "الرعاية المنزلية HHC",
        diagnosis: "متابعة بعد تنويم قدم سكرية",
        consultant: "د. خالد السليمان",
        metrics: {
          aiScore: 8,
          aiScoreLabel: "منخفض",
          maxTemp: "37.8°C",
          steps: 4820
        },
        aiRecommendation: "يُظهر التحليل التراكمي لـ 14 يوماً تحسناً ملحوظاً بنسبة 35% في توزيع الضغط الديناميكي أثناء المشي، مع انخفاض الفروقات الحرارية بين القدمين. التوصية: الاستمرار بنفس الخطة مع زيادة هدف المشي اليومي بمعدل 500 خطوة."
      },
      {
        id: 2,
        mrn: "#DH-7741",
        name: "محمد بن عبد العزيز الغامدي",
        age: 55,
        statusLabel: "مستقر",
        statusType: "success",
        compliance: 91,
      },
      {
        id: 3,
        mrn: "#DH-5529",
        name: "فهد بن ناصر الشمري",
        age: 48,
        statusLabel: "تعافي تام",
        statusType: "info",
        compliance: 98,
      },
    ]
  },
  hospitalPortal: {
    stats: {
      fallReduction: 42,
      ulcerReduction: 58,
      savingsEstimate: 1.45,
    },
    fleet: [
      {
        deviceId: "DITHAR-PAD-9842",
        status: "رعاية منزلية HHC",
        statusType: "success",
        patient: "أحمد بن عبد الله السلمان",
        doctor: "د. خلود المطيري",
        battery: "متصل (92%)",
        isStorage: false,
        isActive: true
      },
      {
        deviceId: "DITHAR-PAD-8812",
        status: "منوم جناح 4",
        statusType: "success",
        patient: "سارة بنت أحمد العتيبي",
        doctor: "د. خالد السليمان",
        battery: "متصل (88%)",
        isStorage: false,
        isActive: true
      },
      {
        deviceId: "DITHAR-PAD-4091",
        status: "جاهز بالمستودع",
        statusType: "info",
        patient: "غير مرتبط",
        doctor: "—",
        battery: "مشحون (100%)",
        isStorage: true,
        isActive: false
      },
    ]
  }
};
