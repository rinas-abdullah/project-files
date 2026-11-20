import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { X } from "lucide-react";
import "./story.css";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import { profile } from "@/data/profile";
import { Cloud, Moon, Walker } from "./art";
import { chapterComponents } from "./chapters";
import { chapters, ui, type Lang } from "./content";

/* ------------------------------------------------------------------ */
/* Time of day: the walk starts at dawn and ends under the moon.       */
/* ------------------------------------------------------------------ */
type Key = {
  p: number;
  top: string;
  bot: string;
  sea: string;
  seaDeep: string;
  ground: string;
  ink: string;
  accent: string;
  cloud: string;
  lum: number;
  glow: number;
  stars: number;
};
const KEYS: Key[] = [
  { p: 0, top: "#2a3358", bot: "#f3a27d", sea: "#4a7591", seaDeep: "#24465f", ground: "#d8b791", ink: "#fff4e3", accent: "#ffb38f", cloud: "#f6c3b0", lum: 0.8, glow: 0.55, stars: 0.35 },
  { p: 0.13, top: "#6aa7d0", bot: "#f7dcc0", sea: "#2f90a5", seaDeep: "#1c6a83", ground: "#e6c9a0", ink: "#14212c", accent: "#c4472c", cloud: "#fff8ef", lum: 0.97, glow: 0, stars: 0 },
  { p: 0.42, top: "#2d84c4", bot: "#bfe1f1", sea: "#1fa2b2", seaDeep: "#12708d", ground: "#ecd3aa", ink: "#10202b", accent: "#c4472c", cloud: "#ffffff", lum: 1, glow: 0, stars: 0 },
  { p: 0.64, top: "#e2774a", bot: "#f9d38b", sea: "#3a8f9b", seaDeep: "#245e78", ground: "#e8bb8b", ink: "#2a1309", accent: "#8f2a17", cloud: "#ffe0c2", lum: 0.95, glow: 0.15, stars: 0 },
  { p: 0.82, top: "#47336f", bot: "#ec8a6c", sea: "#40598a", seaDeep: "#27355e", ground: "#b48e7c", ink: "#fff3e2", accent: "#ffc29a", cloud: "#d99aa4", lum: 0.72, glow: 0.75, stars: 0.45 },
  { p: 1, top: "#0b1230", bot: "#2c3066", sea: "#1d2b57", seaDeep: "#0d1635", ground: "#5a5170", ink: "#fbf1df", accent: "#ffcf8a", cloud: "#3b416f", lum: 0.55, glow: 1, stars: 1 },
];
const COLOR_KEYS = ["top", "bot", "sea", "seaDeep", "ground", "ink", "accent", "cloud"] as const;
const NUM_KEYS = ["lum", "glow", "stars"] as const;

const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (a: string, b: string, t: number) => {
  const A = hex(a);
  const B = hex(b);
  return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(",")})`;
};
const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const smooth = (t: number) => t * t * (3 - 2 * t);

function paint(el: HTMLElement, p: number) {
  let i = 0;
  while (i < KEYS.length - 2 && p > KEYS[i + 1].p) i++;
  const a = KEYS[i];
  const b = KEYS[i + 1];
  const t = smooth(clamp((p - a.p) / (b.p - a.p)));
  for (const k of COLOR_KEYS) el.style.setProperty(`--${k}`, mix(a[k], b[k], t));
  for (const k of NUM_KEYS) el.style.setProperty(`--${k}`, String(a[k] + (b[k] - a[k]) * t));
}

/* ------------------------------------------------------------------ */

const LANG_KEY = "rinas-walk-lang";
function initialLang(): Lang {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved === "ar" || saved === "en") return saved;
  } catch {
    /* storage unavailable */
  }
  return typeof navigator !== "undefined" && navigator.language?.toLowerCase().startsWith("ar") ? "ar" : "en";
}

const STARS = Array.from({ length: 70 }, (_, i) => ({
  x: (i * 37.7) % 100,
  y: (i * 23.3) % 55,
  s: 1 + ((i * 7) % 3) * 0.6,
  d: (i % 5) * 0.7,
}));

export default function StoryPage() {
  const [lang, setLang] = useState<Lang>(initialLang);
  const rtl = lang === "ar";
  const [mapOpen, setMapOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [ready, setReady] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const farRef = useRef<HTMLDivElement>(null);
  const sunRef = useRef<HTMLDivElement>(null);
  const moonRef = useRef<HTMLDivElement>(null);
  const walkerRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const mapBtnRef = useRef<HTMLButtonElement>(null);

  const dist = useRef(0); // horizontal travel in px (== extra vertical scroll)
  const starts = useRef<number[]>([]);
  const cur = useRef(0);
  const activeRef = useRef(0);
  const keepProgress = useRef<number | null>(null);

  useDocumentMeta({
    title: `${profile.name} — a portfolio, told as a walk`,
    description:
      "Walk along the Jeddah corniche from dawn to moonrise through the story of Rinas Abdullah Murayr — cybersecurity & AI architect and founder of Dithar, Rasd Cyber, Rikaz, Mu'een and Muyassir.",
    path: "/",
  });

  // Language: persist, and set <html lang/dir> while on this page.
  useEffect(() => {
    try {
      localStorage.setItem(LANG_KEY, lang);
    } catch {
      /* ignore */
    }
    const html = document.documentElement;
    const prev = { lang: html.lang, dir: html.dir };
    html.lang = lang;
    html.dir = rtl ? "rtl" : "ltr";
    return () => {
      html.lang = prev.lang;
      html.dir = prev.dir;
    };
  }, [lang, rtl]);

  // Short intro curtain, released once fonts are in.
  useEffect(() => {
    let done = false;
    const go = () => {
      if (!done) {
        done = true;
        setReady(true);
      }
    };
    document.fonts?.ready.then(go);
    const t = setTimeout(go, 1400);
    return () => clearTimeout(t);
  }, []);

  /** The page scrolls vertically; the track moves horizontally by the same distance. */
  const measure = useCallback(() => {
    const root = rootRef.current;
    const track = trackRef.current;
    if (!root || !track) return;
    const vw = document.documentElement.clientWidth;
    const W = track.scrollWidth;
    dist.current = Math.max(0, W - vw);
    root.style.height = `${window.innerHeight + dist.current}px`;
    const els = Array.from(track.querySelectorAll<HTMLElement>("[data-chapter]"));
    starts.current = els.map((el) => (rtl ? W - (el.offsetLeft + el.offsetWidth) : el.offsetLeft));
    if (keepProgress.current !== null) {
      window.scrollTo({ top: root.offsetTop + keepProgress.current * dist.current, behavior: "instant" as ScrollBehavior });
      keepProgress.current = null;
    }
  }, [rtl]);

  useLayoutEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    if (trackRef.current) ro.observe(trackRef.current);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  // The frame loop: scroll → walk.
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let raf = 0;
    let lastMove = 0;
    const dir = rtl ? 1 : -1;
    const tick = (now: number) => {
      const root = rootRef.current;
      const view = viewRef.current;
      const track = trackRef.current;
      if (root && view && track) {
        const D = dist.current;
        const target = D > 0 ? clamp((window.scrollY - root.offsetTop) / D) : 0;
        const prev = cur.current;
        cur.current = reduce.matches ? target : prev + (target - prev) * 0.1;
        if (Math.abs(target - cur.current) * D < 0.3) cur.current = target;
        const p = cur.current;
        const x = p * D;

        track.style.transform = `translate3d(${dir * x}px,0,0)`;
        if (farRef.current) farRef.current.style.transform = `translate3d(${dir * x * 0.12}px,0,0)`;
        paint(view, p);

        // Sun arcs across the sky, then sets; the moon rises over the last stretch.
        const t = clamp(p / 0.86);
        const sx = 10 + t * 74;
        if (sunRef.current) {
          sunRef.current.style.insetInlineStart = `${sx}%`;
          sunRef.current.style.top = `${66 - Math.sin(Math.PI * t) * 54}%`;
        }
        if (moonRef.current) {
          const m = clamp((p - 0.78) / 0.2);
          moonRef.current.style.opacity = String(m);
          moonRef.current.style.transform = `translateY(${(1 - m) * 40}px)`;
        }
        if (barRef.current) barRef.current.style.transform = `scaleX(${p})`;
        if (hintRef.current) hintRef.current.style.opacity = String(1 - clamp(p * 40));

        // Walk while moving; face the way we're going.
        const v = (target - prev) * D;
        const walker = walkerRef.current;
        if (walker) {
          if (Math.abs(v) > 0.4) {
            lastMove = now;
            walker.dataset.walking = "true";
            walker.dataset.back = String(v < 0);
          } else if (now - lastMove > 140) {
            walker.dataset.walking = "false";
          }
        }

        // Which stop are we at?
        const probe = x + window.innerWidth * 0.45;
        let a = 0;
        starts.current.forEach((s, i) => {
          if (s <= probe) a = i;
        });
        if (a !== activeRef.current) {
          activeRef.current = a;
          setActive(a);
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [rtl]);

  const goTo = useCallback((i: number, smoothScroll = false) => {
    const root = rootRef.current;
    if (!root) return;
    const s = clamp(starts.current[i] ?? 0, 0, dist.current);
    window.scrollTo({ top: root.offsetTop + s, behavior: (smoothScroll ? "smooth" : "instant") as ScrollBehavior });
  }, []);

  // Left/right arrows walk too (reversed in Arabic, where the walk runs right-to-left).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (mapOpen || e.altKey || e.metaKey || e.ctrlKey) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      const fwd = rtl ? "ArrowLeft" : "ArrowRight";
      const back = rtl ? "ArrowRight" : "ArrowLeft";
      if (e.key !== fwd && e.key !== back) return;
      e.preventDefault();
      window.scrollBy({ top: (e.key === fwd ? 1 : -1) * window.innerWidth * 0.6 });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [rtl, mapOpen]);

  // Keyboard users tabbing into an off-screen stop get walked there.
  const onFocus = (e: React.FocusEvent) => {
    const ch = (e.target as HTMLElement).closest<HTMLElement>("[data-chapter]");
    if (!ch) return;
    const r = (e.target as HTMLElement).getBoundingClientRect();
    if (r.left < 0 || r.right > window.innerWidth) {
      const root = rootRef.current;
      if (!root) return;
      const delta = rtl ? -(r.right - window.innerWidth / 2) : r.left - window.innerWidth / 2;
      window.scrollTo({ top: clamp(window.scrollY + delta, root.offsetTop, root.offsetTop + dist.current), behavior: "instant" as ScrollBehavior });
    }
  };

  // Map dialog: Escape closes, focus returns to the button.
  useEffect(() => {
    if (!mapOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMapOpen(false);
        mapBtnRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mapOpen]);

  const switchLang = () => {
    const D = dist.current;
    keepProgress.current = D > 0 ? clamp((window.scrollY - (rootRef.current?.offsetTop ?? 0)) / D) : 0;
    setLang((l) => (l === "en" ? "ar" : "en"));
  };

  return (
    <div ref={rootRef} className="story-root" lang={lang} dir={rtl ? "rtl" : "ltr"} data-ready={ready}>
      <a href="/index" className="skip-link">
        {ui.skip[lang]}
      </a>
      <div ref={viewRef} className="story-view">
        {/* Sky */}
        <div className="sky" aria-hidden="true">
          <div className="stars">
            {STARS.map((s, i) => (
              <span key={i} style={{ insetInlineStart: `${s.x}%`, top: `${s.y}%`, width: s.s, height: s.s, animationDelay: `${s.d}s` }} />
            ))}
          </div>
          <div ref={sunRef} className="sun" />
          <div ref={moonRef} className="moon">
            <Moon className="h-full w-full" />
          </div>
          <div ref={farRef} className="far">
            {[3, 68, 92, 118, 146, 177, 210, 244, 280].map((x, i) => (
              <Cloud
                key={x}
                className="cloud"
                style={{ insetInlineStart: `${x}vw`, top: `${7 + ((i * 11) % 16)}%`, width: `${110 + ((i * 47) % 140)}px`, animationDelay: `${-i * 3}s` }}
              />
            ))}
          </div>
        </div>
        {/* Sea */}
        <div className="sea" aria-hidden="true">
          <span className="sea-glint" />
          <span className="sea-glint" style={{ animationDelay: "-2s", top: "45%" }} />
          <span className="sea-glint" style={{ animationDelay: "-4s", top: "72%" }} />
        </div>

        {/* The walk */}
        <div ref={trackRef} className="track" onFocus={onFocus}>
          {chapterComponents.map((Ch, i) => (
            <Ch key={i} lang={lang} />
          ))}
        </div>

        {/* The walker stays put; the world moves past. */}
        <div ref={walkerRef} className="walker" data-walking="false" data-back="false" aria-hidden="true">
          <Walker className="h-full w-auto" />
        </div>

        {/* Chrome */}
        <div ref={barRef} className="story-progress" aria-hidden="true" />
        <header className="story-bar">
          <button type="button" className="story-brand" onClick={() => goTo(0)} aria-label={`${profile.name} — ${chapters[0].label[lang]}`}>
            <span lang="en">RINAS</span>
            <span className="story-brand-dot" aria-hidden="true" />
          </button>
          <nav className="story-actions" aria-label={rtl ? "أدوات" : "Tools"}>
            <button type="button" className="story-chip" onClick={switchLang} aria-label={ui.langLabel[lang]} lang={rtl ? "en" : "ar"}>
              {ui.langSwitch[lang]}
            </button>
            <button ref={mapBtnRef} type="button" className="story-chip" onClick={() => setMapOpen(true)} aria-haspopup="dialog" aria-expanded={mapOpen}>
              {ui.map[lang]}
              <span className="story-chip-count" aria-hidden="true">
                {String(active + 1).padStart(2, "0")}/{String(chapters.length).padStart(2, "0")}
              </span>
            </button>
            <Link to="/index" className="story-chip story-chip-solid">
              {ui.index[lang]}
            </Link>
          </nav>
        </header>
        <div ref={hintRef} className="story-hint" aria-hidden="true">
          {ui.hint[lang]} <span className="story-hint-arrow">{rtl ? "←" : "→"}</span>
        </div>

        {mapOpen && (
          <div className="story-map-backdrop" onClick={() => setMapOpen(false)}>
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="map-title"
              className="story-map"
              onClick={(e) => e.stopPropagation()}
              ref={(el) => el?.querySelector<HTMLElement>("button[data-stop]")?.focus()}
            >
              <div className="flex items-center justify-between gap-4">
                <h2 id="map-title" className="story-map-title">
                  {ui.mapTitle[lang]}
                </h2>
                <button
                  type="button"
                  className="grid size-9 place-items-center rounded-full hover:bg-black/5"
                  onClick={() => {
                    setMapOpen(false);
                    mapBtnRef.current?.focus();
                  }}
                  aria-label={ui.close[lang]}
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              </div>
              <ol className="story-map-list">
                {chapters.map((c, i) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      data-stop
                      aria-current={i === active ? "step" : undefined}
                      onClick={() => {
                        setMapOpen(false);
                        goTo(i);
                      }}
                    >
                      <span className="story-map-n">{String(i).padStart(2, "0")}</span>
                      {c.label[lang]}
                    </button>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}

        <div className="story-curtain" aria-hidden="true">
          <span>{ui.loading[lang]}</span>
        </div>
      </div>
    </div>
  );
}
