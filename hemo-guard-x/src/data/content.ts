export const DECK_URL = 'https://claude.ai/artifact/Ci5EJ9CGJ7W5XArECQijyF'

export const MARQUEE = [
  'K− · Fy(b−) · Jk(b−)', '2–8 °C cold chain', 'RD-031 · ready · 18 km', 'SHP-2211 · in range',
  'Bombay (Oh)', 'Rh-null', 'Extended phenotype', 'Cascade alert', 'Chain of custody', 'SITE-B · low O−',
]

export const MODULES = [
  { code: 'HEMO-GUARD', title: 'الحاوية الذكية', text: 'حرارة مستمرة، وتوثيق كل تسليم بمسح المعرّف، وتخزين محلي عند الانقطاع.' },
  { code: 'HEMO-SUPPLY', title: 'المخزون والتنبؤ', text: 'مخزون كل موقع، ومؤشر خطر النقص، وتوصية بإعادة التوزيع.' },
  { code: 'RARE-LINK', title: 'شبكة المتبرعين النادرين', text: 'أنماط مؤكدة مخبرياً، وجاهزية، وتنبيه متدرج، وخريطة ندرة.' },
]

export const FLOW = [
  { t: 'T+00:00', who: 'بنك الدم الميداني', title: 'طلب عاجل لنمط نادر', text: 'لا توجد في الموقع وحدة معتمدة خالية من المستضدات المطلوبة، فيُرفع الطلب عبر المنصة.' },
  { t: 'T+00:02', who: 'RARE-LINK', title: 'بحث في الوحدات المعتمدة', text: 'يجد وحدتين مطابقتين مبدئياً في مركز الإمداد، ويحدّث مؤشر الجاهزية للموقعين.' },
  { t: 'T+00:05', who: 'RARE-LINK', title: 'تنبيه متدرج للمتبرعين الجاهزين', text: 'الطلب يصل للأقرب ثم للتالي إن لم يرد خلال عشر دقائق. من يقبل يُحال للفحص.' },
  { t: 'T+00:20', who: 'HEMO-SUPPLY', title: 'مسار الإمداد', text: 'يقترح أسرع مسار ويظهر سبب التوصية ودرجة الثقة لمسؤول الإمداد.' },
  { t: 'T+00:35', who: 'HEMO-GUARD', title: 'نقل مراقَب', text: 'تُربط الوحدتان بحاوية، ويُسجل كل تسليم واستلام مع منحنى الحرارة كاملاً.' },
  { t: 'T+01:40', who: 'مختص نقل الدم', title: 'التحقق والاعتماد', text: 'يراجع التوافق الموسع والسجل الحراري، ثم يعتمد الصرف أو يرفضه.' },
]

export const EVIDENCE = [
  { n: '2025', title: 'حالة Bombay في المملكة', text: 'طفل احتاج فصيلة Bombay النادرة، وجُلبت الوحدات المطابقة من خارج البلاد. أوصى التقرير بسجلات للفصائل النادرة.', src: 'Abuzaid & Abdalwahab · Saudi J Anaesth' },
  { n: 'ABO + Rh', title: 'فجوة في معرفة الأنماط', text: 'المعرفة المنشورة بأنماط فصائل الدم في المملكة شبه محصورة في هذين النظامين.', src: 'Owaidah et al., 2020 · J Blood Med' },
  { n: '13,954', title: 'حالة استبعاد أو هدر', text: 'لمكونات الدم خلال دراسة واحدة في مستشفى بجدة.', src: 'Tounsi et al., 2025 · Transfusion Medicine' },
]

export const ROADMAP = [
  { when: '0–6 M', title: 'تجربة محاكاة', text: 'ثلاثة مواقع افتراضية، وحاوية عرض، وسجل نادر تجريبي مع بنك دم شريك.', now: true },
  { when: '6–18 M', title: 'تشغيل تجريبي', text: 'منشآت متعددة بعد الموافقات، وربط مع أنظمة بنوك الدم القائمة.' },
  { when: '18–36 M', title: 'شبكة وطنية وخليجية', text: 'تكامل مع المنصات الوطنية وتبادل منظم للوحدات النادرة.' },
]

export const ALIGNMENT = [
  { title: 'الوصول في الوقت المناسب', text: 'هدف استراتيجي لبرنامج تحول القطاع الصحي.' },
  { title: 'الجاهزية للمخاطر', text: 'مؤشر جديد قابل للقياس لجاهزية المنشآت.' },
  { title: 'التبرع الطوعي', text: 'متبرعون جاهزون بدل تحميل ذوي المريض عبء البحث.' },
  { title: 'حماية البيانات', text: 'موافقة صريحة والتزام بنظام حماية البيانات الشخصية.' },
]

export const REFERENCES: { text: string; journal: string; url?: string }[] = [
  { text: 'Abuzaid A, Abdalwahab A (2025). Pediatric cardiac patient with Bombay blood group and LAD type II.', journal: 'Saudi Journal of Anaesthesia.' },
  { text: 'Owaidah AY et al. (2020). Phenotype frequencies of major blood group systems, Eastern Region of Saudi Arabia.', journal: 'Journal of Blood Medicine.' },
  { text: 'Tounsi et al. (2025). Reducing blood component wastage.', journal: 'Transfusion Medicine.', url: 'https://doi.org/10.1111/tme.70015' },
  { text: 'Carenzo et al. (2025). Prehospital blood product administration: consensus statement.', journal: 'JAACC.', url: 'https://doi.org/10.1186/s44158-025-00248-9' },
  { text: 'Bhowmik, Kushwaha & Bajaj (2026). Multimodal transport of whole blood, passive cold chain.', journal: 'MJAFI.', url: 'https://doi.org/10.1016/j.mjafi.2026.05.004' },
  { text: 'Engelke et al. (2026). Predicting transfusion demand: systematic review.', journal: 'Transfus Med Hemother.', url: 'https://doi.org/10.1159/000552969' },
  { text: 'Ministry of Health. Health Sector Transformation objectives.', journal: '', url: 'https://www.moh.gov.sa/support/faq/pages/faq23.aspx' },
  { text: 'Al-Watan (2024). Blood units collected in 2023 and Wateen registrations.', journal: '', url: 'https://www.alwatan.com.sa/article/1157022' },
]
