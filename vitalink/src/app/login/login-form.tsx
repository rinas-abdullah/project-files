"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/input";
import { useI18n } from "@/components/i18n-provider";

export function LoginForm({ next, demoAccounts, demoPassword }: { next?: string; demoAccounts: { email: string; role: string }[]; demoPassword: string | null }) {
  const { t } = useI18n();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await signIn("credentials", { email, password, redirect: false });
    if (!res || res.error) {
      setError(res?.code === "rate_limited" ? t.login.rateLimited : t.login.invalid);
      setBusy(false);
      return;
    }
    router.replace(next && next.startsWith("/") && !next.startsWith("//") ? next : "/app");
    router.refresh();
  };

  return (
    <>
      <form onSubmit={submit} className="mt-8 grid gap-4" data-testid="login-form">
        <Field label={t.login.email}>
          <Input type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} name="email" dir="ltr" />
        </Field>
        <Field label={t.login.password}>
          <Input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} name="password" dir="ltr" />
        </Field>
        {error ? (
          <div className="rounded-lg border border-red-200 bg-critical-soft px-3 py-2 text-sm text-red-700" role="alert">
            {error}
          </div>
        ) : null}
        <Button type="submit" size="lg" disabled={busy} data-testid="login-submit">
          {busy ? <Loader2 className="animate-spin" /> : <LogIn />} {t.login.submit}
        </Button>
      </form>
      {demoAccounts.length ? (
        <div className="mt-8 rounded-xl border bg-white p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">{t.login.demoAccounts}</div>
            <div className="text-[11px] text-muted-foreground">
              {t.login.demoPassword}: <span className="ltr font-mono font-semibold text-foreground">{demoPassword}</span>
            </div>
          </div>
          <div className="mt-3 grid gap-1.5 sm:grid-cols-2">
            {demoAccounts.map((a) => (
              <button
                key={a.email}
                type="button"
                className="flex flex-col items-start rounded-lg border px-3 py-2 text-start hover:border-navy-700 hover:bg-muted/50"
                onClick={() => {
                  setEmail(a.email);
                  setPassword(demoPassword ?? "");
                }}
              >
                <span className="text-xs font-semibold">{t.roles[a.role as keyof typeof t.roles]}</span>
                <span className="ltr text-[11px] text-muted-foreground">{a.email}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
}
