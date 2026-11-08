# Design: audit, creative direction and design system

## 1. Audit of the previous portfolio

Source: `RINAS-Portfolio-Web/index.html`, a single 31 KB static page.

### What wasn't working

| Area | Problem |
| --- | --- |
| **Identity** | The hero headline "Technology. With intent. Built by Rinas." could describe anyone. The name sat in small mono text, and a rotating "R." tile carried no information. A visitor couldn't tell *who* or *what* in five seconds. |
| **Hierarchy** | Every section had the same rhythm: a label, a large two-tone headline, then a grid of equal rectangles. Nothing was emphasised, so nothing stood out. |
| **Projects** | All six projects were presented identically. Two of the six images (Mu'een, Qiddiya) were near-identical templated graphics reading "DESIGN / SYSTEM" that said nothing about either project. There were no case studies, so there was no place for depth. |
| **Missing work** | The three live client websites (La Vie Ahd, Al Fahd Company, Beirut Al-Raed) were absent. |
| **Accuracy** | Rasd Cyber still carried the CyberMind lineage from the CV. Some concept images were not clearly labelled. |
| **Palette** | A mint accent outside the brief's palette. |
| **Engineering** | One HTML file with an inline data array, no routing, no per-page metadata, no image `srcset`, and no reduced-motion handling for its 3D tile. |

### What was preserved

The factual content: names, roles, dates, project descriptions, contact details and the mailto-only contact policy.

---

## 2. Creative direction: "Construction Documents"

Rinas designs systems: threat models, sensor networks, platforms and interfaces. The site is presented as an architect's **drawing set**. Each section is a numbered *sheet* (§ 01, § 02 …) with a title-block strip, figures are captioned *Fig. 01*, and hairlines behave like dimension lines. This gives every section the same grammar while allowing each one its own composition.

**Principles**

1. **Structure is the decoration.** Rules, grids, registration marks and numbered sheets do the visual work. There is no glow, no glassmorphism and no gradient wash.
2. **Cyan means "active".** `#65DFFF` appears only for state: the current nav item, the highlighted role, a selected diagram node, a scan line. Amber is reserved for *disclosure*, marking renders, concepts and integrity notes.
3. **Every project is shown in its own form.** Dithar gets an exploded-layer anatomy, Rasd Cyber a live terminal replay, Rikaz a signal-correlation plot, Mu'een an interactive architecture, Muyassir an owner journey, and Qiddiya a contribution map plus an optional sketch.
4. **Honesty is designed in.** Every image carries a badge stating how it was made: interface screenshot, live site capture, product render, or concept render. Limitations appear as visible notes, not footnotes.

**Hero.** An editorial split. The name is set as architecture: three stacked lines, with "Abdullah" set in steel. A numbered index of the five roles sits beneath it. On the right, a five-plate structural lattice (three.js) lights the plate matching the highlighted role, so *five disciplines, one structure*. The tagline and the two primary actions sit on a ruled base line.

---

## 3. Design system

### Colour tokens (`src/styles/index.css` → `@theme`)

| Token | Hex | Use |
| --- | --- | --- |
| `obsidian` | `#06080C` | Page background |
| `graphite` | `#0C1118` | Alternate bands, figure grounds |
| `slate` / `slate-hi` | `#18232F` / `#233140` | Inactive marks |
| `steel` / `steel-dim` | `#8192A3` / `#5B6977` | Secondary text, labels, inactive rules |
| `paper` | `#F3F6F8` | Primary text, primary button |
| `cyan` | `#65DFFF` | Active state and signal only |
| `amber` | `#E8B45A` | Disclosure: renders, concepts, notes |

Rules use `--rule` (steel at 22%) and `--rule-strong` (steel at 40%).

### Typography

| Role | Face | Class |
| --- | --- | --- |
| Display | Geist Variable, weight 600, −0.045em tracking, 0.9 leading | `.t-display` |
| Headings | Geist Variable, weight 560, −0.03em tracking | `.t-heading` |
| Body | Manrope Variable, 17px / 1.7 | `.t-body` |
| Labels | IBM Plex Mono, 11px, uppercase, 0.14em tracking | `.t-label` |

Sizes scale fluidly with `clamp()`. Phones get their own scale; the desktop sizes are not simply shrunk.

### Layout

- `.shell`: max width 92rem, fluid gutter `clamp(1.25rem, 4vw, 3.5rem)`.
- A 12-column grid at `lg` and above. Compositions are asymmetric (for example 7/5, 5/7, 4/8 and 3/9), and no two adjacent sections share a layout.
- Section rhythm: 6rem vertical padding on phones, 9rem on desktop.

### Components

- `SheetHeader`: the title-block strip that opens each section.
- `ResponsiveImage`: srcset, lazy loading, blur-in, and a failure state.
- `MediaBadge`: discloses how an image was made.
- `.reg-marks`: corner registration marks on figures.
- `.btn-primary` / `.btn-ghost`: mono, uppercase, at least 48 px tall.
- `.drafting-grid`: a 40 px grid behind diagrams.

### Motion (`src/animations`)

- A single easing curve, `cubic-bezier(0.2, 0.7, 0.1, 1)`, used everywhere.
- Reveals rise 28 px and fade over 0.9 s, once. Lists stagger by 80 ms.
- Hairlines draw from left to right. Name lines rise out of masks.
- Project switches use a clip-path wipe.
- Ambient motion is limited to the hero lattice and the Mu'een signal flow. Both pause off-screen and stop under reduced motion.
