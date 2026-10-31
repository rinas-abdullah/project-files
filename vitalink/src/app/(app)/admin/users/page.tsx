import { requirePermission } from "@/lib/session";
import { prisma } from "@/lib/db";
import { getDict } from "@/lib/i18n";
import { formatDateTime } from "@/lib/i18n/format";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";

export default async function UsersPage() {
  const user = await requirePermission("users:read");
  const { t, locale } = await getDict();
  const rows = await prisma.user.findMany({
    where: user.orgType === "PLATFORM" ? {} : { organizationId: user.organizationId },
    include: { organization: true, ambulance: true, roleRef: true },
    orderBy: [{ organization: { name: "asc" } }, { role: "asc" }],
  });
  return (
    <div className="space-y-4">
      <PageHeader title={t.users.title} subtitle={`${rows.length}`} />
      <Card>
        <CardContent className="p-0">
          <Table>
            <THead>
              <TR>
                <TH>{t.users.name}</TH>
                <TH>{t.users.email}</TH>
                <TH>{t.users.role}</TH>
                <TH>{t.users.org}</TH>
                <TH>{t.users.lastLogin}</TH>
                <TH>{t.users.active}</TH>
              </TR>
            </THead>
            <TBody>
              {rows.map((u) => (
                <TR key={u.id}>
                  <TD className="font-medium">{u.name}</TD>
                  <TD className="ltr text-xs">{u.email}</TD>
                  <TD>
                    <Badge variant="outline">{t.roles[u.role]}</Badge>
                    <div className="ltr mt-0.5 text-start text-[10px] text-muted-foreground">{u.roleRef.permissions.length} ✓</div>
                  </TD>
                  <TD className="text-xs">
                    {locale === "ar" ? u.organization.nameAr : u.organization.name}
                    {u.ambulance ? <span className="ltr"> · {u.ambulance.callSign}</span> : null}
                  </TD>
                  <TD className="text-xs tabular">{formatDateTime(u.lastLoginAt, locale)}</TD>
                  <TD>{u.active ? <Badge variant="stable">{t.common.yes}</Badge> : <Badge variant="muted">{t.common.no}</Badge>}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
