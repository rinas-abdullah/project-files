import "server-only";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { patients as patientsTable, alerts as alertsTable, medicalNotes as medicalNotesTable } from "@/lib/db/schema";
import { Patient } from "@/lib/types/portal";

function toPatient(
  row: typeof patientsTable.$inferSelect,
  rowAlerts: (typeof alertsTable.$inferSelect)[],
  rowNotes: (typeof medicalNotesTable.$inferSelect)[]
): Patient {
  return {
    id: row.id,
    mrn: row.mrn,
    name: row.name,
    age: row.age,
    status: row.status,
    statusLabel: row.statusLabel,
    complianceScore: row.complianceScore,
    careType: row.careType,
    diagnosis: row.diagnosis,
    consultant: row.consultant,
    lastUpdated: row.lastUpdated,
    metrics: {
      healthScore: row.healthScore,
      healthScoreLabel: row.healthScoreLabel,
      maxTemp: row.maxTemp,
      steps: row.steps,
      avgPressure: row.avgPressure,
      humidity: row.humidity,
    },
    recommendation: row.recommendation ?? undefined,
    alerts: rowAlerts.map(a => ({
      id: a.id,
      title: a.title,
      description: a.description,
      time: a.time,
      type: a.type,
      recommendation: a.recommendation ?? undefined,
    })),
    medicalNotes: rowNotes
      .map(n => ({ id: n.id, author: n.author, date: n.date, content: n.content }))
      .reverse(),
  };
}

async function attachRelations(rows: (typeof patientsTable.$inferSelect)[]): Promise<Patient[]> {
  if (rows.length === 0) return [];
  const ids = rows.map(r => r.id);
  const [allAlerts, allNotes] = await Promise.all([
    db.select().from(alertsTable).where(inArray(alertsTable.patientId, ids)),
    db.select().from(medicalNotesTable).where(inArray(medicalNotesTable.patientId, ids)),
  ]);
  return rows.map(row =>
    toPatient(
      row,
      allAlerts.filter(a => a.patientId === row.id),
      allNotes.filter(n => n.patientId === row.id)
    )
  );
}

export async function getPatients(filters: { status?: string; search?: string } = {}): Promise<Patient[]> {
  const rows = await db.select().from(patientsTable);
  let filtered = rows;

  if (filters.status && filters.status !== "all") {
    filtered = filtered.filter(p => p.status === filters.status);
  }
  if (filters.search) {
    const q = filters.search.toLowerCase();
    filtered = filtered.filter(
      p =>
        p.name.toLowerCase().includes(q) ||
        p.mrn.toLowerCase().includes(q) ||
        p.diagnosis.toLowerCase().includes(q)
    );
  }

  return attachRelations(filtered);
}

export async function getPatientById(id: string): Promise<Patient | undefined> {
  const [row] = await db.select().from(patientsTable).where(eq(patientsTable.id, id));
  if (!row) return undefined;
  const [result] = await attachRelations([row]);
  return result;
}

export async function addMedicalNote(patientId: string, author: string, content: string): Promise<Patient | undefined> {
  await db.insert(medicalNotesTable).values({
    id: `n-${Date.now()}`,
    patientId,
    author,
    date: new Date().toISOString().split("T")[0],
    content,
  });
  return getPatientById(patientId);
}

export async function updateRecommendation(patientId: string, recommendation: string): Promise<Patient | undefined> {
  await db.update(patientsTable).set({ recommendation }).where(eq(patientsTable.id, patientId));
  return getPatientById(patientId);
}
