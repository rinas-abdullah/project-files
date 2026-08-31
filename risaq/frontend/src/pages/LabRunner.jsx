import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { apiFetch } from "../api/client.js";

function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

export default function LabRunner() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [lab, setLab] = useState(null);
  const [error, setError] = useState(null);
  const [phase, setPhase] = useState("loading"); // loading | intro | running | submitting | result
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // itemId -> { selectedOptionId, selectedIocIds: [] }
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [result, setResult] = useState(null);
  const startedAtRef = useRef(null);
  const submittedRef = useRef(false);

  useEffect(() => {
    setPhase("loading");
    apiFetch(`/labs/${slug}`)
      .then((data) => {
        setLab(data.lab);
        setSecondsLeft(data.lab.timeLimitSeconds);
        setPhase("intro");
      })
      .catch((err) => setError(err.message));
  }, [slug]);

  const submissions = useMemo(
    () =>
      lab
        ? lab.items.map((item) => ({
            itemId: item.id,
            selectedOptionId: answers[item.id]?.selectedOptionId || null,
            selectedIocIds: answers[item.id]?.selectedIocIds || [],
          }))
        : [],
    [lab, answers]
  );

  const submit = async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setPhase("submitting");
    try {
      const data = await apiFetch(`/labs/${slug}/submit`, {
        method: "POST",
        body: { startedAt: startedAtRef.current, submissions },
      });
      setResult(data.result);
      setPhase("result");
    } catch (err) {
      setError(err.message);
      setPhase("running");
      submittedRef.current = false;
    }
  };

  useEffect(() => {
    if (phase !== "running") return;
    if (secondsLeft <= 0) {
      submit();
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, secondsLeft]);

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-risaq-danger mb-4">{error}</p>
        <Link to="/labs" className="btn-secondary">
          العودة للمختبرات
        </Link>
      </div>
    );
  }

  if (phase === "loading" || !lab) {
    return <div className="text-center py-16 text-risaq-muted">جارِ تحميل المختبر...</div>;
  }

  if (phase === "intro") {
    return (
      <div className="max-w-2xl mx-auto card p-8 text-center space-y-5">
        <h1 className="text-2xl font-bold">{lab.titleAr}</h1>
        <p className="text-risaq-muted">{lab.descriptionAr}</p>
        <div className="flex justify-center gap-6 text-sm text-risaq-muted">
          <span>⏱️ {Math.round(lab.timeLimitSeconds / 60)} دقائق</span>
          <span>🧩 {lab.items.length} سيناريوهات</span>
          <span>🎯 صعوبة {lab.difficulty}/5</span>
        </div>
        <button
          className="btn-primary px-10"
          onClick={() => {
            startedAtRef.current = new Date().toISOString();
            setPhase("running");
          }}
        >
          ابدأ المختبر
        </button>
      </div>
    );
  }

  if (phase === "result" && result) {
    return <LabResult lab={lab} result={result} onExit={() => navigate("/labs")} />;
  }

  const item = lab.items[currentIndex];
  const current = answers[item.id] || { selectedOptionId: null, selectedIocIds: [] };
  const isLast = currentIndex === lab.items.length - 1;
  const canProceed = Boolean(current.selectedOptionId);

  const setOption = (optionId) => {
    setAnswers((prev) => ({ ...prev, [item.id]: { ...current, selectedOptionId: optionId } }));
  };

  const toggleIoc = (iocId) => {
    setAnswers((prev) => {
      const set = new Set(current.selectedIocIds);
      set.has(iocId) ? set.delete(iocId) : set.add(iocId);
      return { ...prev, [item.id]: { ...current, selectedIocIds: [...set] } };
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div className="text-sm text-risaq-muted">
          سيناريو {currentIndex + 1} من {lab.items.length}
        </div>
        <div
          className={`font-mono font-bold px-3 py-1 rounded-lg ${
            secondsLeft <= 30 ? "text-risaq-danger bg-risaq-danger/10" : "text-risaq-primary bg-risaq-primary/10"
          }`}
        >
          ⏱️ {formatTime(secondsLeft)}
        </div>
      </div>

      <div className="w-full h-1.5 bg-risaq-border rounded-full overflow-hidden">
        <div
          className="h-full bg-risaq-primary transition-all"
          style={{ width: `${((currentIndex + 1) / lab.items.length) * 100}%` }}
        />
      </div>

      <div className="card p-6 space-y-5">
        <h2 className="text-lg font-bold">{item.titleAr}</h2>

        {item.facts?.length > 0 && (
          <div className="bg-risaq-bg/60 border border-risaq-border rounded-xl p-4 text-sm space-y-1.5" dir="auto">
            {item.facts.map((f, i) => (
              <div key={i} className="flex flex-wrap gap-2">
                <span className="text-risaq-muted shrink-0">{f.labelAr}:</span>
                <span className="font-mono break-all">{f.value}</span>
              </div>
            ))}
          </div>
        )}

        <p className="text-sm text-risaq-text/90 leading-relaxed">{item.bodyAr}</p>

        <div>
          <div className="text-xs font-bold text-risaq-muted mb-2">التصنيف</div>
          <div className="grid grid-cols-2 gap-3">
            {item.options.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setOption(opt.id)}
                className={`py-3 rounded-xl border text-sm font-bold transition ${
                  current.selectedOptionId === opt.id
                    ? "border-risaq-primary bg-risaq-primary/10 text-risaq-primary"
                    : "border-risaq-border bg-risaq-panel2 text-risaq-muted hover:text-risaq-text"
                }`}
              >
                {opt.labelAr}
              </button>
            ))}
          </div>
        </div>

        {item.iocOptions?.length > 0 && (
          <div>
            <div className="text-xs font-bold text-risaq-muted mb-2">حدّد المؤشرات (IOCs) التي اعتمدت عليها</div>
            <div className="grid sm:grid-cols-2 gap-2">
              {item.iocOptions.map((ioc) => {
                const checked = current.selectedIocIds.includes(ioc.id);
                return (
                  <label
                    key={ioc.id}
                    className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg border cursor-pointer transition ${
                      checked ? "border-risaq-accent bg-risaq-accent/10" : "border-risaq-border bg-risaq-panel2"
                    }`}
                  >
                    <input type="checkbox" checked={checked} onChange={() => toggleIoc(ioc.id)} className="accent-risaq-accent" />
                    {ioc.labelAr}
                  </label>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between">
        <button
          className="btn-secondary"
          disabled={currentIndex === 0}
          onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
        >
          السابق
        </button>
        {isLast ? (
          <button className="btn-primary" disabled={!canProceed || phase === "submitting"} onClick={submit}>
            {phase === "submitting" ? "جارِ التقييم..." : "إنهاء المختبر"}
          </button>
        ) : (
          <button className="btn-primary" disabled={!canProceed} onClick={() => setCurrentIndex((i) => i + 1)}>
            التالي
          </button>
        )}
      </div>
    </div>
  );
}

function LabResult({ lab, result, onExit }) {
  const itemsById = Object.fromEntries(lab.items.map((i) => [i.id, i]));

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="card p-8 text-center space-y-3">
        <div className="text-5xl font-bold text-risaq-primary2">{result.score}%</div>
        <div className="text-risaq-muted">درجتك في {lab.titleAr}</div>
        <div className="flex justify-center gap-6 text-sm pt-2">
          <span>🎯 +{result.pointsAwarded} نقطة</span>
          <span>⏱️ {formatTime(result.timeTakenSeconds)}</span>
        </div>

        {result.newBadges?.length > 0 && (
          <div className="pt-4 flex flex-wrap justify-center gap-3">
            {result.newBadges.map((b) => (
              <div key={b.code} className="bg-risaq-primary/10 border border-risaq-primary/30 rounded-xl px-4 py-2 text-sm">
                {b.icon} شارة جديدة: <span className="font-bold">{b.nameAr}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <h2 className="font-bold">مراجعة السيناريوهات</h2>
        {result.itemResults.map((r) => {
          const item = itemsById[r.itemId];
          const correctOpt = item.options.find((o) => o.id === r.correctOptionId);
          const userOpt = item.options.find((o) => o.id === r.selectedOptionId);
          return (
            <div key={r.itemId} className="card p-5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-bold text-sm">{item.titleAr}</div>
                <span className={`text-xs font-bold ${r.optionCorrect ? "text-risaq-primary2" : "text-risaq-danger"}`}>
                  {r.optionCorrect ? "إجابة صحيحة ✓" : "إجابة غير صحيحة ✕"}
                </span>
              </div>
              <div className="text-xs text-risaq-muted">
                إجابتك: <span className="font-bold text-risaq-text">{userOpt?.labelAr || "—"}</span>
                {!r.optionCorrect && (
                  <>
                    {" "}
                    · الصحيح: <span className="font-bold text-risaq-primary2">{correctOpt?.labelAr}</span>
                  </>
                )}
              </div>
              <p className="text-xs text-risaq-muted leading-relaxed pt-1 border-t border-risaq-border/60">
                {r.explanationAr}
              </p>
            </div>
          );
        })}
      </div>

      <div className="flex justify-center gap-3">
        <button className="btn-secondary" onClick={onExit}>
          العودة للمختبرات
        </button>
        <Link to="/reports" className="btn-primary">
          عرض تقرير الجاهزية
        </Link>
      </div>
    </div>
  );
}
