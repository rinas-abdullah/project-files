import { requirePermission } from "@/lib/session";
import { prisma } from "@/lib/db";
import { getDict } from "@/lib/i18n";
import { formatDateTime } from "@/lib/i18n/format";
import { can } from "@/lib/rbac";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { IntegrationBadge } from "@/components/shared/status";
import { IntegrationModeSelect } from "./mode-select";

export default async function IntegrationsPage() {
  const user = await requirePermission("integrations:read");
  const { t, locale } = await getDict();
  const rows = await prisma.integration.findMany({ orderBy: { key: "asc" } });
  return (
    <div className="space-y-5">
      <PageHeader title={t.integrations.title} subtitle={t.integrations.subtitle} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" data-testid="integrations">
        {rows.map((i) => (
          <Card key={i.id} data-integration={i.key}>
            <CardHeader>
              <div>
                <CardTitle className="text-base">{t.integrations.names[i.key as keyof typeof t.integrations.names] ?? i.name}</CardTitle>
                <CardDescription className="mt-0.5">{i.category}</CardDescription>
              </div>
              <IntegrationBadge s={i.status} />
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="ltr text-start text-xs leading-relaxed text-muted-foreground">{i.description}</p>
              <div className="grid gap-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t.integrations.lastChecked}</span>
                  <span className="tabular">{formatDateTime(i.lastCheckedAt, locale)}</span>
                </div>
                {i.lastError ? (
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">{t.integrations.lastError}</span>
                    <span className="ltr text-critical">{i.lastError}</span>
                  </div>
                ) : null}
              </div>
              {can(user.role, "integrations:manage") ? <IntegrationModeSelect integrationKey={i.key} status={i.status} /> : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
