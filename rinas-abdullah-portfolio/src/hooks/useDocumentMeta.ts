import { useEffect } from "react";
import { profile } from "@/data/profile";

const setMeta = (selector: string, attr: string, value: string) => {
  const el = document.head.querySelector<HTMLMetaElement | HTMLLinkElement>(selector);
  if (el) el.setAttribute(attr, value);
};

/** Keeps title, description, canonical and Open Graph tags in sync with the route. */
export function useDocumentMeta({ title, description, path }: { title: string; description: string; path: string }) {
  useEffect(() => {
    const url = `${profile.siteUrl}${path}`;
    document.title = title;
    setMeta('meta[name="description"]', "content", description);
    setMeta('link[rel="canonical"]', "href", url);
    setMeta('meta[property="og:title"]', "content", title);
    setMeta('meta[property="og:description"]', "content", description);
    setMeta('meta[property="og:url"]', "content", url);
    setMeta('meta[name="twitter:title"]', "content", title);
    setMeta('meta[name="twitter:description"]', "content", description);
  }, [title, description, path]);
}
