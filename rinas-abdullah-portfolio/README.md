# Rinas Abdullah Murayr — Portfolio

The personal portfolio of Rinas Abdullah Murayr: founder, cybersecurity & AI architect, full-stack developer, UI/UX designer and Unity game developer.

**Stack:** React 19 · TypeScript · Vite 7 · Tailwind CSS 4 · Motion · React Router 7 · Lucide · three.js (lazy-loaded) · Vercel

> This app lives in `rinas-abdullah-portfolio/` inside the `project-files` repository. The repository root is a separate Next.js app (Dithar), and the two do not share code or dependencies. The root `tsconfig.json` and `eslint.config.mjs` exclude this folder.

Design rationale, the audit of the previous site and the design system are in [`docs/DESIGN.md`](docs/DESIGN.md).

---

## Run locally

Requires Node 20 or later.

```bash
cd rinas-abdullah-portfolio
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build into dist/
npm run preview    # serve dist/ at http://localhost:4173
```

---

## Where everything lives

```
src/
  data/           ← ALL CONTENT. Edit these files to update the site.
    profile.ts      name, titles, tagline, contact links, education
    projects.ts     the six case studies
    websites.ts     the three client websites
    experience.ts   roles, capabilities, community, certifications
  sections/       home-page sections (Hero, Practice, WorkExplorer, WebWork, Experience, …)
  pages/          HomePage, ProjectPage (case-study template), NotFound, RouteError
  features/
    hero/           lattice figure (three.js) + SVG fallback
    case-study/     one bespoke module per project + shared diagrams
  components/     Header, Footer, ResponsiveImage, MediaBadge, SheetHeader, …
  layouts/        RootLayout, ScrollManager
  animations/     motion variants + <Reveal>
  hooks/          useDocumentMeta, useActiveSection, useWebGL, useMediaQuery
  lib/            media helpers, discipline metadata, cn()
  styles/         index.css — design tokens and base styles
  types/          shared TypeScript types
public/
  media/          optimized .webp images (two widths each)
  og-image.png    social sharing image (1200 × 630)
  sitemap.xml, robots.txt, favicon.svg
```

---

## Updating content

### Edit text

All copy lives in `src/data/*.ts`. Components never hard-code facts, so changing a data file updates every place that fact appears (home explorer, case study, footer, discipline links).

**Accuracy rule:** every statement in these files is sourced from the CV, the supplied project materials, or the products' own interfaces. Keep it that way, and put limitations in a project's `disclosure` field. Disclosures render as a visible "Note" on the case study.

### Add or change a project

1. Add an entry to `projects` in `src/data/projects.ts`. The `Project` type in `src/types/index.ts` documents every field.
2. Choose its `module`:
   - **Reuse an existing module.** Set `module` to one of the existing keys.
   - **Create a new one.** Add `src/features/case-study/<Name>Module.tsx` exporting a default component `({ project }) => …`, add the key to `CaseModule` in `src/types/index.ts`, and register it in the `modules` map in `src/pages/ProjectPage.tsx`.
3. Add the URL to `public/sitemap.xml`.

The project automatically appears in the home explorer, the footer, the discipline axis and the case-study pager.

### Add or replace an image

Images are served as `/media/<base>-<width>.webp`, with two widths per image, and are referenced by a `MediaAsset`:

```ts
cover: {
  base: "rasd-cyber",        // → /media/rasd-cyber-1500.webp and -900.webp
  widths: [1500, 900],       // every width must exist as a file
  width: 1500, height: 844,  // intrinsic size of the largest file
  alt: "Describe what is in the image",
  kind: "screenshot",        // "screenshot" | "capture" | "render" | "concept"
  caption: "Shown under the figure",
}
```

`kind` is shown to visitors as a badge. Renders and concept renders are flagged in amber, so a render is never mistaken for a photograph of manufactured hardware.

To generate the two widths from a source image (requires Python with Pillow):

```bash
python3 -c "
from PIL import Image; import sys
src, base = sys.argv[1], sys.argv[2]
im = Image.open(src); im = im.convert('RGBA' if 'A' in im.mode else 'RGB')
for w in (1500, 900):
    c = im.copy()
    if c.width > w: c = c.resize((w, round(c.height*w/c.width)), Image.LANCZOS)
    c.save(f'public/media/{base}-{c.width}.webp', 'WEBP', quality=80, method=6); print(c.size)
" path/to/source.png my-image
```

Then put the widths it printed into `widths`.

### Update a website capture

The captures in `public/media/{laviehd,fhd,beirut}-{desktop,detail,mobile}-*.webp` were taken from the live sites in November 2026. To refresh them, capture each site at 1440 × 900 (desktop) and as an iPhone 13 (mobile), convert to the widths listed in `src/data/websites.ts`, and update the "captured" date in the `shot()` helper and in `src/sections/WebWork.tsx`.

### Experience, skills, certifications

Edit `src/data/experience.ts`. Role bars on the timeline are computed from each role's `start` and `end` month. If a role falls outside October 2025 – February 2026, extend `START` and `months` in `src/sections/Experience.tsx`.

---

## Contact form

There is no backend. The form drafts an email in the visitor's own mail app through a `mailto:` link, and it says so clearly. It never claims a message was sent.

To add a real email API later (for example Resend or Formspree), replace `onSubmit` in `src/sections/Contact.tsx` with a request to a serverless function, and show success only after a 2xx response.

---

## Performance & accessibility

- Initial JavaScript is about 175 KB gzipped (React, Motion and the app). three.js (about 133 KB gzipped) loads only when the browser is idle after first paint, and only if WebGL is available. An isometric SVG drawing paints instantly and remains as the fallback.
- The Qiddiya web sketch loads only when the visitor presses "Load concept sketch".
- Images use `srcset`, `sizes`, lazy loading and explicit dimensions.
- `prefers-reduced-motion` is respected throughout: Motion is set to `reducedMotion="user"`, the WebGL scene renders still frames, CSS transitions are disabled, and the role carousel stops.
- The site includes a skip link, semantic landmarks, visible focus rings, keyboard-operable diagrams, a focus-trapped mobile menu (Esc closes it), live-region announcements and alt text on every image.
- Per-route `<title>`, description, canonical and Open Graph tags are set in `useDocumentMeta`. JSON-LD Person data is in `index.html`.

---

## Deploy to Vercel

The production project is **`rinas-abdullah-portfolio`**, and the preferred domain is `https://rinas-abdullah-portfolio.vercel.app`.

### First-time setup (dashboard)

1. On Vercel, choose **Add New → Project** and import `rinas-abdullah/project-files`.
2. Set **Project Name** to `rinas-abdullah-portfolio`.
3. Set **Root Directory** to `rinas-abdullah-portfolio`. This step is essential, because the repository root is the Dithar app.
4. Vercel detects the framework as **Vite**. `vercel.json` already sets the build command to `npm run build`, the output directory to `dist`, SPA rewrites, cache headers and security headers.
5. Choose **Deploy**.

### Verify before it goes live

Do not overwrite an existing production deployment until the new build has been checked:

- When the project already exists and has a production deployment, push this work on a non-production branch (for example `claude/vigilant-gauss-0hkyeu`). Vercel creates a **Preview** deployment with its own URL.
- Check the preview: the home page, all six `/work/*` pages, a deep link reload (for example `/work/rikaz`), a 404 URL, the mobile menu and the contact form.
- Then promote it, either by merging to the production branch or with **Deployments → … → Promote to Production**.

### From the CLI (alternative)

```bash
npm i -g vercel
cd rinas-abdullah-portfolio
vercel link --project rinas-abdullah-portfolio
```

Then create a preview deployment:

```bash
vercel
```

After verifying the preview, promote to production:

```bash
vercel --prod
```

If the final domain differs from `rinas-abdullah-portfolio.vercel.app`, update `siteUrl` in `src/data/profile.ts`, the canonical and Open Graph URLs in `index.html`, `public/robots.txt` and `public/sitemap.xml`.
