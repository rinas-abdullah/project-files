import "server-only";
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
    fallReduction: 42,
    ulcerReduction: 58,
    savingsEstimate: 1.45, // In Millions
    activeDevices: allDevices.filter(d => d.isActive).length,
    totalDevices: allDevices.length,
    stablePatientsPercentage: allPatients.length
      ? Math.round((stablePatients / allPatients.length) * 100)
      : 0,
  };
}
