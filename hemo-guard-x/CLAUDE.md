# NAJA (نَجا) — website

Landing page and interactive demo for **NAJA (نَجا)**, formerly HEMO-GUARD X, a youth-led health initiative (prototype stage) submitted to the Impact Award at the Saudi Youth Healthcare Forum 2026. The system has three modules:

- **HEMO-GUARD**: smart transport container (cold-chain 2–8 °C logging, RFID/QR chain of custody, offline buffering)
- **HEMO-SUPPLY**: inventory visibility, shortage-risk forecasting, redistribution recommendations
- **RARE-LINK**: registry of lab-confirmed rare-phenotype donors, readiness status, cascade alerts, rare blood readiness index (RBRI)

## Stack and commands

- Vite 5 + React 18 + TypeScript (strict). No UI library; all styling is in `src/styles/global.css`.
- `npm install` · `npm run dev` (local server) · `npm run build` (typecheck + build to `dist/`) · `npm run preview`
- `base: './'` in `vite.config.ts` so `dist/` works from any static host or folder.

## Layout

- `src/App.tsx`: page composition; owns `need` (antigens the patient must be negative for) and `runToken` (bump to replay the antigram and cascade animations).
- `src/components/`: one component per section or widget. `Spot` is the spotlight card wrapper used across the bento grid.
- `src/data/antigram.ts`: antigens, illustrative donors, `parseRequest()` for the hero search ("K− Fy(b−) Jk(b−)").
- `src/data/scenarios.ts`: synthetic ops data for three hypothetical sites and four scenarios.
- `src/data/content.ts`: copy, evidence, roadmap, references, deck URL.

## Design rules

- Arabic, right-to-left (`<html dir="rtl">`). Latin codes, numbers and units go in `.lat` or `.mono` spans so bidi stays correct.
- Brand: NAJA identity. Tagline "جاهزية تسبق الحاجة". Colours: green `#0B3D36` (`--green`), red `#C6283A` (`--red`, the only accent), cream `#F5F3EE` (`--text`). Logo is the folded-ribbon drop in `Logo.tsx` (`Logo` mark, `Wordmark` mark + نَجا/NAJA).
- Dark 21st.dev-style page on a deep green-black base (`#07110f`); the hero shader is a green/red ribbon. Fonts: Tajawal (Arabic/Latin), Geist Mono (codes).
- The module names HEMO-GUARD, HEMO-SUPPLY and RARE-LINK stay as they are; only the product brand is NAJA.
- One bold moment per section; respect `prefers-reduced-motion` (every animation has a static end state).

## Content rules (important)

- All inventory, donor and temperature data are **synthetic** and must stay labelled as such in the UI.
- Never present targets as achieved results. "< 30 min", "24 h" etc. are pilot-simulation targets.
- The system supports decisions; it never decides blood safety, compatibility, release or discard. Keep that wording.
- RARE-LINK complements the Ministry of Health's Wateen app; do not describe it as a competitor.
- Do not add fake partners, logos, testimonials, user counts or "nominated/winner" claims.
- Evidence claims must keep their source (see `REFERENCES` in `content.ts`).
