# AMAD design system

Tokens: `src/app/globals.css` (CSS variables mapped into Tailwind v4 theme). Primitives: `src/components/ui.tsx`.

| Token | Value | Use |
|---|---|---|
| `bg` | #06152B | page background (brand navy) |
| `surface` / `surface-2` / `surface-3` | #0A1D38 / #0E2645 / #133055 | cards, inputs, hover |
| `line` / `line-strong` | #1B3559 / #29496F | borders |
| `lime` / `lime-strong` | #C7F230 / #B3DB1F | primary action, key metrics, focus ring |
| `fg` | #FFFFFF | primary text |
| `silver` | #AEB7C2 | secondary text |
| `subtle` | #7F8EA1 | tertiary text, labels |
| `danger` / `warn` / `info` / `ok` | #FF6B6B / #F5B544 / #6CC6FF / #4FD6A1 | status only |

Typography: IBM Plex Sans Arabic (UI), IBM Plex Mono (console, IDs, ATT&CK refs), self-hosted via `next/font`.
Layout: Arabic-first RTL (`dir="rtl"`); technical tokens wrapped in `.ltr`. 16px side gutter on phones.
Components: `Wordmark`, `Button`/`ButtonLink` (primary/secondary/ghost/danger), `Card`/`CardHeader`, `Badge` (tones),
`Meter` (ARIA meter), `Stat`, `Field` (label, hint, error, aria-invalid), `EmptyState`; charts `TrendLine`, `Radar`.
Motion: only the live-incident pulse and skeleton shimmer; disabled under `prefers-reduced-motion`.
Logo: official asset missing — typographic placeholder only. Do not draw an approximation.
