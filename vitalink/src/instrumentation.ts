export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.VITALINK_DISABLE_SIM !== "1") {
    const { ensureSimulationLoop } = await import("@/lib/services/simulation");
    ensureSimulationLoop();
  }
}
