# VitaLink

**الربط المباشر بين مركبات الإسعاف وأقسام الطوارئ: a direct, real-time link between ambulances and emergency departments.**

VitaLink connects the **patient, ambulance, paramedic, hospital and emergency department** in one digital journey. It covers clinical data, digital identity, health information, live location, AI-assisted triage, hospital readiness, smart destination, handover and operational analytics. The journey starts at the scene and ends when the patient has been handed over and the ambulance is back in service.

> ⚠️ **Safety disclaimer**
> The current VitaLink build is a development and demonstration platform.
> AI-assisted triage and destination recommendation are decision-support prototypes and do not replace clinical judgment or authorized EMS dispatch decisions.
> National health and identity integrations require official authorization and live integration credentials.

---

## 1. Platform overview

| Module | What it does |
|---|---|
| **Ambulance app** (tablet) | Current mission, patient, incident, location, destination, ETA, connection status; 10 quick actions; offline outbox (`ONLINE / DEGRADED / OFFLINE`, `PENDING / RETRYING / FAILED / DELIVERED`) |
| **Encounters** | Incident ID, ambulance ID, encounter ID; works with an **unknown patient** (`UNKNOWN-MALE-00482`), matched later |
| **Digital identity** | `IdentityAdapter` → `MockNafathAdapter` (synthetic identities), `NafathAdapter` refuses to run without credentials |
| **Health profile** | `HealthRecordAdapter` → `MockHealthRecordAdapter` (NPHIES simulated): allergies, chronic conditions, blood type, alerts, medication history, critical diagnoses |
| **Vitals** | HR, BP, SpO2, RR, temperature, GCS, glucose with value/unit/timestamp/source/status, charts, timeline; `MedicalMonitorAdapter` + mock monitor stream |
| **Clinical timeline** | Every event from "case created" to "ambulance released" |
| **Interventions / medications / media** | Including allergy cross-check, image & short video upload (magic-byte validated, protected, audited) |
| **ED dashboard** | Incoming ambulances and patients, critical cases, ETA, unacknowledged, resources, alerts, live map; cards update without a refresh |
| **Case view** | Header plus 12 tabs: Overview, Vitals, Timeline, Interventions, Medications, Media, Medical History, AI Triage, Destination, Preparation, Handover, Audit |
| **Pre-arrival readiness** | 10 preparation items and readiness status (`NOT_STARTED … RESOURCE_CONSTRAINT`), visible to the crew live |
| **Acknowledgment** | By, role, timestamp; no-acknowledgment alert after `ACK_TIMEOUT_MIN` |
| **ETA engine / live map / geofencing** | Route provider architecture (geographic estimate + optional OSRM), Leaflet/OSM maps, `EN_ROUTE → APPROACHING → ARRIVING → ARRIVED` |
| **Auto-registration** | Identity + destination + data + geofence → `PRE_REGISTRATION_READY → REGISTRATION_SENT → CONFIRMED/FAILED` (Mock HIS) |
| **AI-assisted triage** | Explainable rule engine: suggested priority, risk score, factors, confidence, missing data, then confirm or override (reason required) |
| **Smart destination** | Distance/ETA, capabilities, resource availability, current load, specialty and priority give a score, reasons and alternatives. Dispatch must approve any change |
| **Destination change** | Previous/new hospital, reason, timestamp, by; old ED sees **CASE DIVERTED** |
| **Command center** | Live map, active ambulances, incidents, hospital loads, critical/unacknowledged cases, exceptions, KPIs |
| **Handover & return to service** | Summary snapshot, accept, complete; arrival-to-handover, handover duration, return-to-service |
| **Alerts & notifications** | 11 alert types (deterioration, SpO2, falling BP, no ack, ETA < 5, diversion, resource, triage change, geofence, long handover…); 8 notification types |
| **Analytics & reports** | 10 analytics views, hospital comparison, ambulance performance, completeness, quality dashboard, weekly report with CSV export, all computed from the database |
| **Incidents & MCI** | Multi-ambulance / multi-patient incidents; mass casualty overview |
| **Audit** | Logins, patient viewed, identity updated, vitals, triage, destination, acknowledgment, handover, media viewed… with before/after |
| **Integrations dashboard** | Nafath, NPHIES, HIS, ePCR, medical monitor, routing, each with an honest status |
| **Demo simulation panel** | Move ambulance, change ETA, send vitals, condition, image, identify, ack, resource change, AI triage, smart destination, geofence, arrival, handover, release |
| **Arabic RTL / English LTR** | Full dictionaries (`src/lib/i18n`), language switcher, mirrored layout |

## 2. Original concept

Ambulance ↔ **VitaLink** ↔ Emergency Department. The platform targets seven problems: time lost re-entering data at arrival, hospitals blind to the case before arrival, repeated measurements, no reliable ETA, no advance preparation, no single journey view, and no visibility of handover quality. See the landing page (`/`) for the narrative.

## 3. Architecture

See **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** for the system diagram, ERD, page structure, roles and permissions, the main workflow sequence and the full API table.

```
src/
  app/                 Next.js App Router (pages + /api route handlers)
    (app)/             authenticated area (paramedic, ed, cases, dispatch, command, analytics, reports, admin, demo…)
    api/               REST endpoints (auth, RBAC, zod, rate limit, audit)
  lib/
    engines/           pure, unit-tested: triage, destination, geo (ETA/route/geofence), completeness, vitals, stats
    integrations/      adapters: identity (Nafath), health-record (NPHIES), HIS, routing (OSRM), monitor + registry
    services/          domain commands: encounters, movement (ETA/geofence/registration), simulation, metrics, core (alerts, notifications, timeline, realtime)
    realtime/bus.ts    PostgreSQL LISTEN/NOTIFY event bus
    i18n/              en.ts / ar.ts dictionaries
  components/          UI (shadcn-style primitives, maps, charts, case panels, paramedic actions)
prisma/                schema, migrations, seed
e2e/                   Playwright end-to-end tests
tests/                 Vitest unit tests
```

**Stack:** Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind CSS v4 · shadcn-style components on Radix · Lucide · Prisma 6 + PostgreSQL · Auth.js v5 + bcrypt · Server-Sent Events over Postgres LISTEN/NOTIFY · Recharts · Leaflet + OpenStreetMap · Zod · Vitest · Playwright.

## 4. Setup

Requirements: Node.js ≥ 20.9, PostgreSQL ≥ 14.

```bash
cd vitalink
npm install
cp .env.example .env        # then set DATABASE_URL, AUTH_SECRET, DATA_ENCRYPTION_KEY
```

Create a database (example):

```bash
createuser -P vitalink      # password: vitalink
createdb -O vitalink vitalink
```

## 5. Database

```bash
npm run db:migrate          # prisma migrate deploy
npm run db:seed             # synthetic demo data (resets all data!)
# or both:
npm run setup
```

The seed creates:

- 4 hospitals with capabilities and resources: **King Medical Center**, **North General Hospital**, **Coastal Emergency Hospital**, **University Medical Center**
- **Jeddah EMS** with 10 ambulances (`JED-A01 … JED-A10`)
- **100 historical cases** over 8 weeks (vitals, interventions, medications, triage, recommendations, diversions, acknowledgments, handovers, alerts)
- **8 live demo cases**: chest pain · traffic trauma (mass-casualty incident with 2 patients) · stroke signs · unknown unconscious patient (`UNKNOWN-MALE-00482`) · critical deterioration (COPD) · hospital resource constraint (CT down at Coastal) · destination change (Coastal → University)

All people and identifiers are synthetic. No real patient data is used.

## 6. Demo accounts

Password for all accounts: **`VitaLink@2026`** (change with `DEMO_PASSWORD` before seeding).

| Email | Role | Scope |
|---|---|---|
| `admin@vitalink.demo` | Super Admin | Platform |
| `dispatch@vitalink.demo` | EMS Dispatch | Jeddah EMS |
| `paramedic@vitalink.demo` | Paramedic | Ambulance JED-A01 (available, so start the main scenario here) |
| `nurse@vitalink.demo` | ED Nurse | King Medical Center |
| `doctor@vitalink.demo` | ED Doctor | King Medical Center |
| `analyst@vitalink.demo` | Operations Analyst | Platform |
| `edadmin@vitalink.demo` · `coordinator@vitalink.demo` | ED Admin · Hospital Coordinator | King Medical Center |
| `emsadmin@vitalink.demo` · `auditor@vitalink.demo` | EMS Admin · Auditor | Jeddah EMS · Platform |
| `nurse.ngh@` · `nurse.ceh@` · `nurse.umc@` (+ `edadmin.*@`) | ED Nurse / Admin | other hospitals |
| `medic.a02@` … `medic.a10@` | Paramedic | crews of the live demo ambulances |

## 7. Integrations

| Integration | Default status | Notes |
|---|---|---|
| Nafath (identity) | **SIMULATED** | `MockNafathAdapter` returns synthetic identities derived from the entered number; IDs ending in `0000` simulate a failure. Live mode requires `NAFATH_*` credentials **and** official onboarding; until then the live adapter throws `NOT_CONNECTED`. |
| NPHIES / Health records | **SIMULATED** | `MockHealthRecordAdapter` |
| Hospital HIS | **SIMULATED** | Mock ADT pre-registration acknowledgment, no real registration |
| EMS / ePCR | **NOT_CONFIGURED** | VitaLink is the system of record in the demo |
| Medical monitor | **SIMULATED** | Mock monitor (`STABLE / DETERIORATING / IMPROVING`) through `MedicalMonitorAdapter` |
| Maps / routing | **SIMULATED** | OSM tiles + geographic ETA on a simulated route; set `ROUTING_OSRM_URL` and switch to SANDBOX/CONNECTED for real routing |

A SUPER_ADMIN can switch an adapter to `NOT_CONFIGURED`. The UI then shows **Not connected** and the related actions are disabled. Switching to `CONNECTED`/`SANDBOX` is refused while credentials are missing.

## 8. AI demo logic: AI-Assisted Triage (`src/lib/engines/triage.ts`)

A transparent, rule-based **decision-support** engine, labelled *AI-Assisted Demo Decision Support*:

1. **Early-warning points** (NEWS2-inspired thresholds) for SpO2, systolic BP, HR, RR, GCS, temperature, glucose.
2. **Trend detection** between the first and latest readings: falling BP (≥ 20 mmHg), falling SpO2 (≥ 4), falling GCS (≥ 2), rising HR (≥ 25).
3. **Complaint and mechanism modifiers**: stroke signs, cardiac complaint, unresponsive or arrest, seizure, burns, respiratory, high-energy mechanism; age ≥ 65 or < 2; reported condition trend.
4. **Priority**: total points ≥ 10 → P1, ≥ 5 → P2, ≥ 2 → P3, else P4. Safety floors apply: any single critical parameter means at least P2, stroke/cardiac/high-energy means at least P2, and an unresponsive patient with GCS ≤ 8 means P1.
5. **Risk score** `= 100·(1 − e^(−points/7))`. **Confidence** depends on how complete the 7 key inputs are and how fresh the vitals are. **Missing data** is listed explicitly.
6. The paramedic must **Confirm** or **Override** (an override requires a reason). Both are stored with who decided and when, and feed the *Smart triage analytics*.

## 9. Destination recommendation logic: Smart Destination (`src/lib/engines/destination.ts`)

Each hospital gets a score out of 100:

- **Capability match (35)**: required capabilities derived from complaint, mechanism, age and priority (e.g. chest pain needs a cath lab and cardiology; stroke needs stroke, CT and neurology; trauma needs a trauma center, CT, OR and blood bank).
- **ETA (24–34, more weight for higher priority)**: road-corrected distance at emergency speed.
- **Resources (20)**: ED capacity, beds and specialists, plus resources tied to the required capabilities (CT, cath lab, OR, ICU, trauma bay).
- **Load (remainder)**: (active ED + 1.5 × incoming + 2 × critical incoming) / ED capacity.
- **Penalties**: missing required capability (−8 each); required resource unavailable (−6).

The output includes the **recommended hospital, score, reasons, alternatives and breakdown**. Before the pre-alert, the crew may pick the initial destination. After it, any change requires **EMS Dispatch approval** (`/dispatch` → *Approve & change destination*), and the change is recorded in `DestinationHistory` with a reason.

## 10. Running the app

```bash
npm run dev                 # http://localhost:3000
# production
npm run build && npm start
```

The in-process engine (`src/instrumentation.ts`) runs the **ops loop** (no-acknowledgment and long-handover alerts) and the **simulation loop** (route driving, mock monitor).

### Main scenario (2 browser windows)

1. **Paramedic** (`paramedic@`) → *Start mission* → *Create patient* (or tick *Identity unknown*) → *Identify patient* (any 10-digit number starting with 1 or 2) → *Add vital* / *Intervention* / *Medication* / *Upload image* → *Run AI-assisted triage* → *Confirm* → *Recommend hospital* → *Select as destination* → **Send pre-arrival alert**.
2. **Nurse** at that hospital (`nurse@` for King Medical Center) sees the card appear live → *Open case* → reviews tabs → **Acknowledge** → Preparation checklist → *Ready*.
3. The paramedic sees **Hospital acknowledged / Ready** live → *Start transport simulation* (or *Send device GPS*); ETA and map update; at the geofence the ED gets an **arrival warning** and the Mock HIS pre-registration runs; then **Arrived**.
4. Paramedic → *Start handover* → nurse → *Accept handover* → *Complete handover* → paramedic → **Release ambulance** (back to *Available*). The dashboards, analytics and reports update from the same records.

`/demo` (admin/dispatch) can drive every step for any active case.

## 11. Testing

```bash
npm test                    # Vitest: triage, destination, ETA/geofence, completeness, vitals, RBAC, tenant scope, encryption, rate limiting
npm run db:seed             # E2E expects a freshly seeded DB
npm run test:e2e            # Playwright (starts `npm start` if no server is running; build first)
# or against a running server:
E2E_BASE_URL=http://localhost:3000 npm run test:e2e
```

E2E suites:

- `voice-documentation.spec.ts`: dictation fills vitals for review, the paramedic corrects a value, and only the confirmed values are recorded.
- `outbox-encryption.spec.ts`: an unknown pilgrim's note queued offline is stored only as `enc1:` ciphertext and is delivered when back online.
- `main-workflow.spec.ts`: the full scenario with ambulance and ED in two parallel sessions. It checks the live update without a refresh, the offline outbox, triage, destination, acknowledgment, readiness, ETA, geofence, registration, handover and release.
- `security-and-diversion.spec.ts`: unauthenticated access, tenant isolation (404 across hospitals and ambulances), RBAC (403), zod validation, auditor scope, a diversion with **CASE DIVERTED** shown live at the old ED, Arabic RTL, analytics from the DB, and honest integration status.
- `demo-simulation.spec.ts`: every demo-panel action plus the mock monitor stream on the unknown patient, up to identity match, handover and release.

If Playwright cannot find its browser, set `PW_CHROMIUM_PATH` to a Chromium binary.

## 12. Security

- Auth.js credentials + bcrypt (cost 11). Login is rate-limited (8 attempts per 5 min per IP and email), and successful and failed logins are audited.
- JWT session in an httpOnly cookie, and the user is re-validated against the DB on every request.
- RBAC on every page and API (`src/lib/rbac.ts`). Tenant isolation lives in `src/lib/scope.ts`, and out-of-scope records return **404**.
- Zod validation on every mutation, same-origin check (CSRF), per-user API rate limiting.
- Security headers: CSP, HSTS, X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy.
- National ID and phone are **AES-256-GCM encrypted**, with an HMAC hash for lookup and only the last 4 digits in plain text. General tables show `••••••1234`.
- Media is stored outside `/public`, **encrypted at rest (AES-256-GCM)**, served only through a scoped, audited endpoint with a sandbox CSP, and validated by type, size and magic bytes.
- **Voice documentation** (ambulance app → "Voice notes"): Arabic/English dictation through the browser's Web Speech API, with a typed fallback. A pure parser (`src/lib/engines/voice.ts`) extracts temperature, pulse, SpO₂, BP, RR, GCS and glucose only when a value follows its keyword and is in a plausible range. Values pre-fill a review form, and nothing is sent until the paramedic confirms. Browser speech recognition uses the browser vendor's service, so a pilot must swap it for an in-Kingdom speech service.
- **Lost tablet:** the offline outbox in `localStorage` is AES-GCM encrypted with a per-user key from `/api/device-key`. The key lives only in tab memory and `sessionStorage`, so a closed or signed-out tab leaves only ciphertext. Delivered items keep no clinical payload. The ambulance app signs itself out after 20 minutes without interaction, and queued data survives and resumes after sign-in.
- **Data retention:** `npm run retention` (dry run) or `npm run retention -- --apply`, run daily. After a case closes, photos/videos are deleted after `RETENTION_MEDIA_DAYS`. Name, National ID, phone, free text and the fetched health profile are removed after `RETENTION_IDENTIFIER_DAYS`. Timings, priority and vitals stay for de-identified quality metrics. Audit events are kept for `RETENTION_AUDIT_DAYS`. Open cases are never touched.
- **Stale capacity:** hospital resource statuses older than `RESOURCE_STALE_MINUTES` (default 240) are treated as UNKNOWN by the destination engine, and the recommendation says so.
- The audit log records user, action, entity, time, before/after and IP.

## 13. Production notes

- Replace the in-memory rate limiter with Redis for multi-instance deployments. Realtime already works across instances through Postgres NOTIFY.
- Move media to object storage (S3-compatible) behind the same `/api/media/:id` contract.
- Not yet implemented, and required before a live pilot: MFA for hospital/command roles, MDM-based remote wipe for tablets, a formal PDPL / NCA ECC compliance assessment, and clinical validation of the triage rules by a licensed emergency physician.
- Run the simulation/ops loop as a dedicated worker (`VITALINK_DISABLE_SIM=1` on web nodes).
