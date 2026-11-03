/**
 * Voice documentation parser — turns a paramedic's dictation (Arabic or English)
 * into vital-sign values for REVIEW. Nothing is sent automatically: the parsed
 * values pre-fill a form that the paramedic checks, edits and confirms.
 *
 * Rules: a value is taken only if it follows a vital keyword (e.g. "حرارته 40.8",
 * "النبض 124", "ضغط 96 على 58", "sats 94") before the next keyword, and only if it
 * falls in a plausible range. Anything uncertain is left empty rather than guessed.
 */
export const VOICE_PARSER_VERSION = "voice-1.0";

export type VoiceVitals = Partial<Record<"hr" | "sys" | "dia" | "spo2" | "rr" | "temp" | "gcs" | "glu", number>>;
type Kind = "temp" | "hr" | "spo2" | "rr" | "gcs" | "glu" | "bp";

const STEMS: Record<Kind, string[]> = {
  temp: ["حرار", "temp", "fever"],
  hr: ["نبض", "ضربات", "pulse", "heart", "hr"],
  spo2: ["اكسج", "تشبع", "اوكسج", "spo2", "sat", "sats", "saturation", "oxygen", "o2"],
  rr: ["تنفس", "resp", "respiratory", "rr", "breathing"],
  gcs: ["غلاسك", "جلاسك", "وعي", "gcs", "glasgow"],
  glu: ["سكر", "جلوكوز", "غلوكوز", "glucose", "sugar", "bgl"],
  bp: ["ضغط", "bp", "pressure"],
};
// Short English stems must match the whole token, to avoid "hr" matching "three".
const EXACT = new Set(["hr", "rr", "bp", "o2", "sat", "sats", "gcs", "bgl"]);

const RANGE: Record<Exclude<Kind, "bp">, [number, number]> = {
  temp: [30, 44],
  hr: [20, 250],
  spo2: [50, 100],
  rr: [4, 70],
  gcs: [3, 15],
  glu: [20, 900],
};
const DECIMAL = new Set(["فاصله", "فاصل", "point", "dot"]);
const OVER = new Set(["/", "علي", "over", "على"]);

export function normalize(text: string): string {
  return text
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/٫/g, ".")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[ً-ْـ]/g, "") // tashkeel + tatweel
    .toLowerCase()
    .replace(/(\d)\s*\/\s*(\d)/g, "$1/$2")
    .replace(/[^\p{L}\p{N}./]+/gu, " ")
    .replace(/(?<!\d)\.|\.(?!\d)/g, " ")
    .trim();
}

function kindOf(token: string): Kind | null {
  const bare = token.replace(/^(و|ف|ب|ل)?(ال)?/, "");
  for (const [kind, stems] of Object.entries(STEMS) as [Kind, string[]][]) {
    for (const s of stems) {
      if (EXACT.has(s) ? token === s : token.startsWith(s) || bare.startsWith(s)) return kind;
    }
  }
  return null;
}

const isNum = (t: string) => /^\d+(\.\d+)?$/.test(t);

export function parseVoice(text: string): VoiceVitals {
  const tokens = normalize(text).split(/\s+/).filter(Boolean);
  const kinds = tokens.map(kindOf);
  const out: VoiceVitals = {};
  for (let i = 0; i < tokens.length; i++) {
    const kind = kinds[i];
    if (!kind) continue;
    for (let j = i + 1; j < tokens.length && j - i <= 5 && !kinds[j]; j++) {
      const tok = tokens[j];
      if (kind === "bp") {
        const slash = tok.match(/^(\d{2,3})\/(\d{2,3})$/);
        let sys: number | null = null;
        let dia: number | null = null;
        if (slash) [sys, dia] = [Number(slash[1]), Number(slash[2])];
        else if (isNum(tok) && OVER.has(tokens[j + 1] ?? "") && isNum(tokens[j + 2] ?? "")) [sys, dia] = [Number(tok), Number(tokens[j + 2])];
        if (sys != null && dia != null) {
          if (sys >= 40 && sys <= 260 && dia >= 20 && dia <= 160 && dia < sys) Object.assign(out, { sys, dia });
          break;
        }
        if (isNum(tok)) break;
        continue;
      }
      if (!isNum(tok)) continue;
      let value = Number(tok);
      if (DECIMAL.has(tokens[j + 1] ?? "") && /^\d$/.test(tokens[j + 2] ?? "")) value = Number(`${tok}.${tokens[j + 2]}`);
      const [lo, hi] = RANGE[kind];
      if (value >= lo && value <= hi) out[kind] = value; // later readings overwrite earlier ones
      break;
    }
  }
  return out;
}

