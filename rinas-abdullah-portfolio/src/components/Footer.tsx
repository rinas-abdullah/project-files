import { Link } from "react-router";
import { profile } from "@/data/profile";
import { projects } from "@/data/projects";
import { ExternalLink } from "./ExternalLink";
import { Monogram } from "./Monogram";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-[var(--rule)] bg-obsidian">
      <div className="shell grid gap-12 py-16 md:grid-cols-12">
        <div className="md:col-span-5">
          <Monogram className="size-10 text-paper" />
          <p className="mt-6 max-w-sm text-sm leading-relaxed text-steel">{profile.tagline}</p>
        </div>
        <nav aria-label="Case studies" className="md:col-span-4">
          <p className="t-label mb-4">Case studies</p>
          <ul className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            {projects.map((p) => (
              <li key={p.slug}>
                <Link to={`/work/${p.slug}`} className="link-underline text-paper/80 hover:text-paper">
                  {p.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="md:col-span-3">
          <p className="t-label mb-4">Elsewhere</p>
          <ul className="grid gap-2 text-sm text-paper/80">
            <li>
              <ExternalLink href={profile.github} className="hover:text-paper">GitHub</ExternalLink>
            </li>
            <li>
              <ExternalLink href={profile.linkedin} className="hover:text-paper">LinkedIn</ExternalLink>
            </li>
            <li>
              <a href={`mailto:${profile.email}`} className="link-underline hover:text-paper">
                {profile.email}
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="shell flex flex-col gap-2 border-t border-[var(--rule)] py-6 sm:flex-row sm:justify-between">
        <p className="t-label">© {year} {profile.name}</p>
        <p className="t-label">{profile.location} · {profile.coordinates}</p>
      </div>
    </footer>
  );
}
