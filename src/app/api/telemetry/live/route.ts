import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const patientId = searchParams.get("patientId") || "pat-1";

  // Generate realistic dynamic live sensor variance around baseline
  const now = new Date();
  const timeStr = now.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  const tempVariance = (Math.random() * 0.4 - 0.2); // +/- 0.2 C
  const pressureVariance = Math.floor(Math.random() * 8 - 4); // +/- 4 kPa
  const stepIncrement = Math.floor(Math.random() * 3); // 0-2 steps

  const telemetry = {
    patientId,
    timestamp: now.toISOString(),
    formattedTime: timeStr,
    device: {
      id: "DITHAR-PAD-9842",
      name: "Dithar Smart PAD Node",
      status: "connected",
      battery: 88,
      signal: "Excellent",
      firmware: "v2.4.1"
    },
    liveVitals: {
      temperature: Number((37.2 + tempVariance).toFixed(1)),
      pressure: 118 + pressureVariance,
      steps: 4281 + stepIncrement,
      humidity: 42,
      complianceScore: 96,
      symmetryScore: 94.8,
    },
    sensorsHeatmap: [
      { id: "s1", location: "heel_center", pressure: 64 + pressureVariance, temp: 36.8, status: "normal" },
      { id: "s2", location: "heel_lateral", pressure: 42, temp: 36.6, status: "normal" },
      { id: "s3", location: "arch_mid", pressure: 22, temp: 36.4, status: "normal" },
      { id: "s4", location: "metatarsal_1", pressure: 82 + pressureVariance, temp: 37.8, status: "elevated" },
      { id: "s5", location: "metatarsal_3", pressure: 55, temp: 37.1, status: "normal" },
      { id: "s6", location: "hallux_toe", pressure: 70, temp: 36.9, status: "normal" }
    ]
  };

  return NextResponse.json({
    success: true,
    telemetry
  });
}
