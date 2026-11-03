import { describe, expect, it } from "vitest";
import { parseVoice } from "@/lib/engines/voice";

describe("voice documentation parser", () => {
  it("reads an Arabic heat-stroke dictation", () => {
    const v = parseVoice("حاج سقط تحت الشمس مشوش الوعي حرارته 40.8 النبض 124 الأكسجين 94 الضغط 96 على 58 التنفس 26 جلاسكو 12");
    expect(v).toEqual({ temp: 40.8, hr: 124, spo2: 94, sys: 96, dia: 58, rr: 26, gcs: 12 });
  });
  it("handles Arabic-Indic digits, spoken decimals and slash pressure", () => {
    expect(parseVoice("درجة الحرارة ٤١٫٢ وضغطه ١٠٠/٦٠")).toEqual({ temp: 41.2, sys: 100, dia: 60 });
    expect(parseVoice("حرارة 40 فاصلة 5")).toEqual({ temp: 40.5 });
  });
  it("reads English", () => {
    expect(parseVoice("Pulse 118, BP 96 over 60, sats 89%, resp rate 24, GCS 14, sugar 210")).toEqual({ hr: 118, sys: 96, dia: 60, spo2: 89, rr: 24, gcs: 14, glu: 210 });
  });
  it("never assigns a number across another keyword or outside a plausible range", () => {
    expect(parseVoice("مشوش الوعي حرارته 40")).toEqual({ temp: 40 });
    expect(parseVoice("الوعي 40")).toEqual({});
    expect(parseVoice("الحرارة 408")).toEqual({});
    expect(parseVoice("الضغط 60 على 90")).toEqual({});
  });
  it("leaves fields empty when nothing is dictated", () => {
    expect(parseVoice("المريض يشتكي من دوخة")).toEqual({});
  });
});
