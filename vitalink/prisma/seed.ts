/* VitaLink seed — synthetic, realistic-looking demo data. No real patients. */
import { PrismaClient, Prisma, type CapabilityType, type IncidentType, type InterventionType, type Priority, type ResourceType, type RoleKey, type Sex, type VitalType } from "@prisma/client";
import bcrypt from "bcryptjs";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import path from "node:path";
import { encrypt, last4, lookupHash } from "../src/lib/crypto";
import { ROLE_LABELS, ROLE_PERMISSIONS } from "../src/lib/rbac";
import { classifyVital, VITAL_DEFS, type VitalTypeKey } from "../src/lib/engines/vitals";
import { assessTriage, requiredCapabilities, TRIAGE_ENGINE_VERSION, type PriorityKey } from "../src/lib/engines/triage";
import { rankHospitals, DESTINATION_ENGINE_VERSION, type HospitalCandidate } from "../src/lib/engines/destination";
import { simulateRoute, remainingAlongRoute, haversineMeters, type LatLng } from "../src/lib/engines/geo";
import { completeness } from "../src/lib/engines/completeness";
import { seeded, pick, MALE_FIRST, FEMALE_FIRST, FAMILY } from "../src/lib/integrations/synthetic";
import { sceneImage, documentImage } from "../src/lib/png";

const prisma = new PrismaClient();
const rnd = seeded("vitalink-seed-v1");
const between = (a: number, b: number) => a + rnd() * (b - a);
const int = (a: number, b: number) => Math.round(between(a, b));
const chance = (p: number) => rnd() < p;
const minutes = (n: number) => n * 60_000;
const NOW = Date.now();
const MEDIA_DIR = process.env.MEDIA_DIR ?? path.join(process.cwd(), "storage", "media");
const PASSWORD = process.env.DEMO_PASSWORD ?? "VitaLink@2026";

let codeSeq = 1000;
const code = (prefix: string, d: Date) =>
  `${prefix}-${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}-${(codeSeq++).toString(36).toUpperCase().padStart(5, "0")}`;

// ───────────────────────────── Reference data ─────────────────────────────

const HOSPITALS = [
  {
    code: "KMC",
    name: "King Medical Center",
    nameAr: "مركز الملك الطبي",
    lat: 21.5433,
    lng: 39.1728,
    address: "Al-Rawdah District, Jeddah",
    edCapacity: 40,
    caps: ["TRAUMA_CENTER", "STROKE", "CATH_LAB", "ICU", "CT", "MRI", "OPERATING_ROOM", "BLOOD_BANK", "ISOLATION", "CARDIOLOGY", "NEUROLOGY"],
  },
  {
    code: "NGH",
    name: "North General Hospital",
    nameAr: "مستشفى الشمال العام",
    lat: 21.629,
    lng: 39.156,
    address: "Al-Basateen District, North Jeddah",
    edCapacity: 30,
    caps: ["STROKE", "ICU", "PEDIATRIC", "CT", "MRI", "OPERATING_ROOM", "BLOOD_BANK", "NEUROLOGY"],
  },
  {
    code: "CEH",
    name: "Coastal Emergency Hospital",
    nameAr: "مستشفى الساحل للطوارئ",
    lat: 21.515,
    lng: 39.185,
    address: "Al-Sharafiyah District, Jeddah",
    edCapacity: 28,
    caps: ["TRAUMA_CENTER", "BURN_UNIT", "CT", "OPERATING_ROOM", "BLOOD_BANK", "ICU", "ISOLATION"],
  },
  {
    code: "UMC",
    name: "University Medical Center",
    nameAr: "المركز الطبي الجامعي",
    lat: 21.493,
    lng: 39.247,
    address: "University District, Jeddah",
    edCapacity: 45,
    caps: ["TRAUMA_CENTER", "STROKE", "CATH_LAB", "ICU", "PEDIATRIC", "CT", "MRI", "OPERATING_ROOM", "BLOOD_BANK", "CARDIOLOGY", "NEUROLOGY", "ISOLATION"],
  },
] as const;

const ALL_CAPS: CapabilityType[] = ["TRAUMA_CENTER", "STROKE", "CATH_LAB", "ICU", "PEDIATRIC", "BURN_UNIT", "CT", "MRI", "OPERATING_ROOM", "BLOOD_BANK", "ISOLATION", "CARDIOLOGY", "NEUROLOGY"];
const RESOURCES: ResourceType[] = ["ED_CAPACITY", "AVAILABLE_BEDS", "ICU_BEDS", "TRAUMA_BAY", "CT_STATUS", "CATH_LAB", "OR_STATUS", "SPECIALISTS"];

const AMBULANCES = [
  { callSign: "JED-A01", base: "Al-Salamah Station", lat: 21.595, lng: 39.15 },
  { callSign: "JED-A02", base: "Al-Safa Station", lat: 21.585, lng: 39.21 },
  { callSign: "JED-A03", base: "Al-Hamra Station", lat: 21.522, lng: 39.165 },
  { callSign: "JED-A04", base: "Al-Naseem Station", lat: 21.505, lng: 39.235 },
  { callSign: "JED-A05", base: "Obhur Station", lat: 21.705, lng: 39.13 },
  { callSign: "JED-A06", base: "Al-Faisaliyah Station", lat: 21.565, lng: 39.185 },
  { callSign: "JED-A07", base: "Al-Marwah Station", lat: 21.62, lng: 39.21 },
  { callSign: "JED-A08", base: "Al-Aziziyah Station", lat: 21.553, lng: 39.205 },
  { callSign: "JED-A09", base: "Al-Rawdah Station", lat: 21.56, lng: 39.155 },
  { callSign: "JED-A10", base: "Al-Baghdadiyah Station", lat: 21.495, lng: 39.19 },
];

const DISTRICTS: { name: string; lat: number; lng: number }[] = [
  { name: "Al-Zahra, Jeddah", lat: 21.583, lng: 39.137 },
  { name: "Al-Rehab, Jeddah", lat: 21.553, lng: 39.228 },
  { name: "Al-Andalus, Jeddah", lat: 21.528, lng: 39.162 },
  { name: "Al-Muhammadiyah, Jeddah", lat: 21.646, lng: 39.122 },
  { name: "Al-Nuzha, Jeddah", lat: 21.612, lng: 39.183 },
  { name: "Al-Mushrifah, Jeddah", lat: 21.533, lng: 39.198 },
  { name: "Al-Thaghr, Jeddah", lat: 21.479, lng: 39.215 },
  { name: "Al-Khalidiyah, Jeddah", lat: 21.551, lng: 39.142 },
  { name: "Al-Sulaimaniyah, Jeddah", lat: 21.512, lng: 39.247 },
  { name: "Obhur Al-Shamaliyah, Jeddah", lat: 21.724, lng: 39.125 },
  { name: "Al-Murjan, Jeddah", lat: 21.672, lng: 39.118 },
  { name: "Prince Sultan Rd, Jeddah", lat: 21.575, lng: 39.165 },
  { name: "Madinah Rd, Jeddah", lat: 21.555, lng: 39.192 },
  { name: "Al-Haramain Hwy, Jeddah", lat: 21.6, lng: 39.235 },
];

type Template = { type: IncidentType; complaint: string; mechanism?: string; base: { hr: number; sys: number; dia: number; spo2: number; rr: number; gcs: number; temp: number }; interventions: InterventionType[]; meds: [string, string, string][] };
const TEMPLATES: Template[] = [
  { type: "CARDIAC", complaint: "Chest pain radiating to left arm, diaphoresis", base: { hr: 104, sys: 148, dia: 90, spo2: 95, rr: 20, gcs: 15, temp: 36.8 }, interventions: ["ECG", "IV_ACCESS", "OXYGEN"], meds: [["Aspirin", "300 mg", "PO"], ["Nitroglycerin", "0.4 mg", "SL"]] },
  { type: "STROKE", complaint: "Facial droop, slurred speech, right-sided weakness", base: { hr: 88, sys: 178, dia: 96, spo2: 96, rr: 18, gcs: 14, temp: 36.9 }, interventions: ["IV_ACCESS", "ECG"], meds: [] },
  { type: "TRAFFIC_ACCIDENT", complaint: "Multiple injuries after vehicle collision", mechanism: "High-speed collision, driver, airbag deployed", base: { hr: 118, sys: 104, dia: 66, spo2: 94, rr: 22, gcs: 14, temp: 36.4 }, interventions: ["IMMOBILIZATION", "BLEEDING_CONTROL", "IV_ACCESS"], meds: [["Tranexamic acid", "1 g", "IV"], ["Fentanyl", "50 mcg", "IV"]] },
  { type: "TRAUMA", complaint: "Fall from height, suspected hip fracture", mechanism: "Fall from height ~3 m", base: { hr: 102, sys: 128, dia: 80, spo2: 97, rr: 20, gcs: 15, temp: 36.7 }, interventions: ["IMMOBILIZATION", "IV_ACCESS"], meds: [["Morphine", "5 mg", "IV"]] },
  { type: "MEDICAL_EMERGENCY", complaint: "Shortness of breath, known asthma", base: { hr: 112, sys: 132, dia: 84, spo2: 91, rr: 26, gcs: 15, temp: 37.2 }, interventions: ["OXYGEN"], meds: [["Salbutamol", "5 mg", "Nebulized"], ["Ipratropium", "0.5 mg", "Nebulized"]] },
  { type: "MEDICAL_EMERGENCY", complaint: "Hypoglycemia, confusion, known diabetic", base: { hr: 98, sys: 126, dia: 78, spo2: 97, rr: 18, gcs: 13, temp: 36.5 }, interventions: ["IV_ACCESS"], meds: [["Dextrose 10%", "250 ml", "IV"]] },
  { type: "MEDICAL_EMERGENCY", complaint: "Abdominal pain and vomiting", base: { hr: 96, sys: 122, dia: 78, spo2: 98, rr: 18, gcs: 15, temp: 37.9 }, interventions: ["IV_ACCESS"], meds: [["Ondansetron", "4 mg", "IV"], ["Paracetamol", "1 g", "IV"]] },
  { type: "MEDICAL_EMERGENCY", complaint: "Seizure, post-ictal", base: { hr: 106, sys: 136, dia: 86, spo2: 94, rr: 20, gcs: 12, temp: 37.4 }, interventions: ["AIRWAY", "OXYGEN"], meds: [["Midazolam", "5 mg", "IM"]] },
  { type: "FIRE", complaint: "Burns to arms and chest, smoke inhalation", mechanism: "House fire, enclosed space", base: { hr: 116, sys: 124, dia: 76, spo2: 92, rr: 24, gcs: 15, temp: 36.9 }, interventions: ["OXYGEN", "IV_ACCESS"], meds: [["Ringer's lactate", "1000 ml", "IV"], ["Fentanyl", "50 mcg", "IV"]] },
  { type: "CARDIAC", complaint: "Palpitations and dizziness", base: { hr: 148, sys: 112, dia: 72, spo2: 96, rr: 20, gcs: 15, temp: 36.8 }, interventions: ["ECG", "IV_ACCESS"], meds: [["Adenosine", "6 mg", "IV"]] },
  { type: "OTHER", complaint: "Minor laceration to hand", base: { hr: 84, sys: 124, dia: 78, spo2: 99, rr: 16, gcs: 15, temp: 36.7 }, interventions: ["BLEEDING_CONTROL"], meds: [] },
  { type: "OTHER", complaint: "Ankle injury after slip, unable to bear weight", base: { hr: 86, sys: 128, dia: 80, spo2: 99, rr: 16, gcs: 15, temp: 36.7 }, interventions: ["IMMOBILIZATION"], meds: [["Paracetamol", "1 g", "PO"]] },
  { type: "MEDICAL_EMERGENCY", complaint: "Fever and generalized weakness for 2 days", base: { hr: 94, sys: 118, dia: 74, spo2: 97, rr: 18, gcs: 15, temp: 38.4 }, interventions: [], meds: [["Paracetamol", "1 g", "PO"]] },
  { type: "MEDICAL_EMERGENCY", complaint: "Low back pain, no neurological deficit", base: { hr: 82, sys: 130, dia: 82, spo2: 99, rr: 16, gcs: 15, temp: 36.6 }, interventions: [], meds: [] },
  { type: "MEDICAL_EMERGENCY", complaint: "Mild allergic reaction, hives, no airway involvement", base: { hr: 92, sys: 124, dia: 78, spo2: 98, rr: 18, gcs: 15, temp: 36.8 }, interventions: ["IV_ACCESS"], meds: [["Chlorphenamine", "10 mg", "IV"]] },
  { type: "TRAFFIC_ACCIDENT", complaint: "Pedestrian struck by vehicle, leg injury", mechanism: "Pedestrian struck at moderate speed", base: { hr: 110, sys: 118, dia: 74, spo2: 96, rr: 21, gcs: 15, temp: 36.6 }, interventions: ["IMMOBILIZATION", "IV_ACCESS"], meds: [["Fentanyl", "50 mcg", "IV"]] },
];

const OVERRIDE_REASONS = [
  "Clinical gestalt — patient looks more unwell than scores suggest",
  "Vitals artefact from movement; repeat set reassuring",
  "Known chronic baseline (COPD) explains SpO2",
  "Mechanism concerning despite stable vitals",
  "Rapid improvement after treatment on scene",
];
const DIVERSION_REASONS = ["CT unavailable at original destination", "ED at capacity — diversion requested", "Specialty required: cath lab", "Smart Destination recommendation approved"];

// ───────────────────────────── helpers ─────────────────────────────

function syntheticNid() {
  return `1${String(Math.floor(rnd() * 1e9)).padStart(9, "0")}`;
}
function personName(sex: Sex) {
  return `${pick(rnd, sex === "FEMALE" ? FEMALE_FIRST : MALE_FIRST)} ${pick(rnd, FAMILY)}`;
}
function vitalRows(encounterId: string, base: Template["base"], start: number, end: number, sets: number, drift = 0, recordedById?: string) {
  const rows: Prisma.VitalSignCreateManyInput[] = [];
  for (let i = 0; i < sets; i++) {
    const at = new Date(start + ((end - start) * i) / Math.max(1, sets - 1));
    const d = i * drift;
    const v = {
      HEART_RATE: Math.round(base.hr + between(-4, 4) + d * 3),
      BLOOD_PRESSURE: Math.round(base.sys + between(-5, 5) - d * 4),
      SPO2: Math.min(100, Math.round(base.spo2 + between(-1, 1) - d)),
      RESPIRATORY_RATE: Math.round(base.rr + between(-2, 2) + d),
      GCS: Math.max(3, Math.min(15, base.gcs - (d > 2 ? 1 : 0))),
      TEMPERATURE: Math.round((base.temp + between(-0.2, 0.2)) * 10) / 10,
    } as Record<string, number>;
    const dia = Math.round(base.dia + between(-4, 4) - d * 2);
    const types: VitalType[] = i === 0 ? ["HEART_RATE", "BLOOD_PRESSURE", "SPO2", "RESPIRATORY_RATE", "GCS", "TEMPERATURE"] : ["HEART_RATE", "BLOOD_PRESSURE", "SPO2", "RESPIRATORY_RATE"];
    for (const type of types) {
      const value = v[type];
      rows.push({
        encounterId,
        type,
        value,
        value2: type === "BLOOD_PRESSURE" ? dia : null,
        unit: VITAL_DEFS[type as VitalTypeKey].unit,
        recordedAt: at,
        source: i === 0 ? "MANUAL" : "MONITOR",
        status: classifyVital(type as VitalTypeKey, value, type === "BLOOD_PRESSURE" ? dia : null),
        recordedById,
      });
    }
  }
  return rows;
}

async function writeMedia(encounterId: string, file: Buffer, ext: string) {
  const dir = path.join(MEDIA_DIR, encounterId);
  mkdirSync(dir, { recursive: true });
  const name = `${Math.floor(rnd() * 1e12).toString(36)}.${ext}`;
  writeFileSync(path.join(dir, name), file);
  return `${encounterId}/${name}`;
}

// ───────────────────────────── main ─────────────────────────────

async function main() {
  console.log("Resetting data…");
  rmSync(MEDIA_DIR, { recursive: true, force: true });
  mkdirSync(MEDIA_DIR, { recursive: true });
  await prisma.$transaction([
    prisma.auditEvent.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.alert.deleteMany(),
    prisma.handover.deleteMany(),
    prisma.destinationRecommendation.deleteMany(),
    prisma.triageAssessment.deleteMany(),
    prisma.acknowledgment.deleteMany(),
    prisma.hospitalPreparation.deleteMany(),
    prisma.destinationHistory.deleteMany(),
    prisma.destination.deleteMany(),
    prisma.mediaAttachment.deleteMany(),
    prisma.medication.deleteMany(),
    prisma.intervention.deleteMany(),
    prisma.clinicalEvent.deleteMany(),
    prisma.vitalSign.deleteMany(),
    prisma.patientEncounter.deleteMany(),
    prisma.healthProfile.deleteMany(),
    prisma.patientIdentity.deleteMany(),
    prisma.patient.deleteMany(),
    prisma.ambulanceMission.deleteMany(),
    prisma.incident.deleteMany(),
    prisma.user.deleteMany(),
    prisma.ambulance.deleteMany(),
    prisma.hospitalResource.deleteMany(),
    prisma.hospitalCapability.deleteMany(),
    prisma.hospital.deleteMany(),
    prisma.organization.deleteMany(),
    prisma.role.deleteMany(),
    prisma.integration.deleteMany(),
  ]);

  // Roles
  for (const key of Object.keys(ROLE_PERMISSIONS) as RoleKey[]) {
    await prisma.role.create({ data: { key, name: ROLE_LABELS[key].en, nameAr: ROLE_LABELS[key].ar, description: ROLE_LABELS[key].description, permissions: ROLE_PERMISSIONS[key] } });
  }

  // Organizations, hospitals
  const platform = await prisma.organization.create({ data: { code: "VITALINK", name: "VitaLink Platform", nameAr: "منصة فايتالينك", type: "PLATFORM" } });
  const ems = await prisma.organization.create({ data: { code: "JEMS", name: "Jeddah EMS", nameAr: "إسعاف جدة", type: "EMS" } });
  const hospitals: Record<string, { id: string; lat: number; lng: number; name: string; code: string; geofenceRadiusM: number; approachRadiusM: number }> = {};
  for (const h of HOSPITALS) {
    const org = await prisma.organization.create({ data: { code: h.code, name: h.name, nameAr: h.nameAr, type: "HOSPITAL" } });
    const row = await prisma.hospital.create({
      data: {
        organizationId: org.id,
        code: h.code,
        name: h.name,
        nameAr: h.nameAr,
        lat: h.lat,
        lng: h.lng,
        address: h.address,
        phone: `+966 12 ${int(600, 699)} ${int(1000, 9999)}`,
        edCapacity: h.edCapacity,
        capabilities: { create: ALL_CAPS.map((c) => ({ capability: c, available: (h.caps as readonly string[]).includes(c) })) },
      },
    });
    hospitals[h.code] = row;
    for (const type of RESOURCES) {
      const total = type === "ED_CAPACITY" ? h.edCapacity : type === "AVAILABLE_BEDS" ? Math.round(h.edCapacity * 0.6) : type === "ICU_BEDS" ? 12 : type === "SPECIALISTS" ? 8 : type === "TRAUMA_BAY" ? 3 : 1;
      let status: "AVAILABLE" | "LIMITED" | "UNAVAILABLE" | "UNKNOWN" = "AVAILABLE";
      let available: number | null = Math.max(1, Math.round(total * between(0.35, 0.7)));
      if (type === "CATH_LAB" && !(h.caps as readonly string[]).includes("CATH_LAB")) status = "UNAVAILABLE";
      if (h.code === "CEH" && type === "CT_STATUS") status = "UNAVAILABLE";
      if (h.code === "CEH" && type === "OR_STATUS") status = "LIMITED";
      if (h.code === "KMC" && type === "ICU_BEDS") {
        status = "LIMITED";
        available = 2;
      }
      if (h.code === "NGH" && type === "SPECIALISTS") status = "LIMITED";
      if (["CT_STATUS", "CATH_LAB", "OR_STATUS"].includes(type)) available = status === "UNAVAILABLE" ? 0 : 1;
      await prisma.hospitalResource.create({
        data: { hospitalId: row.id, type, status, total, available, note: h.code === "CEH" && type === "CT_STATUS" ? "Scanner down for maintenance" : null },
      });
    }
  }

  // Ambulances
  const ambulances: Record<string, { id: string; lat: number; lng: number; callSign: string }> = {};
  for (const [i, a] of AMBULANCES.entries()) {
    ambulances[a.callSign] = await prisma.ambulance.create({
      data: { organizationId: ems.id, callSign: a.callSign, plate: `${["ج", "د", "ر", "س"][i % 4]} ${["ب", "ح", "ع", "ق"][i % 4]} ${["ك", "م", "ن", "و"][i % 4]} ${1200 + i * 37}`, unitType: i % 3 === 2 ? "BLS" : "ALS", lat: a.lat, lng: a.lng, baseLat: a.lat, baseLng: a.lng, baseName: a.base },
    });
  }

  // Users
  const hash = await bcrypt.hash(PASSWORD, 11);
  type U = { email: string; name: string; role: RoleKey; org: string; hospital?: string; ambulance?: string };
  const users: U[] = [
    { email: "admin@vitalink.demo", name: "Lina Al-Mutairi", role: "SUPER_ADMIN", org: platform.id },
    { email: "analyst@vitalink.demo", name: "Yazeed Al-Dosari", role: "OPERATIONS_ANALYST", org: platform.id },
    { email: "auditor@vitalink.demo", name: "Mona Al-Hazmi", role: "AUDITOR", org: platform.id },
    { email: "emsadmin@vitalink.demo", name: "Fahad Al-Shahrani", role: "EMS_ADMIN", org: ems.id },
    { email: "dispatch@vitalink.demo", name: "Abeer Al-Sulami", role: "EMS_DISPATCH", org: ems.id },
    { email: "paramedic@vitalink.demo", name: "Omar Al-Harthi", role: "PARAMEDIC", org: ems.id, ambulance: "JED-A01" },
    { email: "nurse@vitalink.demo", name: "Huda Al-Qarni", role: "ED_NURSE", org: "KMC", hospital: "KMC" },
    { email: "doctor@vitalink.demo", name: "Dr. Tariq Al-Zahrani", role: "ED_DOCTOR", org: "KMC", hospital: "KMC" },
    { email: "edadmin@vitalink.demo", name: "Nawal Al-Ghamdi", role: "ED_ADMIN", org: "KMC", hospital: "KMC" },
    { email: "coordinator@vitalink.demo", name: "Majed Al-Otaibi", role: "HOSPITAL_COORDINATOR", org: "KMC", hospital: "KMC" },
  ];
  const medicNames = ["Rakan Al-Juhani", "Saleh Al-Amri", "Bader Al-Subaie", "Hamza Al-Maliki", "Turki Al-Shehri", "Ali Hamdan", "Mazen Bakr", "Faris Al-Harbi", "Nasser Al-Qahtani"];
  AMBULANCES.slice(1).forEach((a, i) => users.push({ email: `medic.${a.callSign.slice(-3).toLowerCase()}@vitalink.demo`, name: medicNames[i], role: "PARAMEDIC", org: ems.id, ambulance: a.callSign }));
  for (const code of ["NGH", "CEH", "UMC"]) {
    const n = code.toLowerCase();
    users.push({ email: `nurse.${n}@vitalink.demo`, name: `${pick(rnd, FEMALE_FIRST)} ${pick(rnd, FAMILY)}`, role: "ED_NURSE", org: code, hospital: code });
    users.push({ email: `edadmin.${n}@vitalink.demo`, name: `${pick(rnd, MALE_FIRST)} ${pick(rnd, FAMILY)}`, role: "ED_ADMIN", org: code, hospital: code });
  }
  const hospitalOrg = async (code: string) => (await prisma.hospital.findUniqueOrThrow({ where: { code } })).organizationId;
  const userRows: Record<string, { id: string; name: string; role: RoleKey }> = {};
  for (const u of users) {
    const orgId = u.org.length <= 4 ? await hospitalOrg(u.org) : u.org;
    userRows[u.email] = await prisma.user.create({
      data: {
        email: u.email,
        passwordHash: hash,
        name: u.name,
        role: u.role,
        organizationId: orgId,
        hospitalId: u.hospital ? hospitals[u.hospital].id : null,
        ambulanceId: u.ambulance ? ambulances[u.ambulance].id : null,
      },
    });
  }
  const crewOf = (callSign: string) => Object.entries(userRows).find(([email]) => (callSign === "JED-A01" ? email === "paramedic@vitalink.demo" : email === `medic.${callSign.slice(-3).toLowerCase()}@vitalink.demo`))![1];
  const hospitalStaff = (code: string) => {
    if (code === "KMC") return [userRows["nurse@vitalink.demo"], userRows["doctor@vitalink.demo"]];
    return [userRows[`nurse.${code.toLowerCase()}@vitalink.demo`], userRows[`edadmin.${code.toLowerCase()}@vitalink.demo`]];
  };

  // Integrations — honest status
  const integrations = [
    { key: "NAFATH", name: "Nafath", category: "Identity", status: "SIMULATED", description: "MockNafathAdapter — synthetic identities. Live Nafath requires official onboarding and credentials (NAFATH_API_URL, NAFATH_CLIENT_ID, NAFATH_CLIENT_SECRET)." },
    { key: "NPHIES", name: "NPHIES / Health Records", category: "Health information", status: "SIMULATED", description: "MockHealthRecordAdapter — synthetic health profiles. Not connected to NPHIES." },
    { key: "HIS", name: "Hospital HIS", category: "Hospital systems", status: "SIMULATED", description: "Mock HIS — simulated ADT pre-registration acknowledgment. No real hospital registration is performed." },
    { key: "EPCR", name: "EMS / ePCR", category: "EMS systems", status: "NOT_CONFIGURED", description: "External ePCR export not configured. VitaLink is the system of record for the demo." },
    { key: "MEDICAL_MONITOR", name: "Medical Monitor", category: "Devices", status: "SIMULATED", description: "Mock multiparameter monitor streaming simulated vitals. Real devices connect through MedicalMonitorAdapter." },
    { key: "ROUTING", name: "Maps / Routing", category: "Geospatial", status: "SIMULATED", description: "OpenStreetMap tiles + geographic ETA estimate with simulated route. Set ROUTING_OSRM_URL to enable an OSRM route API." },
  ] as const;
  for (const i of integrations) await prisma.integration.create({ data: { ...i } });

  // Hospital candidates for engine-based destination in historical data
  const candidates: HospitalCandidate[] = (await prisma.hospital.findMany({ include: { capabilities: true, resources: true } })).map((h) => ({
    id: h.id,
    name: h.name,
    lat: h.lat,
    lng: h.lng,
    edCapacity: h.edCapacity,
    capabilities: Object.fromEntries(h.capabilities.map((c) => [c.capability, c.available])),
    resources: Object.fromEntries(h.resources.map((r) => [r.type, h.code === "CEH" && r.type === "CT_STATUS" && chance(0.7) ? "AVAILABLE" : r.status])) as HospitalCandidate["resources"],
    load: { incoming: int(0, 3), activeEd: int(8, 26), criticalIncoming: int(0, 1), avgHandoverMin: 14 },
  }));
  const hospitalById = Object.fromEntries(Object.values(hospitals).map((h) => [h.id, h]));

  // ───────────────────────────── 100 historical cases ─────────────────────────────
  console.log("Creating 100 historical cases…");
  const ambList = Object.values(ambulances);
  for (let n = 0; n < 100; n++) {
    const dayOffset = between(0.3, 56);
    const hour = [2, 7, 9, 11, 13, 15, 17, 18, 19, 20, 21, 22, 23][int(0, 12)];
    const t0 = new Date(NOW - dayOffset * 86400_000);
    t0.setHours(hour, int(0, 59), 0, 0);
    if (t0.getTime() > NOW - minutes(180)) t0.setTime(NOW - minutes(180 + int(0, 600)));
    const tpl = pick(rnd, TEMPLATES);
    const district = pick(rnd, DISTRICTS);
    const amb = pick(rnd, ambList);
    const crew = crewOf(amb.callSign);
    const loc = { lat: district.lat + between(-0.006, 0.006), lng: district.lng + between(-0.006, 0.006) };
    const sex: Sex = chance(0.62) ? "MALE" : "FEMALE";
    const age = tpl.type === "STROKE" || tpl.type === "CARDIAC" ? int(45, 86) : chance(0.08) ? int(2, 13) : int(16, 80);
    const unknownAtStart = chance(0.25);
    const identifiedLater = unknownAtStart && chance(0.6);
    const knownFinal = !unknownAtStart || identifiedLater;
    const nid = knownFinal ? syntheticNid() : null;

    const tDispatch = t0;
    const tScene = new Date(t0.getTime() + minutes(between(5, 15)));
    const tDepart = new Date(tScene.getTime() + minutes(between(10, 24)));

    // destination via engine
    const required = requiredCapabilities({ chiefComplaint: tpl.complaint, mechanism: tpl.mechanism, age });
    const ranking = rankHospitals({ origin: loc, priority: "P2", requiredCapabilities: required, hospitals: candidates });
    const diverted = chance(0.1);
    const firstDest = diverted ? ranking[1] ?? ranking[0] : ranking[0];
    const finalDest = diverted ? ranking[0] : ranking[0];
    const route = simulateRoute(loc, { lat: hospitalById[finalDest.hospitalId].lat, lng: hospitalById[finalDest.hospitalId].lng });
    const transport = remainingAlongRoute(route, 0);
    const tArrive = new Date(tDepart.getTime() + transport.etaSeconds * 1000 * between(0.9, 1.35));
    const preAlert = chance(0.93);
    const acked = preAlert && chance(0.95);
    const tAck = acked ? new Date(tDepart.getTime() + minutes(between(0.3, chance(0.1) ? 9 : 4))) : null;
    const handoverDone = chance(0.97);
    const tHoStart = new Date(tArrive.getTime() + minutes(between(1, 6)));
    const tHoAccept = new Date(tHoStart.getTime() + minutes(between(0.5, 3)));
    const tHoDone = new Date(tHoAccept.getTime() + minutes(between(4, chance(0.1) ? 30 : 16)));
    const tRelease = new Date(tHoDone.getTime() + minutes(between(4, 14)));

    const incident = await prisma.incident.create({
      data: { code: code("INC", t0), organizationId: ems.id, type: tpl.type, status: "CLOSED", lat: loc.lat, lng: loc.lng, address: district.name, reportedAt: t0, closedAt: tRelease, createdById: userRows["dispatch@vitalink.demo"].id },
    });
    const mission = await prisma.ambulanceMission.create({
      data: {
        code: code("MSN", t0),
        incidentId: incident.id,
        ambulanceId: amb.id,
        status: "COMPLETED",
        dispatchedAt: tDispatch,
        onSceneAt: tScene,
        departedAt: tDepart,
        arrivedAt: tArrive,
        handoverAt: tHoStart,
        releasedAt: handoverDone ? tRelease : null,
        availableAt: handoverDone ? tRelease : null,
        arrivalPhase: "ARRIVED",
        routeProvider: "geo-estimate",
        etaSeconds: 0,
        distanceMeters: 0,
        leadUserId: crew.id,
      },
    });
    const patient = await prisma.patient.create({
      data: {
        isUnknown: !knownFinal,
        temporaryId: unknownAtStart ? `UNKNOWN-${sex}-${String(100 + n).padStart(5, "0")}` : null,
        fullName: knownFinal ? personName(sex) : null,
        sex,
        age,
        ageEstimated: !knownFinal,
        nationalIdEnc: nid ? encrypt(nid) : null,
        nationalIdHash: nid ? lookupHash(nid) : null,
        nationalIdLast4: nid ? last4(nid) : null,
        createdAt: tScene,
      },
    });
    if (knownFinal) {
      await prisma.patientIdentity.create({ data: { patientId: patient.id, provider: "Nafath (simulated)", method: "NATIONAL_ID", status: "VERIFIED", confidence: 0.96, externalRef: `SIM-NFT-${last4(nid!)}`, createdAt: new Date(tScene.getTime() + minutes(3)), performedById: crew.id } });
    }
    const deterioration = chance(0.12);
    const enc = await prisma.patientEncounter.create({
      data: {
        code: code("ENC", t0),
        patientId: patient.id,
        missionId: mission.id,
        incidentId: incident.id,
        status: handoverDone ? "COMPLETED" : "CANCELLED",
        priority: "P3",
        conditionTrend: deterioration ? "DETERIORATING" : chance(0.3) ? "IMPROVING" : "STABLE",
        chiefComplaint: tpl.complaint,
        mechanism: tpl.mechanism ?? null,
        destinationHospitalId: finalDest.hospitalId,
        readinessStatus: chance(0.08) ? "RESOURCE_CONSTRAINT" : chance(0.08) ? "LIMITED" : "READY",
        preAlertSentAt: preAlert ? tDepart : null,
        preAlertDelivery: preAlert ? "DELIVERED" : null,
        acknowledgedAt: tAck,
        approachingAt: new Date(tArrive.getTime() - minutes(4)),
        geofenceEnteredAt: new Date(tArrive.getTime() - minutes(1)),
        arrivedAt: tArrive,
        handoverStartedAt: tHoStart,
        handoverCompletedAt: handoverDone ? tHoDone : null,
        registrationStatus: knownFinal ? "REGISTRATION_CONFIRMED" : "NOT_STARTED",
        registrationRef: knownFinal ? `SIM-MRN-${hospitalById[finalDest.hospitalId].code}-${n}` : null,
        createdById: crew.id,
        createdAt: tScene,
        closedAt: handoverDone ? tHoDone : tArrive,
      },
    });
    const vitals = vitalRows(enc.id, tpl.base, tScene.getTime() + minutes(2), tArrive.getTime() - minutes(1), int(2, 5), deterioration ? 1.2 : 0, crew.id).filter(() => chance(0.97));
    await prisma.vitalSign.createMany({ data: vitals });
    const ints = tpl.interventions.filter(() => chance(0.8));
    await prisma.intervention.createMany({ data: ints.map((type, i) => ({ encounterId: enc.id, type, performedAt: new Date(tScene.getTime() + minutes(4 + i * 3)), performedById: crew.id, performedBy: crew.name })) });
    const meds = tpl.meds.filter(() => chance(0.75));
    await prisma.medication.createMany({ data: meds.map(([name, dose, route], i) => ({ encounterId: enc.id, name, dose, route, administeredAt: new Date(tScene.getTime() + minutes(6 + i * 4)), administeredById: crew.id, administeredBy: crew.name })) });

    const triage = assessTriage({
      vitals: vitals.map((v) => ({ type: v.type as VitalTypeKey, value: v.value, value2: v.value2, recordedAt: v.recordedAt as Date })),
      age,
      chiefComplaint: tpl.complaint,
      mechanism: tpl.mechanism,
      conditionTrend: deterioration ? "DETERIORATING" : "STABLE",
      now: tDepart,
    });
    let finalPriority: Priority = triage.suggestedPriority;
    if (chance(0.9)) {
      const override = chance(0.18);
      if (override) {
        const idx = Math.max(1, Math.min(4, Number(triage.suggestedPriority.slice(1)) + (chance(0.5) ? -1 : 1)));
        finalPriority = `P${idx}` as Priority;
      }
      await prisma.triageAssessment.create({
        data: {
          encounterId: enc.id,
          suggestedPriority: triage.suggestedPriority,
          riskScore: triage.riskScore,
          confidence: triage.confidence,
          factors: triage.factors,
          missingData: triage.missingData,
          inputs: { vitals: vitals.length, age, chiefComplaint: tpl.complaint },
          engineVersion: TRIAGE_ENGINE_VERSION,
          decision: override && finalPriority !== triage.suggestedPriority ? "OVERRIDDEN" : "CONFIRMED",
          finalPriority,
          overrideReason: override && finalPriority !== triage.suggestedPriority ? pick(rnd, OVERRIDE_REASONS) : null,
          decidedById: crew.id,
          decidedByName: crew.name,
          decidedAt: new Date(tDepart.getTime() - minutes(2)),
          createdAt: new Date(tDepart.getTime() - minutes(3)),
        },
      });
    }
    await prisma.patientEncounter.update({ where: { id: enc.id }, data: { priority: finalPriority } });

    // destination records
    await prisma.destinationRecommendation.create({
      data: {
        encounterId: enc.id,
        recommendedHospitalId: ranking[0].hospitalId,
        score: ranking[0].score,
        requiredCapabilities: required,
        ranking: ranking as unknown as Prisma.InputJsonValue,
        engineVersion: DESTINATION_ENGINE_VERSION,
        status: "APPROVED",
        requestedById: crew.id,
        requestedByName: crew.name,
        decidedById: diverted ? userRows["dispatch@vitalink.demo"].id : crew.id,
        decidedByName: diverted ? userRows["dispatch@vitalink.demo"].name : crew.name,
        decidedAt: new Date(tDepart.getTime() - minutes(1)),
        createdAt: new Date(tDepart.getTime() - minutes(2)),
      },
    });
    await prisma.destination.create({ data: { encounterId: enc.id, hospitalId: firstDest.hospitalId, source: "RECOMMENDATION", active: !diverted, selectedById: crew.id, selectedAt: new Date(tDepart.getTime() - minutes(1)), endedAt: diverted ? new Date(tDepart.getTime() + minutes(4)) : null } });
    if (diverted) {
      const reason = pick(rnd, DIVERSION_REASONS);
      await prisma.destination.create({ data: { encounterId: enc.id, hospitalId: finalDest.hospitalId, source: "DIVERSION", selectedById: userRows["dispatch@vitalink.demo"].id, selectedAt: new Date(tDepart.getTime() + minutes(4)) } });
      await prisma.destinationHistory.create({
        data: { encounterId: enc.id, fromHospitalId: firstDest.hospitalId, toHospitalId: finalDest.hospitalId, reason, changedById: userRows["dispatch@vitalink.demo"].id, changedByName: userRows["dispatch@vitalink.demo"].name, changedByRole: "EMS_DISPATCH", changedAt: new Date(tDepart.getTime() + minutes(4)) },
      });
      await prisma.alert.create({ data: { type: "DESTINATION_CHANGE", severity: "WARNING", status: "RESOLVED", message: `${enc.code} · diversion`, encounterId: enc.id, hospitalId: finalDest.hospitalId, createdAt: new Date(tDepart.getTime() + minutes(4)), resolvedAt: tArrive } });
    }
    const destCode = hospitalById[finalDest.hospitalId].code;
    const staff = hospitalStaff(destCode);
    if (acked && tAck) {
      const s = pick(rnd, staff);
      await prisma.acknowledgment.create({ data: { encounterId: enc.id, hospitalId: finalDest.hospitalId, userId: s.id, userName: s.name, role: s.role, acknowledgedAt: tAck } });
      const prepItems = required.includes("CATH_LAB") ? ["TEAM_NOTIFIED", "CATH_LAB_ALERTED", "BED_PREPARING"] : required.includes("STROKE") ? ["TEAM_NOTIFIED", "STROKE_TEAM_ACTIVATED", "CT_PREPARATION"] : required.includes("TRAUMA_CENTER") ? ["TEAM_NOTIFIED", "TRAUMA_TEAM_ACTIVATED", "BLOOD_BANK_ALERTED"] : ["TEAM_NOTIFIED", "BED_PREPARING"];
      await prisma.hospitalPreparation.createMany({ data: prepItems.map((item) => ({ encounterId: enc.id, hospitalId: finalDest.hospitalId, item: item as never, done: true, updatedById: s.id, updatedByName: s.name })) });
    }
    if (handoverDone) {
      const s = pick(rnd, staff);
      await prisma.handover.create({
        data: {
          encounterId: enc.id,
          hospitalId: finalDest.hospitalId,
          status: "COMPLETED",
          summary: { chiefComplaint: tpl.complaint, priority: finalPriority, historical: true },
          startedAt: tHoStart,
          startedById: crew.id,
          startedByName: crew.name,
          acceptedAt: tHoAccept,
          acceptedById: s.id,
          acceptedByName: s.name,
          completedAt: tHoDone,
          completedById: s.id,
          completedByName: s.name,
        },
      });
    }
    // Timeline (key milestones)
    const ev = (type: Prisma.ClinicalEventCreateManyInput["type"], at: Date, actor: { id: string; name: string; role: RoleKey } | null, detail?: object) => ({ encounterId: enc.id, type, occurredAt: at, actorId: actor?.id, actorName: actor?.name ?? "VitaLink Engine", actorRole: actor?.role, detail: detail as Prisma.InputJsonValue });
    const events: Prisma.ClinicalEventCreateManyInput[] = [
      ev("CASE_CREATED", tScene, crew, { code: enc.code }),
      ...(knownFinal ? [ev("IDENTITY_DETECTED", new Date(tScene.getTime() + minutes(3)), crew, { provider: "Nafath (simulated)" })] : []),
      ev("VITALS_RECORDED", new Date(tScene.getTime() + minutes(2)), crew),
      ...(preAlert ? [ev("HOSPITAL_NOTIFIED", tDepart, crew, { hospital: finalDest.name, delivery: "DELIVERED" })] : []),
      ...(tAck ? [ev("HOSPITAL_ACKNOWLEDGED", tAck, staff[0])] : []),
      ev("ARRIVED", tArrive, null, { hospital: finalDest.name }),
      ...(handoverDone ? [ev("HANDOVER_COMPLETED", tHoDone, staff[0])] : []),
    ];
    await prisma.clinicalEvent.createMany({ data: events });

    // Historical alerts
    if (tAck && (tAck.getTime() - tDepart.getTime()) / 60000 > 3) {
      await prisma.alert.create({ data: { type: "NO_HOSPITAL_ACK", severity: "WARNING", status: "RESOLVED", message: `${enc.code} · late acknowledgment`, encounterId: enc.id, hospitalId: finalDest.hospitalId, createdAt: new Date(tDepart.getTime() + minutes(3)), acknowledgedAt: tAck, resolvedAt: tAck } });
    }
    if (handoverDone && (tHoDone.getTime() - tArrive.getTime()) / 60000 > 20) {
      await prisma.alert.create({ data: { type: "LONG_HANDOVER", severity: "WARNING", status: "RESOLVED", message: `${enc.code} · long handover`, encounterId: enc.id, hospitalId: finalDest.hospitalId, createdAt: new Date(tArrive.getTime() + minutes(20)), resolvedAt: tHoDone } });
    }
    const low = vitals.find((v) => v.type === "SPO2" && v.value < 90);
    if (low) {
      await prisma.alert.create({ data: { type: "LOW_SPO2", severity: "CRITICAL", status: "RESOLVED", message: `${enc.code} · SpO2 ${low.value}%`, encounterId: enc.id, hospitalId: finalDest.hospitalId, createdAt: low.recordedAt as Date, acknowledgedAt: new Date((low.recordedAt as Date).getTime() + minutes(between(0.5, 4))), resolvedAt: tArrive } });
    }
    const c = completeness({
      identityKnown: knownFinal,
      chiefComplaint: tpl.complaint,
      vitalTypes: [...new Set(vitals.map((v) => v.type))],
      interventions: ints.length,
      medications: meds.length,
      etaKnown: true,
      destinationSet: true,
      handoverCompleted: handoverDone,
    });
    await prisma.patientEncounter.update({ where: { id: enc.id }, data: { completeness: c.score } });
  }

  // Historical hospital resource constraint alerts
  for (let i = 0; i < 9; i++) {
    const h = pick(rnd, Object.values(hospitals));
    const at = new Date(NOW - between(1, 55) * 86400_000);
    await prisma.alert.create({ data: { type: "RESOURCE_UNAVAILABLE", severity: "WARNING", status: "RESOLVED", message: `${h.name} · ${pick(rnd, ["CT_STATUS", "OR_STATUS", "ICU_BEDS", "CATH_LAB"])} UNAVAILABLE`, hospitalId: h.id, createdAt: at, resolvedAt: new Date(at.getTime() + minutes(between(30, 300))) } });
  }

  // Historical logins (system usage)
  const allUsers = Object.values(userRows);
  for (let d = 0; d < 56; d++) {
    const count = int(6, 14);
    for (let i = 0; i < count; i++) {
      const u = pick(rnd, allUsers);
      const at = new Date(NOW - d * 86400_000 - minutes(int(30, 1300)));
      await prisma.auditEvent.create({ data: { userId: u.id, userEmail: Object.keys(userRows).find((k) => userRows[k].id === u.id), role: u.role, action: "auth.login", entityType: "User", entityId: u.id, createdAt: at, ip: "10.0.0.1", userAgent: "seed" } });
    }
  }

  // ───────────────────────────── 7 live demo cases ─────────────────────────────
  console.log("Creating live demo cases…");
  type Demo = {
    amb: string;
    district: { name: string; lat: number; lng: number };
    type: IncidentType;
    complaint: string;
    mechanism?: string;
    patient: { known: boolean; sex: Sex; age: number; name?: string; temporaryId?: string };
    dest: string;
    progress: number;
    priority: Priority;
    status: "ACTIVE" | "PRE_ALERT_SENT" | "ACKNOWLEDGED" | "PREPARING" | "APPROACHING" | "DIVERTED";
    readiness: "NOT_STARTED" | "REVIEWING" | "PREPARING" | "READY" | "LIMITED" | "RESOURCE_CONSTRAINT";
    prealertMinAgo?: number;
    ack?: boolean;
    prep?: string[];
    base: Template["base"];
    drift?: number;
    sets?: number;
    interventions: InterventionType[];
    meds: [string, string, string][];
    condition?: "STABLE" | "DETERIORATING" | "CRITICAL" | "IMPROVING";
    divertFrom?: string;
    divertReason?: string;
    incidentKey?: string;
    massCasualty?: boolean;
    media?: "scene" | "burn" | "wound";
    missionStatus?: "ON_SCENE" | "TRANSPORTING";
  };
  const demos: Demo[] = [
    {
      amb: "JED-A02",
      district: { name: "Al-Nuzha, Jeddah", lat: 21.612, lng: 39.183 },
      type: "CARDIAC",
      complaint: "Chest pain radiating to left arm for 40 min, diaphoresis",
      patient: { known: true, sex: "MALE", age: 58, name: "Khalid Al-Ghamdi" },
      dest: "KMC",
      progress: 0.15,
      priority: "P2",
      status: "PRE_ALERT_SENT",
      readiness: "NOT_STARTED",
      prealertMinAgo: 1,
      base: { hr: 108, sys: 152, dia: 92, spo2: 95, rr: 20, gcs: 15, temp: 36.8 },
      interventions: ["ECG", "OXYGEN", "IV_ACCESS"],
      meds: [["Aspirin", "300 mg", "PO"], ["Nitroglycerin", "0.4 mg", "SL"]],
    },
    {
      amb: "JED-A03",
      district: { name: "Madinah Rd / Palestine St junction, Jeddah", lat: 21.5385, lng: 39.198 },
      type: "TRAFFIC_ACCIDENT",
      complaint: "Multiple trauma after vehicle collision — chest and abdominal pain",
      mechanism: "High-speed head-on collision, driver, airbag deployed, entrapment 10 min",
      patient: { known: true, sex: "MALE", age: 34, name: "Faisal Al-Qahtani" },
      dest: "UMC",
      progress: 0.35,
      priority: "P1",
      status: "PREPARING",
      readiness: "PREPARING",
      prealertMinAgo: 6,
      ack: true,
      prep: ["TEAM_NOTIFIED", "TRAUMA_TEAM_ACTIVATED", "CT_PREPARATION", "BLOOD_BANK_ALERTED"],
      base: { hr: 124, sys: 98, dia: 60, spo2: 93, rr: 24, gcs: 13, temp: 36.3 },
      interventions: ["IMMOBILIZATION", "BLEEDING_CONTROL", "IV_ACCESS", "OXYGEN"],
      meds: [["Tranexamic acid", "1 g", "IV"], ["Fentanyl", "50 mcg", "IV"]],
      incidentKey: "MVC",
      massCasualty: true,
      media: "scene",
    },
    {
      amb: "JED-A05",
      district: { name: "Obhur Al-Shamaliyah, Jeddah", lat: 21.724, lng: 39.125 },
      type: "STROKE",
      complaint: "Facial droop, slurred speech, left-sided weakness — onset 35 min ago",
      patient: { known: true, sex: "FEMALE", age: 67, name: "Hessa Al-Shehri" },
      dest: "NGH",
      progress: 0.62,
      priority: "P1",
      status: "ACKNOWLEDGED",
      readiness: "READY",
      prealertMinAgo: 9,
      ack: true,
      prep: ["TEAM_NOTIFIED", "STROKE_TEAM_ACTIVATED", "CT_PREPARATION", "BED_PREPARING"],
      base: { hr: 92, sys: 184, dia: 98, spo2: 96, rr: 18, gcs: 14, temp: 36.9 },
      interventions: ["IV_ACCESS", "ECG"],
      meds: [],
    },
    {
      amb: "JED-A06",
      district: { name: "Al-Andalus, Jeddah", lat: 21.528, lng: 39.162 },
      type: "MEDICAL_EMERGENCY",
      complaint: "Found unconscious in street, unresponsive to voice",
      patient: { known: false, sex: "MALE", age: 40, temporaryId: "UNKNOWN-MALE-00482" },
      dest: "KMC",
      progress: 0.2,
      priority: "P1",
      status: "PRE_ALERT_SENT",
      readiness: "NOT_STARTED",
      prealertMinAgo: 5,
      base: { hr: 52, sys: 100, dia: 64, spo2: 91, rr: 9, gcs: 7, temp: 35.8 },
      interventions: ["AIRWAY", "OXYGEN", "IV_ACCESS"],
      meds: [["Naloxone", "0.4 mg", "IV"]],
    },
    {
      amb: "JED-A07",
      district: { name: "Al-Haramain Hwy, Jeddah", lat: 21.6, lng: 39.235 },
      type: "MEDICAL_EMERGENCY",
      complaint: "Severe shortness of breath, COPD exacerbation, worsening",
      patient: { known: true, sex: "MALE", age: 72, name: "Saad Al-Harbi" },
      dest: "KMC",
      progress: 0.4,
      priority: "P2",
      status: "ACKNOWLEDGED",
      readiness: "REVIEWING",
      prealertMinAgo: 7,
      ack: true,
      base: { hr: 112, sys: 134, dia: 82, spo2: 93, rr: 26, gcs: 15, temp: 37.6 },
      drift: 1.6,
      sets: 6,
      condition: "DETERIORATING",
      interventions: ["OXYGEN", "IV_ACCESS"],
      meds: [["Salbutamol", "5 mg", "Nebulized"], ["Hydrocortisone", "100 mg", "IV"]],
    },
    {
      amb: "JED-A08",
      district: { name: "Al-Mushrifah, Jeddah", lat: 21.533, lng: 39.212 },
      type: "FIRE",
      complaint: "Burns to face, chest and both arms (~20% TBSA), smoke inhalation",
      mechanism: "Kitchen gas cylinder fire, enclosed space",
      patient: { known: true, sex: "FEMALE", age: 41, name: "Reem Al-Maliki" },
      dest: "CEH",
      progress: 0.3,
      priority: "P2",
      status: "PREPARING",
      readiness: "RESOURCE_CONSTRAINT",
      prealertMinAgo: 6,
      ack: true,
      prep: ["TEAM_NOTIFIED", "BED_PREPARING"],
      base: { hr: 118, sys: 126, dia: 78, spo2: 93, rr: 24, gcs: 15, temp: 36.9 },
      interventions: ["OXYGEN", "IV_ACCESS"],
      meds: [["Ringer's lactate", "1000 ml", "IV"], ["Fentanyl", "50 mcg", "IV"]],
      media: "burn",
    },
    {
      amb: "JED-A09",
      district: { name: "Al-Khalidiyah, Jeddah", lat: 21.551, lng: 39.142 },
      type: "TRAUMA",
      complaint: "Fall from height (4 m) at construction site, suspected pelvic fracture",
      mechanism: "Fall from height ~4 m onto concrete",
      patient: { known: true, sex: "MALE", age: 29, name: "Ziyad Al-Juhani" },
      dest: "UMC",
      divertFrom: "CEH",
      divertReason: "Coastal Emergency Hospital CT unavailable — trauma imaging required",
      progress: 0.25,
      priority: "P1",
      status: "DIVERTED",
      readiness: "NOT_STARTED",
      prealertMinAgo: 8,
      base: { hr: 120, sys: 102, dia: 64, spo2: 95, rr: 22, gcs: 15, temp: 36.5 },
      interventions: ["IMMOBILIZATION", "IV_ACCESS"],
      meds: [["Fentanyl", "75 mcg", "IV"], ["Tranexamic acid", "1 g", "IV"]],
      media: "wound",
    },
    {
      amb: "JED-A10",
      district: { name: "Madinah Rd / Palestine St junction, Jeddah", lat: 21.5385, lng: 39.198 },
      type: "TRAFFIC_ACCIDENT",
      complaint: "Passenger, neck pain, seatbelt sign",
      mechanism: "Same collision — rear passenger, restrained",
      patient: { known: false, sex: "FEMALE", age: 25, temporaryId: "UNKNOWN-FEMALE-00483" },
      dest: "KMC",
      progress: 0,
      priority: "P3",
      status: "ACTIVE",
      readiness: "NOT_STARTED",
      base: { hr: 96, sys: 124, dia: 80, spo2: 98, rr: 18, gcs: 15, temp: 36.7 },
      interventions: ["IMMOBILIZATION"],
      meds: [],
      incidentKey: "MVC",
      missionStatus: "ON_SCENE",
    },
  ];

  const incidentsByKey: Record<string, string> = {};
  for (const d of demos) {
    const amb = ambulances[d.amb];
    const crew = crewOf(d.amb);
    const dest = hospitals[d.dest];
    const t0 = new Date(NOW - minutes((d.prealertMinAgo ?? 0) + 22));
    let incidentId = d.incidentKey ? incidentsByKey[d.incidentKey] : undefined;
    if (!incidentId) {
      const inc = await prisma.incident.create({
        data: { code: code("INC", t0), organizationId: ems.id, type: d.massCasualty ? "MASS_CASUALTY" : d.type, status: "OPEN", lat: d.district.lat, lng: d.district.lng, address: d.district.name, description: d.massCasualty ? "Multi-vehicle collision, 3 vehicles involved" : null, isMassCasualty: !!d.massCasualty, reportedAt: t0, createdById: userRows["dispatch@vitalink.demo"].id },
      });
      incidentId = inc.id;
      if (d.incidentKey) incidentsByKey[d.incidentKey] = inc.id;
    }
    const origin = d.district;
    const route = simulateRoute(origin, { lat: dest.lat, lng: dest.lng });
    const idx = Math.floor((route.length - 1) * d.progress);
    const pos: LatLng = route[idx];
    const rem = remainingAlongRoute(route, idx);
    const transporting = d.missionStatus !== "ON_SCENE";
    const tScene = new Date(t0.getTime() + minutes(6));
    const tDepart = new Date(NOW - minutes(d.prealertMinAgo ?? 0));
    const mission = await prisma.ambulanceMission.create({
      data: {
        code: code("MSN", t0),
        incidentId,
        ambulanceId: amb.id,
        status: transporting ? "TRANSPORTING" : "ON_SCENE",
        dispatchedAt: t0,
        onSceneAt: tScene,
        departedAt: transporting ? tDepart : null,
        arrivalPhase: haversineMeters(pos, dest) <= dest.approachRadiusM ? "APPROACHING" : "EN_ROUTE",
        routeJson: transporting ? (route as unknown as Prisma.InputJsonValue) : undefined,
        routeIndex: transporting ? idx : 0,
        routeProvider: "geo-estimate",
        etaSeconds: transporting ? rem.etaSeconds : null,
        distanceMeters: transporting ? rem.distanceMeters : null,
        etaUpdatedAt: new Date(),
        leadUserId: crew.id,
      },
    });
    await prisma.ambulance.update({ where: { id: amb.id }, data: { status: transporting ? "TRANSPORTING" : "ON_SCENE", lat: transporting ? pos.lat : origin.lat, lng: transporting ? pos.lng : origin.lng, speedKmh: transporting ? 52 : 0, lastPositionAt: new Date() } });

    const nid = d.patient.known ? syntheticNid() : null;
    const patient = await prisma.patient.create({
      data: {
        isUnknown: !d.patient.known,
        temporaryId: d.patient.temporaryId ?? null,
        fullName: d.patient.name ?? null,
        sex: d.patient.sex,
        age: d.patient.age,
        ageEstimated: !d.patient.known,
        nationalIdEnc: nid ? encrypt(nid) : null,
        nationalIdHash: nid ? lookupHash(nid) : null,
        nationalIdLast4: nid ? last4(nid) : null,
      },
    });
    if (nid) {
      await prisma.patientIdentity.create({ data: { patientId: patient.id, provider: "Nafath (simulated)", method: "NATIONAL_ID", status: "VERIFIED", confidence: 0.96, externalRef: `SIM-NFT-${last4(nid)}`, performedById: crew.id } });
      const r = seeded(`hr:${nid}`);
      await prisma.healthProfile.create({
        data: {
          patientId: patient.id,
          source: "NPHIES / Health Records (simulated)",
          bloodType: pick(r, ["O+", "A+", "B+", "AB+", "O-"]),
          allergies: d.amb === "JED-A07" ? ["Penicillin"] : d.amb === "JED-A02" ? [] : [pick(r, ["Latex", "Sulfa drugs", "Morphine"])],
          chronicConditions: d.amb === "JED-A07" ? ["COPD", "Hypertension"] : d.amb === "JED-A02" ? ["Type 2 diabetes", "Hypertension"] : d.amb === "JED-A05" ? ["Atrial fibrillation", "Hypertension"] : [],
          medicalAlerts: d.amb === "JED-A05" ? ["Anticoagulated — bleeding risk"] : [],
          medicationHistory: d.amb === "JED-A05" ? [{ name: "Apixaban", dose: "5 mg BID" }, { name: "Amlodipine", dose: "5 mg OD" }] : d.amb === "JED-A02" ? [{ name: "Metformin", dose: "500 mg BID" }, { name: "Atorvastatin", dose: "40 mg OD" }] : [],
          criticalDiagnoses: d.amb === "JED-A02" ? ["Previous NSTEMI (2023)"] : [],
        },
      });
    }
    const destinationHospitalId = dest.id;
    const enc = await prisma.patientEncounter.create({
      data: {
        code: code("ENC", t0),
        patientId: patient.id,
        missionId: mission.id,
        incidentId,
        status: d.status,
        priority: d.priority,
        conditionTrend: d.condition ?? "STABLE",
        chiefComplaint: d.complaint,
        mechanism: d.mechanism ?? null,
        destinationHospitalId: transporting ? destinationHospitalId : null,
        readinessStatus: d.readiness,
        preAlertSentAt: d.prealertMinAgo != null ? new Date(NOW - minutes(d.prealertMinAgo + (d.divertFrom ? 4 : 0))) : null,
        preAlertDelivery: d.prealertMinAgo != null ? "DELIVERED" : null,
        acknowledgedAt: d.ack ? new Date(NOW - minutes(Math.max(0.5, (d.prealertMinAgo ?? 1) - 1.5))) : null,
        createdById: crew.id,
        createdAt: tScene,
      },
    });
    if (transporting) {
      if (d.divertFrom) {
        const from = hospitals[d.divertFrom];
        await prisma.destination.create({ data: { encounterId: enc.id, hospitalId: from.id, source: "RECOMMENDATION", active: false, selectedById: crew.id, selectedAt: new Date(NOW - minutes(14)), endedAt: new Date(NOW - minutes(8)) } });
        await prisma.destination.create({ data: { encounterId: enc.id, hospitalId: dest.id, source: "DIVERSION", selectedById: userRows["dispatch@vitalink.demo"].id, selectedAt: new Date(NOW - minutes(8)) } });
        await prisma.destinationHistory.create({ data: { encounterId: enc.id, fromHospitalId: from.id, toHospitalId: dest.id, reason: d.divertReason!, changedById: userRows["dispatch@vitalink.demo"].id, changedByName: userRows["dispatch@vitalink.demo"].name, changedByRole: "EMS_DISPATCH", changedAt: new Date(NOW - minutes(8)) } });
        await prisma.alert.create({ data: { type: "DESTINATION_CHANGE", severity: "WARNING", message: `${enc.code} · ${from.name} → ${dest.name}`, encounterId: enc.id, hospitalId: dest.id, ambulanceId: amb.id, createdAt: new Date(NOW - minutes(8)) } });
      } else {
        await prisma.destination.create({ data: { encounterId: enc.id, hospitalId: dest.id, source: "RECOMMENDATION", selectedById: crew.id, selectedAt: new Date(NOW - minutes((d.prealertMinAgo ?? 0) + 1)) } });
      }
    }
    const vitals = vitalRows(enc.id, d.base, tScene.getTime() + minutes(2), NOW - minutes(0.5), d.sets ?? 3, d.drift ?? 0, crew.id);
    await prisma.vitalSign.createMany({ data: vitals });
    await prisma.intervention.createMany({ data: d.interventions.map((type, i) => ({ encounterId: enc.id, type, performedAt: new Date(tScene.getTime() + minutes(3 + i * 2)), performedById: crew.id, performedBy: crew.name })) });
    await prisma.medication.createMany({ data: d.meds.map(([name, dose, route], i) => ({ encounterId: enc.id, name, dose, route, administeredAt: new Date(tScene.getTime() + minutes(5 + i * 3)), administeredById: crew.id, administeredBy: crew.name })) });

    const triage = assessTriage({
      vitals: vitals.map((v) => ({ type: v.type as VitalTypeKey, value: v.value, value2: v.value2, recordedAt: v.recordedAt as Date })),
      age: d.patient.age,
      chiefComplaint: d.complaint,
      mechanism: d.mechanism,
      conditionTrend: d.condition ?? "STABLE",
    });
    if (d.amb !== "JED-A10") {
      await prisma.triageAssessment.create({
        data: {
          encounterId: enc.id,
          suggestedPriority: triage.suggestedPriority,
          riskScore: triage.riskScore,
          confidence: triage.confidence,
          factors: triage.factors,
          missingData: triage.missingData,
          inputs: { vitals: vitals.length, age: d.patient.age, chiefComplaint: d.complaint, mechanism: d.mechanism ?? null },
          engineVersion: TRIAGE_ENGINE_VERSION,
          decision: d.amb === "JED-A02" ? "PENDING" : triage.suggestedPriority === d.priority ? "CONFIRMED" : "OVERRIDDEN",
          finalPriority: d.amb === "JED-A02" ? null : d.priority,
          overrideReason: d.amb !== "JED-A02" && triage.suggestedPriority !== d.priority ? "Clinical assessment on scene" : null,
          decidedById: d.amb === "JED-A02" ? null : crew.id,
          decidedByName: d.amb === "JED-A02" ? null : crew.name,
          decidedAt: d.amb === "JED-A02" ? null : new Date(NOW - minutes((d.prealertMinAgo ?? 0) + 2)),
          createdAt: new Date(NOW - minutes((d.prealertMinAgo ?? 0) + 3)),
        },
      });
    }

    if (d.ack) {
      const s = hospitalStaff(d.dest)[0];
      await prisma.acknowledgment.create({ data: { encounterId: enc.id, hospitalId: dest.id, userId: s.id, userName: s.name, role: s.role, acknowledgedAt: new Date(NOW - minutes(Math.max(0.5, (d.prealertMinAgo ?? 1) - 1.5))) } });
      if (d.prep) await prisma.hospitalPreparation.createMany({ data: d.prep.map((item) => ({ encounterId: enc.id, hospitalId: dest.id, item: item as never, done: true, updatedById: s.id, updatedByName: s.name })) });
    }
    if (d.media) {
      const img = d.media === "scene" ? sceneImage(2) : d.media === "burn" ? documentImage([200, 90, 60]) : documentImage([170, 40, 50]);
      const key = await writeMedia(enc.id, img, "png");
      await prisma.mediaAttachment.create({ data: { encounterId: enc.id, kind: "IMAGE", category: d.media === "scene" ? "SCENE" : d.media === "burn" ? "BURN" : "WOUND", mimeType: "image/png", sizeBytes: img.length, storageKey: key, originalName: `${d.media}.png`, caption: d.media === "scene" ? "Vehicle positions on arrival (synthetic demo image)" : "Injury documentation (synthetic demo image)", uploadedById: crew.id, uploadedBy: crew.name, createdAt: new Date(tScene.getTime() + minutes(4)) } });
    }

    // Timeline
    const events: Prisma.ClinicalEventCreateManyInput[] = [
      { encounterId: enc.id, type: "CASE_CREATED", occurredAt: tScene, actorId: crew.id, actorName: crew.name, actorRole: "PARAMEDIC", detail: { code: enc.code, unknown: !d.patient.known, temporaryId: d.patient.temporaryId ?? null } },
      ...(nid ? [{ encounterId: enc.id, type: "IDENTITY_DETECTED" as const, occurredAt: new Date(tScene.getTime() + minutes(2)), actorId: crew.id, actorName: crew.name, actorRole: "PARAMEDIC" as const, detail: { provider: "Nafath (simulated)", last4: last4(nid) } }, { encounterId: enc.id, type: "HEALTH_RECORD_RETRIEVED" as const, occurredAt: new Date(tScene.getTime() + minutes(2.2)), actorName: "VitaLink Engine", detail: { source: "NPHIES / Health Records (simulated)" } }] : []),
      { encounterId: enc.id, type: "VITALS_RECORDED", occurredAt: new Date(tScene.getTime() + minutes(2)), actorId: crew.id, actorName: crew.name, actorRole: "PARAMEDIC" },
      ...d.interventions.map((type, i) => ({ encounterId: enc.id, type: "INTERVENTION_PERFORMED" as const, occurredAt: new Date(tScene.getTime() + minutes(3 + i * 2)), actorId: crew.id, actorName: crew.name, actorRole: "PARAMEDIC" as const, detail: { type } })),
      ...d.meds.map(([name, dose, route], i) => ({ encounterId: enc.id, type: "MEDICATION_GIVEN" as const, occurredAt: new Date(tScene.getTime() + minutes(5 + i * 3)), actorId: crew.id, actorName: crew.name, actorRole: "PARAMEDIC" as const, detail: { name, dose, route } })),
      ...(d.media ? [{ encounterId: enc.id, type: "PHOTO_UPLOADED" as const, occurredAt: new Date(tScene.getTime() + minutes(4)), actorId: crew.id, actorName: crew.name, actorRole: "PARAMEDIC" as const, detail: { kind: "IMAGE" } }] : []),
      ...(d.prealertMinAgo != null ? [{ encounterId: enc.id, type: "HOSPITAL_NOTIFIED" as const, occurredAt: new Date(NOW - minutes(d.prealertMinAgo + (d.divertFrom ? 4 : 0))), actorId: crew.id, actorName: crew.name, actorRole: "PARAMEDIC" as const, detail: { hospital: d.divertFrom ? hospitals[d.divertFrom].name : dest.name, delivery: "DELIVERED" } }] : []),
      ...(d.divertFrom ? [{ encounterId: enc.id, type: "DESTINATION_CHANGED" as const, occurredAt: new Date(NOW - minutes(8)), actorId: userRows["dispatch@vitalink.demo"].id, actorName: userRows["dispatch@vitalink.demo"].name, actorRole: "EMS_DISPATCH" as const, detail: { from: hospitals[d.divertFrom].name, to: dest.name, reason: d.divertReason } }] : []),
      ...(d.ack ? [{ encounterId: enc.id, type: "HOSPITAL_ACKNOWLEDGED" as const, occurredAt: new Date(NOW - minutes(Math.max(0.5, (d.prealertMinAgo ?? 1) - 1.5))), actorId: hospitalStaff(d.dest)[0].id, actorName: hospitalStaff(d.dest)[0].name, actorRole: hospitalStaff(d.dest)[0].role, detail: { hospital: dest.name } }] : []),
      ...(d.condition === "DETERIORATING" ? [{ encounterId: enc.id, type: "CONDITION_CHANGED" as const, occurredAt: new Date(NOW - minutes(2)), actorId: crew.id, actorName: crew.name, actorRole: "PARAMEDIC" as const, detail: { from: "STABLE", to: "DETERIORATING" } }] : []),
      ...(d.readiness === "RESOURCE_CONSTRAINT" ? [{ encounterId: enc.id, type: "READINESS_CHANGED" as const, occurredAt: new Date(NOW - minutes(3)), actorId: hospitalStaff(d.dest)[0].id, actorName: hospitalStaff(d.dest)[0].name, actorRole: hospitalStaff(d.dest)[0].role, detail: { from: "PREPARING", to: "RESOURCE_CONSTRAINT", note: "CT scanner down — burns bed available, imaging limited" } }] : []),
    ];
    await prisma.clinicalEvent.createMany({ data: events });

    // Live alerts per scenario
    const lastSp = vitals.filter((v) => v.type === "SPO2").at(-1);
    if (lastSp && lastSp.value < 90) await prisma.alert.create({ data: { type: "LOW_SPO2", severity: "CRITICAL", message: `${d.patient.name ?? d.patient.temporaryId} · SpO2 ${lastSp.value}%`, dedupeKey: `LOW_SPO2:${enc.id}`, encounterId: enc.id, hospitalId: dest.id, ambulanceId: amb.id } });
    if (d.drift) await prisma.alert.create({ data: { type: "FALLING_BP", severity: "WARNING", message: `${d.patient.name} · SBP falling`, dedupeKey: `FALLING_BP:${enc.id}`, encounterId: enc.id, hospitalId: dest.id, ambulanceId: amb.id } });
    if (d.condition === "DETERIORATING") await prisma.alert.create({ data: { type: "CRITICAL_DETERIORATION", severity: "WARNING", message: `${enc.code} · ${d.patient.name} · DETERIORATING`, dedupeKey: `CONDITION:${enc.id}`, encounterId: enc.id, hospitalId: dest.id, ambulanceId: amb.id } });
    if (d.readiness === "RESOURCE_CONSTRAINT") {
      await prisma.alert.create({ data: { type: "RESOURCE_UNAVAILABLE", severity: "CRITICAL", message: `${enc.code} · ${dest.name} · RESOURCE_CONSTRAINT — CT scanner down`, dedupeKey: `READINESS:${enc.id}`, encounterId: enc.id, hospitalId: dest.id, ambulanceId: amb.id } });
      await prisma.alert.create({ data: { type: "RESOURCE_UNAVAILABLE", severity: "WARNING", message: `${dest.name} · CT_STATUS UNAVAILABLE`, dedupeKey: `RES:${dest.id}:CT_STATUS`, hospitalId: dest.id } });
    }
    if (d.amb === "JED-A06") await prisma.alert.create({ data: { type: "NO_HOSPITAL_ACK", severity: "CRITICAL", message: `${enc.code} · ${d.patient.temporaryId} · 5 min`, dedupeKey: `NOACK:${enc.id}:${dest.id}`, encounterId: enc.id, hospitalId: dest.id, ambulanceId: amb.id } });
    if (triage.suggestedPriority !== d.priority && d.amb === "JED-A02") {
      const a = await prisma.triageAssessment.findFirst({ where: { encounterId: enc.id } });
      await prisma.alert.create({ data: { type: "TRIAGE_PRIORITY_CHANGED", severity: "WARNING", message: `${enc.code} · ${d.priority} → ${triage.suggestedPriority} (AI-assisted, pending confirmation)`, dedupeKey: `TRIAGE:${a!.id}`, encounterId: enc.id, hospitalId: dest.id, ambulanceId: amb.id } });
    }

    // Pending smart-destination recommendation when the engine disagrees with the current destination (resource constraint case)
    if (d.readiness === "RESOURCE_CONSTRAINT") {
      const live: HospitalCandidate[] = (await prisma.hospital.findMany({ include: { capabilities: true, resources: true } })).map((h) => ({
        id: h.id,
        name: h.name,
        lat: h.lat,
        lng: h.lng,
        edCapacity: h.edCapacity,
        capabilities: Object.fromEntries(h.capabilities.map((c) => [c.capability, c.available])),
        resources: Object.fromEntries(h.resources.map((r) => [r.type, r.status])) as HospitalCandidate["resources"],
        load: { incoming: 1, activeEd: 14, criticalIncoming: 0, avgHandoverMin: 14 },
      }));
      const req = requiredCapabilities({ chiefComplaint: d.complaint, mechanism: d.mechanism, age: d.patient.age, priority: d.priority as PriorityKey });
      const ranking = rankHospitals({ origin: pos, priority: d.priority as PriorityKey, requiredCapabilities: req, hospitals: live });
      if (ranking[0].hospitalId !== dest.id) {
        await prisma.destinationRecommendation.create({
          data: { encounterId: enc.id, recommendedHospitalId: ranking[0].hospitalId, score: ranking[0].score, requiredCapabilities: req, ranking: ranking as unknown as Prisma.InputJsonValue, engineVersion: DESTINATION_ENGINE_VERSION, status: "PENDING", requestedById: crew.id, requestedByName: crew.name },
        });
        await prisma.clinicalEvent.create({ data: { encounterId: enc.id, type: "DESTINATION_RECOMMENDED", actorId: crew.id, actorName: crew.name, actorRole: "PARAMEDIC", detail: { hospital: ranking[0].name, score: ranking[0].score, required: req } } });
      }
    }

    const vTypes = [...new Set(vitals.map((v) => v.type))];
    const c = completeness({ identityKnown: d.patient.known, chiefComplaint: d.complaint, vitalTypes: vTypes, interventions: d.interventions.length, medications: d.meds.length, etaKnown: transporting, destinationSet: transporting, handoverCompleted: false });
    await prisma.patientEncounter.update({ where: { id: enc.id }, data: { completeness: c.score } });

    // Notifications to hospital staff for incoming live cases
    if (d.prealertMinAgo != null) {
      const recips = await prisma.user.findMany({ where: { hospitalId: dest.id }, select: { id: true } });
      await prisma.notification.createMany({ data: recips.map((u) => ({ userId: u.id, type: d.divertFrom ? ("NEW_CASE" as const) : d.priority === "P1" ? ("CRITICAL_UPDATE" as const) : ("NEW_CASE" as const), title: d.divertFrom ? "DIVERTED_CASE_INCOMING" : "PRE_ARRIVAL_ALERT", body: `${enc.code} · ${d.priority} · ${d.patient.name ?? d.patient.temporaryId} · ${d.complaint}`, link: `/cases/${enc.id}`, encounterId: enc.id, createdAt: new Date(NOW - minutes(d.prealertMinAgo!)) })) });
    }
  }

  const counts = {
    users: await prisma.user.count(),
    hospitals: await prisma.hospital.count(),
    ambulances: await prisma.ambulance.count(),
    encounters: await prisma.patientEncounter.count(),
    vitals: await prisma.vitalSign.count(),
  };
  console.log("Seed complete:", counts);
  console.log(`Demo password for all accounts: ${PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
