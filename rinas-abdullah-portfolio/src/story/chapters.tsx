import { Link } from "react-router";
import { ArrowUpRight, Mail } from "lucide-react";
import type { ReactNode } from "react";
import { largest, srcSet } from "@/lib/media";
import { Bench, Fountain, HijaziHouse, Lanterns, Lighthouse, Palm } from "./art";
import { build, carry, chapters, company, defend, hero, roots, storefronts, talk, ui, type Lang } from "./content";

type C = { lang: Lang };

function Title({ index, lang, as: Tag = "h2" }: { index: number; lang: Lang; as?: "h1" | "h2" }) {
  const [a, b, c] = chapters[index].title[lang];
  return (
    <Tag className="story-title">
      {a.split("\n").map((part, i, arr) => (
        <span key={i}>
          {part}
          {i < arr.length - 1 && <br />}
        </span>
      ))}
      <em className="story-accent">{b}</em>
      {c}
    </Tag>
  );
}

function Chapter({ id, index, children, className = "" }: { id: string; index: number; children: ReactNode; className?: string }) {
  return (
    <section
      id={id}
      data-chapter={index}
      aria-labelledby={`${id}-h`}
      className={`story-chapter ${className}`}
    >
      {children}
    </section>
  );
}

/** A note-card on a post, planted on the promenade. */
function Placard({ children, className = "", post = true }: { children: ReactNode; className?: string; post?: boolean }) {
  return (
    <div className={`placard-wrap ${className}`}>
      <div className="placard">{children}</div>
      {post && <div className="placard-post" aria-hidden="true" />}
    </div>
  );
}

/* 0 ─ Dawn ---------------------------------------------------------- */
export function Dawn({ lang }: C) {
  return (
    <Chapter id="dawn" index={0} className="chapter-dawn">
      <div className="hero-copy" id="dawn-h">
        <p className="story-kicker">{hero.coords[lang]}</p>
        <h1 className="hero-name" lang="en" dir="ltr">
          {hero.first[lang]}
          <span className="hero-dot" aria-hidden="true" />
        </h1>
        <p className="hero-rest" lang="en" dir="ltr">{hero.rest[lang]}</p>
        <div className="hero-lines">
          {hero.lines.map((l, i) => (
            <p key={i} style={{ animationDelay: `${0.5 + i * 0.25}s` }}>
              <span className="text-[var(--accent)]" aria-hidden="true">›</span> {l[lang]}
            </p>
          ))}
        </div>
      </div>
      <Fountain className="dawn-fountain" />
      <div className="stage stage-dawn" aria-hidden="true">
        <Palm className="art h-[min(44vh,380px)]" />
        <Palm className="art -ms-10 h-[min(36vh,300px)]" flip />
      </div>
    </Chapter>
  );
}

/* 1 ─ Roots --------------------------------------------------------- */
export function Roots({ lang }: C) {
  return (
    <Chapter id="roots" index={1}>
      <header id="roots-h" className="chapter-head">
        <p className="story-kicker">{ui.stop[lang]} 01</p>
        <Title index={1} lang={lang} />
      </header>
      <div className="stage">
        <Placard className="w-[min(340px,78vw)]">
          <ul className="placard-list">
            {roots.lines.map((l, i) => (
              <li key={i}>{l[lang]}</li>
            ))}
          </ul>
        </Placard>
        <div className="art flex items-end" aria-hidden="true">
          <HijaziHouse id="h1" h={300} className="h-[min(40vh,320px)]" />
          <HijaziHouse id="h2" h={400} wall="#e6cfae" wood="#5d6f4f" className="-ms-2 h-[min(52vh,430px)]" />
          <HijaziHouse id="h3" h={260} wall="#efe2cc" wood="#2f6f78" className="-ms-2 h-[min(34vh,280px)]" />
          <Palm className="-ms-8 h-[min(38vh,320px)]" />
        </div>
      </div>
    </Chapter>
  );
}

/* 2 ─ Defend -------------------------------------------------------- */
export function Defend({ lang }: C) {
  return (
    <Chapter id="defend" index={2}>
      <header id="defend-h" className="chapter-head">
        <p className="story-kicker">{ui.stop[lang]} 02</p>
        <Title index={2} lang={lang} />
      </header>
      <div className="stage">
        {defend.map((r, i) => (
          <Placard key={r.org} className="w-[min(300px,78vw)]" >
            <p className="placard-label">
              {String(i + 1).padStart(2, "0")} · <span dir="ltr">{r.period}</span>
            </p>
            <h3 className="placard-title">{r.title[lang]}</h3>
            <p className="placard-org" dir="ltr">{r.org}</p>
            <p className="placard-body">{r.point[lang]}</p>
          </Placard>
        ))}
        <Lighthouse className="art ms-6 h-[min(56vh,460px)]" />
      </div>
    </Chapter>
  );
}

/* 3 ─ Build --------------------------------------------------------- */
export function Build({ lang }: C) {
  return (
    <Chapter id="build" index={3}>
      <header id="build-h" className="chapter-head">
        <p className="story-kicker">{ui.stop[lang]} 03</p>
        <Title index={3} lang={lang} />
        <p className="chapter-intro">{build.intro[lang]}</p>
      </header>
      <div className="stage">
        <div className="gallery-wall">
          <div className="gallery-lamps" aria-hidden="true" />
          {build.items.map((p) => (
            <Link key={p.slug} to={`/work/${p.slug}`} className="frame group" lang="en">
              <div className="frame-art">
                {p.cover ? (
                  <img
                    src={largest(p.cover)}
                    srcSet={srcSet(p.cover)}
                    sizes="(max-width: 640px) 70vw, 300px"
                    alt={p.cover.alt}
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div className="frame-type" aria-hidden="true">
                    <span>{p.index}</span>
                    {p.name}
                  </div>
                )}
              </div>
              <div className="frame-plate" lang={lang} dir={lang === "ar" ? "rtl" : "ltr"}>
                <span className="frame-name" lang="en" dir="ltr">{p.name}</span>
                <span className="frame-meta">{p.category[lang]}</span>
                <span className="frame-status">
                  {p.status[lang]}
                  <ArrowUpRight className="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
                </span>
                {lang === "ar" && <span className="sr-only">{ui.caseInEnglish.ar}</span>}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </Chapter>
  );
}

/* 4 ─ Storefronts --------------------------------------------------- */
const awnings = ["#e2674a", "#2f6f78", "#c4472c"];
export function Storefronts({ lang }: C) {
  return (
    <Chapter id="storefronts" index={4}>
      <header id="storefronts-h" className="chapter-head">
        <p className="story-kicker">{ui.stop[lang]} 04</p>
        <Title index={4} lang={lang} />
        <p className="chapter-intro">{storefronts.intro[lang]}</p>
      </header>
      <div className="stage">
        {storefronts.items.map((s, i) => (
          <a
            key={s.slug}
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            className="shop group"
            style={{ "--awning": awnings[i % awnings.length] } as React.CSSProperties}
          >
            <span className="shop-sign" lang="en" dir="ltr">{s.name}</span>
            <span className="shop-awning" aria-hidden="true" />
            <span className="shop-window">
              <img src={largest(s.shot)} srcSet={srcSet(s.shot)} sizes="320px" alt={s.shot.alt} loading="lazy" decoding="async" />
            </span>
            <span className="shop-info">
              <span className="block font-semibold">{s.sector[lang]}</span>
              <span className="block opacity-75">{s.contribution[lang]}</span>
              <span className="shop-visit">
                <span dir="ltr">{s.host}</span>
                <ArrowUpRight className="size-3.5" aria-hidden="true" />
                <span className="sr-only">({ui.visit[lang]})</span>
              </span>
            </span>
          </a>
        ))}
        <Palm className="art -ms-4 h-[min(40vh,340px)]" />
      </div>
    </Chapter>
  );
}

/* 5 ─ Carry --------------------------------------------------------- */
export function Carry({ lang }: C) {
  return (
    <Chapter id="carry" index={5}>
      <header id="carry-h" className="chapter-head">
        <p className="story-kicker">{ui.stop[lang]} 05</p>
        <Title index={5} lang={lang} />
      </header>
      <div className="stage">
        {carry.map((c) => (
          <Placard key={c.key} className="w-[min(250px,74vw)]">
            <p className="placard-label">{c.label}</p>
            <h3 className="placard-title">{c.title[lang]}</h3>
            <ul className="chips" lang="en" dir="ltr">
              {c.items.map((it) => (
                <li key={it}>{it}</li>
              ))}
            </ul>
          </Placard>
        ))}
        <Palm className="art -ms-2 h-[min(42vh,360px)]" flip />
      </div>
    </Chapter>
  );
}

/* 6 ─ Company ------------------------------------------------------- */
export function Company({ lang }: C) {
  return (
    <Chapter id="company" index={6}>
      <Lanterns className="chapter-lanterns" />
      <header id="company-h" className="chapter-head">
        <p className="story-kicker">{ui.stop[lang]} 06</p>
        <Title index={6} lang={lang} />
      </header>
      <div className="stage">
        {company.people.map((c) => (
          <Placard key={c.org} className="w-[min(270px,76vw)]">
            <p className="placard-label" dir="ltr">{c.org}</p>
            <h3 className="placard-title">{c.role[lang]}</h3>
            <p className="placard-body">{c.body[lang]}</p>
          </Placard>
        ))}
        <Placard className="w-[min(280px,76vw)]">
          <p className="placard-label">{company.certsTitle[lang]}</p>
          <ul className="ticket-list" lang="en" dir="ltr">
            {company.certs.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </Placard>
      </div>
    </Chapter>
  );
}

/* 7 ─ Talk ---------------------------------------------------------- */
export function Talk({ lang }: C) {
  return (
    <Chapter id="talk" index={7} className="chapter-talk">
      <header id="talk-h" className="chapter-head talk-head">
        <Title index={7} lang={lang} />
        <p className="talk-sub">{talk.sub[lang]}</p>
        <div className="talk-links">
          <a href={`mailto:${talk.links.email}`} className="talk-btn">
            <Mail className="size-4" aria-hidden="true" /> {talk.email[lang]}
          </a>
          <a href={talk.links.github} target="_blank" rel="noopener noreferrer" className="talk-btn">
            GitHub <ArrowUpRight className="size-4" aria-hidden="true" />
          </a>
          <a href={talk.links.linkedin} target="_blank" rel="noopener noreferrer" className="talk-btn">
            LinkedIn <ArrowUpRight className="size-4" aria-hidden="true" />
          </a>
        </div>
        <Link to="/index" className="talk-more">
          {talk.more[lang]} {lang === "ar" ? "←" : "→"}
        </Link>
      </header>
      <Fountain className="talk-fountain" />
      <div className="stage stage-talk" aria-hidden="true">
        <Bench className="art h-[min(10vh,90px)]" />
        <Palm className="art -ms-4 h-[min(40vh,340px)]" />
      </div>
      <p className="talk-credit">{talk.credit[lang]}</p>
    </Chapter>
  );
}

export const chapterComponents = [Dawn, Roots, Defend, Build, Storefronts, Carry, Company, Talk];
