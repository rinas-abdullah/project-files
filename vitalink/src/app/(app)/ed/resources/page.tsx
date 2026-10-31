import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/session";
import { prisma } from "@/lib/db";
import { getDict } from "@/lib/i18n";
import { can } from "@/lib/rbac";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResourceEditor, CapabilityToggle } from "./editor";
import { LiveRefresh } from "@/components/live-provider";

export default async function ResourcesPage({ searchParams }: { searchParams: Promise<{ h?: string }> }) {
  const user = await requirePermission("hospital:resources");
  const { t, locale } = await getDict();
  const { h } = await searchParams;
  const hospitals = await prisma.hospital.findMany({ orderBy: { name: "asc" } });
  const hospitalId = user.orgType === "HOSPITAL" ? user.hospitalId : h ?? hospitals[0]?.id;
  const hospital = await prisma.hospital.findUnique({ where: { id: hospitalId ?? "" }, include: { resources: { orderBy: { type: "asc" } }, capabilities: { orderBy: { capability: "asc" } } } });
  if (!hospital) notFound();
  const canCaps = can(user.role, "hospital:capabilities");
  return (
    <div className="space-y-5">
      <LiveRefresh types={["resource"]} />
      <PageHeader
        eyebrow={t.resources.title}
        title={locale === "ar" ? hospital.nameAr : hospital.name}
        actions={
          user.orgType !== "HOSPITAL" ? (
            <div className="flex gap-1">
              {hospitals.map((x) => (
                <Link key={x.id} href={`/ed/resources?h=${x.id}`} className={`rounded-lg border px-3 py-1.5 text-xs ${x.id === hospital.id ? "bg-navy-900 text-white" : "bg-white"}`}>
                  {x.code}
                </Link>
              ))}
            </div>
          ) : null
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>{t.resources.resources}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {hospital.resources.map((r) => (
            <ResourceEditor key={r.id} hospitalId={hospital.id} r={{ type: r.type, status: r.status, available: r.available, total: r.total, note: r.note, updatedAt: r.updatedAt.toISOString() }} />
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{t.resources.capabilities}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {hospital.capabilities.map((c) => (
            <CapabilityToggle key={c.id} hospitalId={hospital.id} capability={c.capability} available={c.available} disabled={!canCaps} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
