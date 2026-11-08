import type { MediaAsset, Website } from "@/types";

const shot = (base: string, site: string, view: "desktop" | "detail" | "mobile"): MediaAsset => {
  const mobile = view === "mobile";
  return {
    base: `${base}-${view}`,
    widths: mobile ? [600, 390] : [1600, 900],
    width: mobile ? 600 : 1600,
    height: mobile ? 1022 : 1000,
    alt: `${site} — ${view === "desktop" ? "home page on desktop" : view === "detail" ? "content section on desktop" : "home page on a phone"}`,
    kind: "capture",
    caption: `Captured from the live site, November 2026.`,
  };
};

/**
 * Websites delivered for businesses. Screenshots were captured from the
 * live sites; descriptions record what each site presents publicly.
 */
export const websites: Website[] = [
  {
    slug: "la-vie-ahd",
    name: "La Vie Ahd",
    url: "https://la-vie-ahd.vercel.app/",
    host: "la-vie-ahd.vercel.app",
    sector: "Jewellery · E-commerce",
    observed:
      "An Arabic-first storefront for a jewellery brand: collections, new arrivals and a gifting journey, set in a soft editorial palette.",
    contribution: "Website development",
    features: ["Right-to-left Arabic interface", "Collection & product browsing", "Gift selection flow", "Camera try-on entry point"],
    rtl: true,
    desktop: shot("laviehd", "La Vie Ahd", "desktop"),
    detail: shot("laviehd", "La Vie Ahd", "detail"),
    mobile: shot("laviehd", "La Vie Ahd", "mobile"),
  },
  {
    slug: "al-fahd",
    name: "Al Fahd Company",
    url: "https://fhd.com.sa",
    host: "fhd.com.sa",
    sector: "Engineering & Design Consultancy",
    liveBranding: "Live site branded FHD — Fahad H. Daak Engineering Consultants",
    observed:
      "A corporate platform presenting architectural, interior, landscape and urban design services alongside projects, clients, careers and training.",
    contribution: "Responsive web architecture & UI/UX",
    features: ["Services catalogue", "Project & client showcases", "Careers and training section", "Language switcher"],
    rtl: false,
    desktop: shot("fhd", "Al Fahd Company", "desktop"),
    detail: shot("fhd", "Al Fahd Company", "detail"),
    mobile: shot("fhd", "Al Fahd Company", "mobile"),
  },
  {
    slug: "beirut-al-raed",
    name: "Beirut Al-Raed",
    url: "https://www.beirutalraed.com",
    host: "beirutalraed.com",
    sector: "Automotive · Performance & Maintenance",
    observed:
      "A high-contrast site for a luxury-car maintenance and programming centre: a performance archive of featured builds, services and appointment booking.",
    contribution: "Responsive web architecture & UI/UX",
    features: ["Right-to-left Arabic interface", "Featured-build archive", "Services overview", "Appointment booking entry point"],
    rtl: true,
    leadView: "detail",
    desktop: shot("beirut", "Beirut Al-Raed", "desktop"),
    detail: shot("beirut", "Beirut Al-Raed", "detail"),
    mobile: shot("beirut", "Beirut Al-Raed", "mobile"),
  },
];
