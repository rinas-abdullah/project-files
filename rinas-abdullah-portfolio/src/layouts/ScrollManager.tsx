import { useEffect, useRef } from "react";
import { useLocation } from "react-router";

/** Scrolls to the hash target after navigation (also across routes), otherwise to the top. */
export function ScrollManager() {
  const { pathname, hash, key } = useLocation();
  const prevPath = useRef(pathname);
  useEffect(() => {
    const routeChanged = prevPath.current !== pathname;
    prevPath.current = pathname;
    if (!hash) {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
      return;
    }
    const id = decodeURIComponent(hash.slice(1));
    let tries = 0;
    let raf = 0;
    const attempt = () => {
      const el = document.getElementById(id);
      if (el) {
        // Jump instantly after a route change; smooth (via CSS) for in-page anchors.
        if (routeChanged) {
          window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 64, behavior: "instant" as ScrollBehavior });
        } else {
          el.scrollIntoView({ block: "start" });
        }
        if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1");
        el.focus({ preventScroll: true });
      } else if (tries++ < 40) {
        raf = requestAnimationFrame(attempt);
      }
    };
    raf = requestAnimationFrame(attempt);
    return () => cancelAnimationFrame(raf);
  }, [pathname, hash, key]);
  return null;
}
