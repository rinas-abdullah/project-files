import { Hero } from "@/sections/Hero";
import { Practice } from "@/sections/Practice";
import { WorkExplorer } from "@/sections/WorkExplorer";
import { WebWork } from "@/sections/WebWork";
import { Experience } from "@/sections/Experience";
import { Capabilities } from "@/sections/Capabilities";
import { Leadership } from "@/sections/Leadership";
import { Contact } from "@/sections/Contact";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import { profile } from "@/data/profile";

export default function HomePage() {
  useDocumentMeta({
    title: `${profile.name} — Founder, Cybersecurity & AI Architect`,
    description:
      "Rinas Abdullah Murayr — founder, cybersecurity and AI architect, full-stack developer, UI/UX designer and Unity game developer based in Jeddah. Selected work: Dithar, Rasd Cyber, Rikaz, Mu'een, Muyassir.",
    path: "/",
  });
  return (
    <>
      <Hero />
      <Practice />
      <WorkExplorer />
      <WebWork />
      <Experience />
      <Capabilities />
      <Leadership />
      <Contact />
    </>
  );
}
