import { z } from "zod";

export const InvestigationSubmissionSchema = z.object({
  entryAsset: z.string().min(1).max(64),
  entryTechnique: z.string().min(1).max(32),
  affectedAssets: z.array(z.string().max(64)).max(20),
  compromisedIdentities: z.array(z.string().max(64)).max(20),
  sequence: z.array(z.string().max(32)).max(20),
  evidenceKeys: z.array(z.string().max(128)).max(50),
  summary: z.string().trim().min(20, "اكتب ملخصًا لا يقل عن 20 حرفًا").max(4000),
});
export type InvestigationSubmission = z.infer<typeof InvestigationSubmissionSchema>;

export interface GroundTruth {
  entryAsset: string | null;
  entryTechnique: string | null;
  sequence: string[];
  compromisedAssets: string[];
  compromisedIdentities: string[];
  entryEvidenceKeys: string[];
  maliciousEvidenceKeys: string[];
}

export interface InvestigationScore {
  entry: number;
  assets: number;
  identities: number;
  sequence: number;
  evidence: number;
  total: number;
  detail: {
    missedAssets: string[];
    wrongAssets: string[];
    missedIdentities: string[];
    wrongIdentities: string[];
    citedMalicious: number;
    citedTotal: number;
    citedEntryEvidence: boolean;
    truth: GroundTruth;
  };
}

export const INVESTIGATION_WEIGHTS = { entry: 0.2, assets: 0.2, identities: 0.15, sequence: 0.25, evidence: 0.2 } as const;

export function f1(predicted: string[], truth: string[]): number {
  const p = new Set(predicted);
  const t = new Set(truth);
  if (p.size === 0 && t.size === 0) return 1;
  if (p.size === 0 || t.size === 0) return 0;
  let tp = 0;
  for (const x of p) if (t.has(x)) tp++;
  if (tp === 0) return 0;
  const precision = tp / p.size;
  const recall = tp / t.size;
  return (2 * precision * recall) / (precision + recall);
}

export function lcsLength(a: string[], b: string[]): number {
  const dp = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++) dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
  return dp[a.length][b.length];
}

const round3 = (n: number) => Math.round(n * 1000) / 1000;

export function scoreInvestigation(sub: InvestigationSubmission, truth: GroundTruth, availableEvidence: string[]): InvestigationScore {
  const entry = (sub.entryAsset === truth.entryAsset ? 0.5 : 0) + (sub.entryTechnique === truth.entryTechnique ? 0.5 : 0);
  const assets = f1(sub.affectedAssets, truth.compromisedAssets);
  const identities = f1(sub.compromisedIdentities, truth.compromisedIdentities);
  const sequence = truth.sequence.length === 0 ? 1 : lcsLength(sub.sequence, truth.sequence) / Math.max(truth.sequence.length, sub.sequence.length);
  // Only evidence the investigator actually had access to may be cited.
  const cited = [...new Set(sub.evidenceKeys)].filter((k) => availableEvidence.includes(k));
  const malicious = cited.filter((k) => truth.maliciousEvidenceKeys.includes(k));
  const citedEntry = cited.some((k) => truth.entryEvidenceKeys.includes(k));
  const evidence = cited.length === 0 ? 0 : 0.6 * (malicious.length / cited.length) + 0.4 * (citedEntry ? 1 : 0);
  const w = INVESTIGATION_WEIGHTS;
  const total = w.entry * entry + w.assets * assets + w.identities * identities + w.sequence * sequence + w.evidence * evidence;
  return {
    entry: round3(entry),
    assets: round3(assets),
    identities: round3(identities),
    sequence: round3(sequence),
    evidence: round3(evidence),
    total: round3(total),
    detail: {
      missedAssets: truth.compromisedAssets.filter((a) => !sub.affectedAssets.includes(a)),
      wrongAssets: sub.affectedAssets.filter((a) => !truth.compromisedAssets.includes(a)),
      missedIdentities: truth.compromisedIdentities.filter((a) => !sub.compromisedIdentities.includes(a)),
      wrongIdentities: sub.compromisedIdentities.filter((a) => !truth.compromisedIdentities.includes(a)),
      citedMalicious: malicious.length,
      citedTotal: cited.length,
      citedEntryEvidence: citedEntry,
      truth,
    },
  };
}
