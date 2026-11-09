import type { Project } from "@/types";

/**
 * Selected ventures and projects.
 * Every statement here is sourced from the CV, the supplied project
 * materials, or the product interfaces themselves. Keep it that way.
 */
export const projects: Project[] = [
  {
    slug: "dithar",
    index: "01",
    name: "Dithar",
    role: "Founder & CEO",
    category: "AI-Powered Healthcare Technology",
    summary:
      "A smart-insole platform exploring early identification of neuro-motor decline through plantar sensing and AI analytics.",
    overview:
      "Dithar is an intelligent smart-insole healthcare platform. An instrumented insole captures how a person walks; the data travels over Bluetooth Low Energy to a cloud platform where AI-powered analytics look for gait patterns associated with neuro-motor decline, and presents them to clinicians and patients through dedicated interfaces. Rinas founded the venture and leads it alongside a founding team of six co-founders.",
    status: "In development · research prototype",
    disciplines: ["intelligence", "engineering", "experience", "security"],
    stack: ["Python", "TensorFlow", "React", "Node.js", "PostgreSQL", "Firebase", "Bluetooth Low Energy"],
    cover: {
      base: "dithar-system",
      widths: [1500, 900],
      width: 1500,
      height: 844,
      alt: "Product visualization of the Dithar smart insole beside an exploded view of its layers, a clinician dashboard on a laptop and a patient app on a phone.",
      kind: "render",
      caption: "Product visualization — insole, layered construction, clinician dashboard and patient app.",
    },
    highlights: [
      {
        title: "Sensing at the foot",
        body: "A layered insole houses the sensing surface, electronics and power, designed to be worn inside everyday footwear.",
      },
      {
        title: "Analytics in the cloud",
        body: "Python and TensorFlow models analyse gait data to surface trends that may warrant clinical attention.",
      },
      {
        title: "Interfaces for every role",
        body: "A role-based platform for clinicians, facility administrators and patients, built with React, Node.js and PostgreSQL.",
      },
    ],
    disclosure:
      "Dithar is under active development. Its analytics are an area of research and are not a clinically validated diagnostic or prediction tool. Product images are renders.",
    module: "dithar",
    figureLabel: "Fig. 01 — Product visualization",
  },
  {
    slug: "rasd-cyber",
    index: "02",
    name: "Rasd Cyber",
    role: "Founder & CEO",
    category: "AI-Powered Cybersecurity Platform",
    summary:
      "An adaptive cyber-range that puts defenders in a live terminal against an AI adversary, then turns their actions into a readiness measure.",
    overview:
      "Rasd Cyber is an adaptive cybersecurity training and threat-intelligence platform that combines interactive simulation, technical learning and intelligent feedback. Defenders work in a live terminal against an AI adversary that re-plans around every defence, under realistic incident pressure. What they do is translated into a readiness measure that leaders can act on.",
    status: "Platform in development",
    disciplines: ["security", "intelligence", "experience"],
    cover: {
      base: "rasd-cyber",
      widths: [1500, 900],
      width: 1500,
      height: 844,
      alt: "Rasd Cyber landing page: headline 'The next attacker won't follow a script. Neither should your training.' beside a terminal replaying an adversary session.",
      kind: "screenshot",
      caption: "Rasd Cyber — platform interface.",
    },
    highlights: [
      {
        title: "Adaptive adversary",
        body: "An AI opponent that changes tactics when a defence succeeds, so training follows the attacker rather than a script.",
      },
      {
        title: "Mapped to MITRE ATT&CK",
        body: "Incidents are framed by ATT&CK tactics: access, execution, persistence, lateral movement, command-and-control and exfiltration.",
      },
      {
        title: "Readiness, not just scores",
        body: "Adaptive learning paths and real-time risk scoring turn individual sessions into a readiness picture for leadership.",
      },
      {
        title: "Built for the region",
        body: "Arabic and English interfaces, with air-gapped deployment for sensitive environments.",
      },
    ],
    module: "rasd",
    figureLabel: "Fig. 02 — Platform interface",
  },
  {
    slug: "rikaz",
    index: "03",
    name: "Rikaz",
    role: "Founder & CEO",
    category: "Smart Infrastructure / Engineering Innovation",
    summary:
      "A proposed field-surveying system for targeted water-leak verification using synchronized geophones and edge signal processing.",
    overview:
      "Rikaz is a proposed field-surveying system designed for targeted water-leak verification. Synchronized geophones listen to the ground above a suspected leak; signal processing on an edge computer compares their readings so a field crew can confirm a leak before excavating. The project spans field instrumentation, embedded computing and the operator interface.",
    status: "Proposed system · concept stage",
    disciplines: ["engineering", "intelligence"],
    cover: {
      base: "rikaz-concept",
      widths: [1500, 900],
      width: 1500,
      height: 844,
      alt: "Concept render of a wheeled Rikaz survey cart with a tablet showing a waveform, two ground geophones and an illustrated underground pipe leak.",
      kind: "concept",
      caption: "Concept render — not manufactured hardware.",
    },
    highlights: [
      {
        title: "Synchronized geophones",
        body: "Multiple ground sensors sampled on a shared clock so their signals can be compared precisely.",
      },
      {
        title: "Signal processing",
        body: "Processing and comparing the sensor channels to isolate the acoustic signature of a leak.",
      },
      {
        title: "Edge computing",
        body: "Processing runs on an edge computer carried with the instrument, at the survey point.",
      },
      {
        title: "Field instrumentation",
        body: "A mobile survey rig with an operator display for verifying a suspected leak on site.",
      },
    ],
    disclosure:
      "Rikaz is a proposed system. The image is a conceptual render, not a photograph of manufactured hardware, and the waveform below is an illustration of the principle.",
    module: "rikaz",
    figureLabel: "Fig. 03 — Concept render",
  },
  {
    slug: "mueen",
    index: "04",
    name: "Mu'een",
    category: "AI Crowd Intelligence & Safety",
    summary:
      "A crowd-safety intelligence platform combining computer vision, sensor fusion and predictive signals in an operational dashboard.",
    overview:
      "Mu'een is a crowd-safety intelligence platform exploring real-time behavioural analytics. It brings computer vision and sensor data together, detects anomalies in how a crowd is moving, anticipates congestion with predictive analytics, and gives safety personnel an operational dashboard to act early rather than react late.",
    status: "System design",
    disciplines: ["intelligence", "security", "experience"],
    highlights: [
      {
        title: "Sensor fusion",
        body: "Computer vision and environmental sensors combined into a single picture of the crowd.",
      },
      {
        title: "Anomaly detection",
        body: "Behavioural analytics flag movement that departs from the expected pattern.",
      },
      {
        title: "Predictive signals",
        body: "Predictive analytics anticipate congestion so crowd flow can be managed proactively.",
      },
      {
        title: "Operational dashboards",
        body: "Real-time dashboards supporting data-driven decisions by safety personnel.",
      },
    ],
    module: "mueen",
    figureLabel: "Fig. 04 — System architecture",
  },
  {
    slug: "muyassir",
    index: "05",
    name: "Muyassir",
    category: "AI-Powered GovTech Platform",
    summary:
      "A municipal licensing readiness platform that analyses storefront photos, identifies compliance gaps and explains how to fix them.",
    overview:
      "Muyassir helps shop owners understand how ready they are before applying for a municipal licence. Owners photograph the storefront, the entrance and the interior; the platform matches the photos against the requirements for their activity and produces a report in their own language showing what passes, what is missing, and how to fix each item. An assistant answers questions by voice or text, and municipalities get a dashboard of their own.",
    status: "Working prototype",
    disciplines: ["intelligence", "experience", "engineering"],
    cover: {
      base: "muyassir",
      widths: [1500, 900],
      width: 1500,
      height: 704,
      alt: "Muyassir home page: 'Photograph your shop and know how ready you are before you apply for the licence' beside a phone showing a 63% readiness report.",
      kind: "screenshot",
      caption: "Muyassir — platform interface.",
    },
    highlights: [
      { title: "AI readiness analysis", body: "Storefront, entrance and interior photos analysed against the requirements for the shop's activity." },
      { title: "Compliance reporting", body: "A clear report of what passes, what needs review and what needs a fix, with a readiness score." },
      { title: "Intelligent assistance", body: "“Ask Muyassir” answers questions by voice and text throughout the process." },
      { title: "Municipality dashboards", body: "A dedicated view for municipal teams alongside the shop-owner experience." },
      { title: "Bilingual interfaces", body: "Arabic and English, with reports delivered in the owner's own language." },
    ],
    module: "muyassir",
    figureLabel: "Fig. 05 — Platform interface",
  },
  {
    slug: "qiddiya-explorer",
    index: "06",
    name: "Qiddiya Explorer",
    category: "Unity / Game Development",
    summary:
      "An interactive 3D exploration game inspired by Qiddiya City, built collaboratively during a Game Design Hackathon.",
    overview:
      "Qiddiya Explorer was an interactive 3D exploration game inspired by Qiddiya City, developed collaboratively by a team during a general Game Design Hackathon. Rinas contributed across the whole project: game concept, gameplay, UI/UX, programming, 3D environment work, testing and team coordination.",
    status: "Previous project · archive unavailable",
    disciplines: ["experience", "engineering"],
    stack: ["Unity", "C#", "3D environment design"],
    highlights: [],
    disclosure:
      "The hackathon was a general Game Design Hackathon and was not organised by Qiddiya. The original game files were lost, so no gameplay footage is shown and the game is not currently playable. The optional scene on this page is a new web sketch built with three.js — it is not the original Unity build.",
    module: "qiddiya",
    figureLabel: "Fig. 06 — Contribution map",
  },
];

export const getProject = (slug: string | undefined) => projects.find((p) => p.slug === slug);
