/**
 * Copy for the story walk ("/"), in English and Arabic.
 * Facts come from src/data — keep it that way. Product and organisation
 * names stay in Latin script in both languages.
 */
import { profile, education } from "@/data/profile";
import { roles, capabilities, community, certifications } from "@/data/experience";
import { projects } from "@/data/projects";
import { websites } from "@/data/websites";

export type Lang = "en" | "ar";
export type T = { en: string; ar: string };

/** Headline split so one word can be set in italic serif: [before, accent, after]. */
export type Headline = { en: [string, string, string]; ar: [string, string, string] };

export interface ChapterMeta {
  id: string;
  /** Short name for the map. */
  label: T;
  title: Headline;
}

export const ui = {
  loading: { en: "lacing up…", ar: "نجهّز المشية…" },
  hint: { en: "scroll to start walking", ar: "مرّر لتبدأ المشي" },
  map: { en: "map", ar: "الخريطة" },
  mapTitle: { en: "Stops on the walk", ar: "محطات المشية" },
  close: { en: "Close", ar: "إغلاق" },
  index: { en: "index", ar: "الفهرس" },
  langSwitch: { en: "ع", ar: "EN" },
  langLabel: { en: "اقرأ بالعربية", ar: "Read in English" },
  skip: { en: "Skip to the full index", ar: "انتقل إلى الفهرس الكامل" },
  open: { en: "Step inside", ar: "ادخل" },
  visit: { en: "Visit the site", ar: "زر الموقع" },
  caseInEnglish: { en: "", ar: "دراسة الحالة بالإنجليزية" },
  stop: { en: "Stop", ar: "المحطة" },
} satisfies Record<string, T>;

export const hero = {
  first: { en: profile.nameParts[0].toUpperCase(), ar: profile.nameParts[0].toUpperCase() },
  rest: { en: "ABDULLAH MURAYR", ar: "ABDULLAH MURAYR" },
  lines: [
    { en: "founder. cybersecurity & AI architect.", ar: "مؤسس. مهندس أمن سيبراني وذكاء اصطناعي." },
    { en: "a portfolio, told as a walk along the Red Sea.", ar: "بورتفوليو يُحكى كمشية على كورنيش البحر الأحمر." },
  ],
  coords: { en: `Jeddah · ${profile.coordinates}`, ar: `جدة · ${profile.coordinates}` },
};

export const chapters: ChapterMeta[] = [
  { id: "dawn", label: { en: "Dawn", ar: "الفجر" }, title: { en: ["", "", ""], ar: ["", "", ""] } },
  {
    id: "roots",
    label: { en: "Where it started", ar: "البداية" },
    title: { en: ["Where it ", "started", "."], ar: ["من هنا ", "بدأت", "."] },
  },
  {
    id: "defend",
    label: { en: "Learning to defend", ar: "تعلّم الدفاع" },
    title: { en: ["Where I learned to ", "defend", "."], ar: ["هنا تعلّمت ", "الدفاع", "."] },
  },
  {
    id: "build",
    label: { en: "What I build", ar: "ما أبنيه" },
    title: { en: ["What I ", "build", "."], ar: ["ما ", "أبنيه", "."] },
  },
  {
    id: "storefronts",
    label: { en: "Storefronts", ar: "الواجهات" },
    title: { en: ["Storefronts I ", "built", "."], ar: ["واجهات ", "بنيتها", "."] },
  },
  {
    id: "carry",
    label: { en: "What I carry", ar: "ما أحمله" },
    title: { en: ["What I ", "carry", "."], ar: ["ما ", "أحمله", " معي."] },
  },
  {
    id: "company",
    label: { en: "Who I walk with", ar: "رفقاء الطريق" },
    title: { en: ["Who I walk ", "with", "."], ar: ["مع مَن ", "أمشي", "."] },
  },
  {
    id: "talk",
    label: { en: "Let's talk", ar: "لنتحدث" },
    title: { en: ["The walk ends here.\nThe ", "conversation", " starts."], ar: ["هنا تنتهي المشية.\nويبدأ ", "الحديث", "."] },
  },
];

export const roots = {
  lines: [
    { en: `${education.institution} · ${education.field}`, ar: "جامعة الملك عبدالعزيز · الأمن السيبراني" },
    { en: `GPA ${education.gpa} / ${education.gpaScale} — excellent standing`, ar: `معدل ${education.gpa} من ${education.gpaScale} — بتقدير ممتاز` },
    { en: "Jeddah — the city this walk never leaves.", ar: "جدة — المدينة التي لا تغادرها هذه المشية." },
  ],
};

const roleAr: Record<string, { title: string; point: string }> = {
  Cyverse: {
    title: "أخصائي حوكمة ومخاطر وامتثال",
    point: "تقييم المخاطر وتحليل الثغرات، وتطبيق ضوابط الحوكمة وممارسات التطوير الآمن (SDL).",
  },
  "Clouds Zone IT International": {
    title: "مهندس أمن سيبراني وأخصائي بنية تحتية",
    point: "بناء ضوابط أمن الشبكات بمنهج الدفاع المتعمّق، وتهيئة الجدران النارية وأنظمة منع التسلل.",
  },
  "Balghsoon Clinics": {
    title: "أخصائي دعم تقني",
    point: "صيانة الأنظمة السريرية بنسبة تشغيل 99.2٪، وحماية بيانات المرضى وفق معايير HIPAA.",
  },
};

/** Oldest first — the walk moves forward in time. */
export const defend = [...roles]
  .sort((a, b) => a.start.y * 12 + a.start.m - (b.start.y * 12 + b.start.m))
  .map((r) => ({
    org: r.org,
    period: r.period,
    title: { en: r.title, ar: roleAr[r.org]?.title ?? r.title },
    point: { en: r.points[0], ar: roleAr[r.org]?.point ?? r.points[0] },
  }));

const projectAr: Record<string, { category: string; status: string }> = {
  dithar: { category: "تقنية صحية بالذكاء الاصطناعي", status: "قيد التطوير · نموذج بحثي" },
  "rasd-cyber": { category: "منصة أمن سيبراني بالذكاء الاصطناعي", status: "المنصة قيد التطوير" },
  rikaz: { category: "بنية تحتية ذكية", status: "نظام مقترح · مرحلة المفهوم" },
  mueen: { category: "ذكاء الحشود والسلامة", status: "تصميم النظام" },
  muyassir: { category: "منصة حكومية رقمية بالذكاء الاصطناعي", status: "نموذج أولي يعمل" },
  "qiddiya-explorer": { category: "تطوير ألعاب Unity", status: "مشروع سابق · الأرشيف غير متاح" },
};

export const build = {
  intro: {
    en: "Six ideas — some running, some still taking shape. Tap a frame to step inside.",
    ar: "ست أفكار — بعضها يعمل، وبعضها ما زال يتشكّل. اضغط على أي إطار لتدخله.",
  },
  items: projects.map((p) => ({
    slug: p.slug,
    index: p.index,
    name: p.name,
    cover: p.cover,
    category: { en: p.category, ar: projectAr[p.slug]?.category ?? p.category },
    status: { en: p.status, ar: projectAr[p.slug]?.status ?? p.status },
  })),
};

const siteAr: Record<string, { sector: string; contribution: string }> = {
  "la-vie-ahd": { sector: "مجوهرات · متجر إلكتروني", contribution: "تطوير الموقع" },
  "al-fahd": { sector: "استشارات هندسية وتصميم", contribution: "بنية ويب متجاوبة وتصميم واجهات وتجربة مستخدم" },
  "beirut-al-raed": { sector: "سيارات · أداء وصيانة", contribution: "بنية ويب متجاوبة وتصميم واجهات وتجربة مستخدم" },
};

export const storefronts = {
  intro: {
    en: "Real businesses, live on the web. Each window opens the site.",
    ar: "أعمال حقيقية تعمل الآن على الويب. كل نافذة تفتح الموقع.",
  },
  items: websites.map((w) => ({
    slug: w.slug,
    name: w.name,
    url: w.url,
    host: w.host,
    shot: w.leadView === "detail" ? w.detail : w.desktop,
    sector: { en: w.sector, ar: siteAr[w.slug]?.sector ?? w.sector },
    contribution: { en: w.contribution, ar: siteAr[w.slug]?.contribution ?? w.contribution },
  })),
};

const capAr: Record<string, string> = {
  security: "الأمن السيبراني والحوكمة",
  intelligence: "الذكاء الاصطناعي وتعلّم الآلة",
  engineering: "هندسة البرمجيات الشاملة",
  experience: "التصميم وتطوير الألعاب",
};

export const carry = capabilities.map((c) => ({
  key: c.key,
  label: c.label,
  title: { en: c.title, ar: capAr[c.key] ?? c.title },
  items: c.items,
}));

const communityAr: Record<string, { role: string; body: string }> = {
  "Hemmah Al-Najah Developer Division": {
    role: "عضو إشراف",
    body: "إرشاد المطورين ودعم الجودة التقنية في مجتمع المطورين.",
  },
  "Ro'yana Initiative": {
    role: "عضو ابتكار في الذكاء الاصطناعي",
    body: "المساهمة في مبادرات ابتكار تدعم تبنّي التقنيات الصحية.",
  },
  "Saudi Red Crescent Authority & Ertiwaa": {
    role: "متطوع مساهم",
    body: "تطوير منصات ويب تدعم تقديم الخدمات وإتاحة الوصول الرقمي.",
  },
};

export const company = {
  people: community.map((c) => ({
    org: c.org,
    role: { en: c.role, ar: communityAr[c.org]?.role ?? c.role },
    body: { en: c.body, ar: communityAr[c.org]?.body ?? c.body },
  })),
  certsTitle: { en: "Certificates picked up along the way", ar: "شهادات التقطتها في الطريق" },
  certs: certifications.map((c) => (c.issuer ? `${c.name} — ${c.issuer}` : c.name)),
};

export const talk = {
  sub: { en: "So — let's talk.", ar: "فلنتحدث." },
  email: { en: "Email", ar: "البريد" },
  more: { en: "Prefer reading? Open the full index", ar: "تفضّل القراءة؟ افتح الفهرس الكامل" },
  credit: { en: `Walked & built by ${profile.name}`, ar: `مشى هذه الطريق وبناها ${profile.name}` },
  links: { email: profile.email, github: profile.github, linkedin: profile.linkedin },
};

export const pick = (t: T, lang: Lang) => t[lang];
