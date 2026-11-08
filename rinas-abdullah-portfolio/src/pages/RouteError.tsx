import { Link, isRouteErrorResponse, useRouteError } from "react-router";
import { Monogram } from "@/components/Monogram";

/** Last-resort boundary for render or routing failures. */
export function RouteError() {
  const err = useRouteError();
  const notFound = isRouteErrorResponse(err) && err.status === 404;
  if (import.meta.env.DEV) console.error(err);
  return (
    <div className="grid min-h-[100svh] place-items-center bg-obsidian px-6 text-paper">
      <div className="max-w-md">
        <Monogram className="size-10" />
        <p className="t-label mt-8">{notFound ? "404 — Sheet not found" : "Unexpected error"}</p>
        <h1 className="t-heading mt-4 text-4xl">
          {notFound ? "This page isn't part of the set." : "Something interrupted this page."}
        </h1>
        <p className="t-body mt-4">
          {notFound ? "The link may be outdated." : "Reloading usually resolves it. If it persists, the rest of the site is still available."}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/" className="btn btn-primary">Return home</Link>
          {!notFound && (
            <button type="button" className="btn btn-ghost" onClick={() => window.location.reload()}>
              Reload
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
