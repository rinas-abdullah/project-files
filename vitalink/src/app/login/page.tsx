import { redirect } from "next/navigation";
import { getDict } from "@/lib/i18n";
import { getCurrentUser } from "@/lib/session";
import { homeFor } from "@/lib/rbac";
import { Logo } from "@/components/app/logo";
import { LangToggle } from "@/components/public/lang-toggle";
import { LoginForm } from "./login-form";

const DEMO_ACCOUNTS = [
  { email: "paramedic@vitalink.demo", role: "PARAMEDIC" },
  { email: "nurse@vitalink.demo", role: "ED_NURSE" },
  { email: "doctor@vitalink.demo", role: "ED_DOCTOR" },
  { email: "dispatch@vitalink.demo", role: "EMS_DISPATCH" },
  { email: "analyst@vitalink.demo", role: "OPERATIONS_ANALYST" },
  { email: "admin@vitalink.demo", role: "SUPER_ADMIN" },
  { email: "edadmin@vitalink.demo", role: "ED_ADMIN" },
  { email: "coordinator@vitalink.demo", role: "HOSPITAL_COORDINATOR" },
  { email: "emsadmin@vitalink.demo", role: "EMS_ADMIN" },
  { email: "auditor@vitalink.demo", role: "AUDITOR" },
] as const;

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const user = await getCurrentUser();
  const { next } = await searchParams;
  if (user) redirect(next && next.startsWith("/") && !next.startsWith("//") ? next : homeFor(user.role));
  const { t } = await getDict();
  const demo = process.env.DEMO_MODE !== "false";
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.1fr]">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-navy-950 p-10 text-white lg:flex">
        <div className="pointer-events-none absolute -bottom-40 -start-40 size-[520px] rounded-full bg-red-600/20 blur-3xl" />
        <Logo className="text-white" />
        <div className="relative">
          <h2 className="max-w-md text-3xl font-semibold leading-tight">{t.landing.hero}</h2>
          <p className="mt-4 max-w-md text-sm text-white/65">{t.landing.heroSub}</p>
        </div>
        <ul className="relative space-y-1 text-[11px] text-white/45">
          {t.disclaimer.body.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      </div>
      <div className="flex flex-col">
        <div className="flex items-center justify-between p-5">
          <div className="lg:hidden">
            <Logo />
          </div>
          <LangToggle className="ms-auto text-foreground hover:bg-muted" />
        </div>
        <div className="flex flex-1 items-center justify-center p-5">
          <div className="w-full max-w-md">
            <h1 className="text-2xl font-semibold tracking-tight">{t.login.title}</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">{t.login.subtitle}</p>
            <LoginForm next={next} demoAccounts={demo ? DEMO_ACCOUNTS.map((a) => ({ ...a })) : []} demoPassword={demo ? process.env.DEMO_PASSWORD ?? "VitaLink@2026" : null} />
          </div>
        </div>
      </div>
    </div>
  );
}
