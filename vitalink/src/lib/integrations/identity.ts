import "server-only";
import { integrationStatus, isUsable, IntegrationUnavailableError } from "./registry";
import { seeded, pick, MALE_FIRST, FEMALE_FIRST, FAMILY } from "./synthetic";

export type IdentityMethod = "NATIONAL_ID" | "IQAMA" | "BIOMETRIC_SIM" | "NUSUK_CARD";

export type IdentityResult = {
  status: "VERIFIED" | "FAILED";
  provider: string;
  fullName?: string;
  sex?: "MALE" | "FEMALE";
  age?: number;
  confidence: number;
  externalRef?: string;
  message: string;
};

/** Contract every identity provider (Nafath, national identity services) must implement. */
export interface IdentityAdapter {
  readonly provider: string;
  readonly mode: "SIMULATED" | "SANDBOX" | "LIVE";
  verify(req: { nationalId: string; method: IdentityMethod; requestedBy: string }): Promise<IdentityResult>;
}

/**
 * MockNafathAdapter — returns SYNTHETIC identities derived deterministically
 * from the entered number. It never contacts Nafath or any government service.
 * IDs ending in 0000 simulate a verification failure.
 */
export class MockNafathAdapter implements IdentityAdapter {
  readonly provider = "Nafath (simulated)";
  readonly mode = "SIMULATED" as const;
  async verify(req: { nationalId: string; method: IdentityMethod }): Promise<IdentityResult> {
    await new Promise((r) => setTimeout(r, 350));
    const id = req.nationalId.replace(/\D/g, "");
    if (!/^[12]\d{9}$/.test(id)) {
      return { status: "FAILED", provider: this.provider, confidence: 0, message: "INVALID_FORMAT" };
    }
    if (id.endsWith("0000")) {
      return { status: "FAILED", provider: this.provider, confidence: 0, message: "NO_MATCH" };
    }
    const rnd = seeded(id);
    const sex = rnd() < 0.55 ? "MALE" : "FEMALE";
    const fullName = `${pick(rnd, sex === "MALE" ? MALE_FIRST : FEMALE_FIRST)} ${pick(rnd, MALE_FIRST)} ${pick(rnd, FAMILY)}`;
    return {
      status: "VERIFIED",
      provider: this.provider,
      fullName,
      sex,
      age: 18 + Math.floor(rnd() * 70),
      confidence: req.method === "BIOMETRIC_SIM" ? 0.99 : 0.96,
      externalRef: `SIM-NFT-${id.slice(-4)}-${Math.floor(rnd() * 1e6).toString().padStart(6, "0")}`,
      message: "SYNTHETIC_MATCH",
    };
  }
}

/**
 * Live Nafath adapter placeholder. A real integration requires official
 * onboarding, signed agreements and credentials — none are present, so this
 * adapter refuses to run instead of pretending to work.
 */
export class NafathAdapter implements IdentityAdapter {
  readonly provider = "Nafath";
  readonly mode = "LIVE" as const;
  async verify(): Promise<IdentityResult> {
    if (!process.env.NAFATH_API_URL || !process.env.NAFATH_CLIENT_ID || !process.env.NAFATH_CLIENT_SECRET) {
      throw new IntegrationUnavailableError("NAFATH", "NOT_CONFIGURED");
    }
    throw new IntegrationUnavailableError("NAFATH", "NOT_CONNECTED");
  }
}

export async function getIdentityAdapter(): Promise<IdentityAdapter> {
  const status = await integrationStatus("NAFATH");
  if (status === "SIMULATED") return new MockNafathAdapter();
  if (isUsable(status)) return new NafathAdapter();
  throw new IntegrationUnavailableError("NAFATH", status);
}
