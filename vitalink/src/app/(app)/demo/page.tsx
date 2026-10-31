import { requirePermission } from "@/lib/session";
import { getDict } from "@/lib/i18n";
import { OPEN_STATUSES, scopedEncounters, toCard } from "@/lib/queries";
import { simulationStatus } from "@/lib/services/simulation";
import { PageHeader } from "@/components/app/page-header";
import { LiveRefresh } from "@/components/live-provider";
import { DemoPanel } from "./panel";

export default async function DemoPage() {
  const user = await requirePermission("demo:run");
  const { t } = await getDict();
  const cases = (await scopedEncounters(user, { status: { in: [...OPEN_STATUSES] } })).map(toCard);
  const sim = simulationStatus();
  return (
    <div className="space-y-5">
      <LiveRefresh />
      <PageHeader title={t.demo.title} subtitle={t.demo.subtitle} />
      <DemoPanel cases={cases} sim={sim} />
    </div>
  );
}
