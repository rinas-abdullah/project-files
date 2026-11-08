import { Link } from "react-router";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import { projects } from "@/data/projects";

export default function NotFoundPage() {
  useDocumentMeta({ title: "Not found — Rinas Abdullah Murayr", description: "This page could not be found.", path: "/404" });
  return (
    <section className="shell flex min-h-[100svh] flex-col justify-center pb-20 pt-32">
      <p className="t-label">404 — Sheet not found</p>
      <h1 className="t-display mt-6 text-[clamp(3rem,10vw,8rem)]">Off the plan.</h1>
      <p className="t-body mt-6 max-w-lg">This address isn't part of the portfolio. Start from the index, or open one of the case studies.</p>
      <div className="mt-10 flex flex-wrap gap-3">
        <Link to="/" className="btn btn-primary">Return home</Link>
        {projects.slice(0, 3).map((p) => (
          <Link key={p.slug} to={`/work/${p.slug}`} className="btn btn-ghost">{p.name}</Link>
        ))}
      </div>
    </section>
  );
}
