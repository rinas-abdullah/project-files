import type { CapabilityGroup, Certification, Community, Role } from "@/types";

/** Professional experience — transcribed from the CV. Most recent first. */
export const roles: Role[] = [
  {
    org: "Balghsoon Clinics",
    title: "IT Support Specialist",
    start: { y: 2026, m: 1 },
    end: { y: 2026, m: 2 },
    period: "Jan 2026 – Feb 2026",
    location: "Jeddah",
    points: [
      "Maintained clinical systems across healthcare operations, sustaining 99.2% uptime.",
      "Implemented HIPAA-aligned data-privacy protocols protecting patient health information (PHI).",
      "Managed Electronic Health Record (EHR) systems to keep medical data securely and reliably accessible.",
    ],
    focus: ["Clinical systems", "Data privacy", "EHR"],
  },
  {
    org: "Clouds Zone IT International",
    title: "Cybersecurity Architect & Infrastructure Specialist",
    start: { y: 2025, m: 11 },
    end: { y: 2026, m: 1 },
    period: "Nov 2025 – Jan 2026",
    location: "Jeddah",
    points: [
      "Architected network security controls following a defence-in-depth strategy across the infrastructure.",
      "Configured firewalls and network intrusion prevention (NIPS) for real-time threat detection and mitigation.",
      "Hardened Linux and Windows systems and validated them against security standards.",
    ],
    focus: ["Defence in depth", "Firewalls & NIPS", "System hardening"],
  },
  {
    org: "Cyverse",
    title: "Governance, Risk & Compliance Specialist",
    start: { y: 2025, m: 10 },
    end: { y: 2026, m: 1 },
    period: "Oct 2025 – Jan 2026",
    location: "Jeddah",
    concurrent: true,
    points: [
      "Conducted risk assessments and vulnerability analysis, aligning frameworks with industry standards.",
      "Identified security gaps and coordinated their remediation to reduce organisational risk exposure.",
      "Implemented GRC controls and Secure Development Lifecycle (SDL) practices to strengthen compliance and resilience.",
    ],
    focus: ["Risk assessment", "Vulnerability analysis", "GRC & SDL"],
  },
];

export const capabilities: CapabilityGroup[] = [
  {
    key: "security",
    label: "A",
    title: "Cybersecurity & GRC",
    items: ["Risk Assessment", "Network Security", "Vulnerability Analysis", "Secure Architecture", "Kali Linux", "SDL", "Web Application Security"],
  },
  {
    key: "intelligence",
    label: "B",
    title: "AI & Machine Learning",
    items: ["Python", "TensorFlow", "Predictive Analytics", "Anomaly Detection", "Intelligent Systems"],
  },
  {
    key: "engineering",
    label: "C",
    title: "Full-Stack Engineering",
    items: ["React.js", "Node.js", "Tailwind CSS", "PostgreSQL", "Firebase", "Redis", "REST APIs"],
  },
  {
    key: "experience",
    label: "D",
    title: "Design & Game Development",
    items: ["Figma", "UI/UX Design", "Interactive Prototyping", "Unity", "3D Game Development"],
  },
];

export const community: Community[] = [
  {
    org: "Hemmah Al-Najah Developer Division",
    role: "Supervision Member",
    body: "Mentoring developers and supporting technical quality across the developer community.",
  },
  {
    org: "Ro'yana Initiative",
    role: "AI Innovation Member",
    body: "Contributing to AI innovation initiatives that advance the adoption of healthcare technology.",
  },
  {
    org: "Saudi Red Crescent Authority & Ertiwaa",
    role: "Volunteer Contributor",
    body: "Developed web platforms that support service delivery and digital accessibility.",
  },
];

/** Certifications exactly as listed on the CV — issuers only where the CV names one. */
export const certifications: Certification[] = [
  { name: "IBM Cybersecurity Fundamentals", issuer: "Saud University" },
  { name: "AI Certificate", issuer: "King Khalid University" },
  { name: "Hadaf Advanced Cybersecurity Program" },
  { name: "IBM Knowsight Strategic Analytics" },
  { name: "Cybersecurity Club Membership", issuer: "King Faisal University" },
];
