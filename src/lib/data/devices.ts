import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { devices as devicesTable, patients as patientsTable } from "@/lib/db/schema";
import { Device } from "@/lib/types/portal";

function toDevice(row: typeof devicesTable.$inferSelect): Device {
  return {
    id: row.id,
    deviceId: row.deviceId,
    status: row.status as Device["status"],
    patientId: row.patientId,
    patientName: row.patientName,
    assignedDoctor: row.assignedDoctor,
    batteryLevel: row.batteryLevel,
    signalQuality: row.signalQuality as Device["signalQuality"],
    firmwareVersion: row.firmwareVersion,
    lastSync: row.lastSync,
    isActive: row.isActive,
    isStorage: row.isStorage,
    location: row.location,
  };
}

export async function getDevices(filters: { search?: string; location?: string } = {}): Promise<Device[]> {
  const rows = await db.select().from(devicesTable);
  let filtered = rows.map(toDevice);

  if (filters.search) {
    const q = filters.search.toLowerCase();
    filtered = filtered.filter(
      d => d.deviceId.toLowerCase().includes(q) || (d.patientName && d.patientName.includes(q))
    );
  }

  if (filters.location === "storage") {
    filtered = filtered.filter(d => d.isStorage);
  } else if (filters.location === "active") {
    filtered = filtered.filter(d => !d.isStorage);
  }

  return filtered;
}

export async function getHospitalStats() {
  const [allDevices, allPatients] = await Promise.all([
    db.select().from(devicesTable),
    db.select().from(patientsTable),
  ]);

  const stablePatients = allPatients.filter(p => p.status === "stable").length;

  return {
    // Target figures from the clinical use-case model, not yet measured from
    // live deployments — the UI must label these as estimates, same as savingsEstimate.
    fallReduction: 42,
    mobilityComplicationReduction: 58,
    savingsEstimate: 1.45, // In Millions
    activeDevices: allDevices.filter(d => d.isActive).length,
    totalDevices: allDevices.length,
    stablePatientsPercentage: allPatients.length
      ? Math.round((stablePatients / allPatients.length) * 100)
      : 0,
  };
}

export async function retireDevice(id: string): Promise<Device | undefined> {
  await db
    .update(devicesTable)
    .set({
      isStorage: true,
      isActive: false,
      status: "disconnected",
      patientId: null,
      patientName: "غير مرتبط",
      assignedDoctor: null,
      location: "المستودع الرئيسي",
    })
    .where(eq(devicesTable.id, id));

  const [row] = await db.select().from(devicesTable).where(eq(devicesTable.id, id));
  return row ? toDevice(row) : undefined;
}

export async function reactivateDevice(id: string): Promise<Device | undefined> {
  await db
    .update(devicesTable)
    .set({
      isStorage: false,
      isActive: true,
      status: "disconnected",
      location: "جاهز للتخصيص",
    })
    .where(eq(devicesTable.id, id));

  const [row] = await db.select().from(devicesTable).where(eq(devicesTable.id, id));
  return row ? toDevice(row) : undefined;
}
