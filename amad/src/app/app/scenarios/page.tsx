import type { Metadata } from "next";
import { startSessionAction } from "@/app/actions/app";
import { Badge, Button, Card, DIFFICULTY_AR } from "@/components/ui";
import { can } from "@/server/auth/rbac";
import { requireActor } from "@/server/auth/session";
import { definitionOf, listScenarios } from "@/server/services/simulation";

export const metadata: Metadata = { title: "السيناريوهات" };

export default async function ScenariosPage() {
  const actor = await requireActor();
  const scenarios = await listScenarios(actor);
  const canRun = can(actor, "simulation:run");
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold">السيناريوهات</h1>
        <p className="mt-1 max-w-3xl text-sm text-silver">
          كل سيناريو بيئة افتراضية كاملة: أصول وهويات وسجلات اصطناعية، وخصم يتحرك عبر مخطط هجوم معتمد ومربوط بإطار MITRE ATT&CK، ويتكيّف مع قراراتك ومستواك.
          لا يتصل أي جزء من المحاكاة بأنظمة حقيقية.
        </p>
      </header>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {scenarios.map((s) => {
          const def = definitionOf(s);
          return (
            <Card key={s.id} className="flex flex-col">
              <div className="flex flex-1 flex-col gap-3 p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="lime">{DIFFICULTY_AR[s.difficulty]}</Badge>
                  <Badge>{s.source === "AUTHORED" ? "مُعدّ ومراجع يدويًا" : "مولّد ومعتمد"}</Badge>
                  <Badge>{def.timeBudget} دقيقة محاكاة</Badge>
                </div>
                <h2 className="text-lg font-semibold">{s.titleAr}</h2>
                <p className="text-sm text-silver">{s.briefingAr}</p>
                <div>
                  <p className="mb-1.5 text-xs text-subtle">الكفاءات المستهدفة</p>
                  <div className="flex flex-wrap gap-1.5">
                    {s.competencies.sort((a, b) => b.weight - a.weight).map((c) => <Badge key={c.competencyId}>{c.competency.nameAr}</Badge>)}
                  </div>
                </div>
                <div>
                  <p className="mb-1.5 text-xs text-subtle">تقنيات ATT&CK المحتملة</p>
                  <p className="ltr text-start font-mono text-xs text-silver">{s.attackRefs.join(" · ")}</p>
                </div>
              </div>
              <div className="border-t border-line p-4">
                {canRun ? (
                  <form action={startSessionAction}>
                    <input type="hidden" name="scenarioId" value={s.id} />
                    <Button type="submit" className="w-full">بدء المحاكاة</Button>
                  </form>
                ) : (
                  <p className="text-xs text-subtle">دورك للقراءة فقط ولا يتيح بدء المحاكاة.</p>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
