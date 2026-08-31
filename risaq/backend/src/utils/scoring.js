// Scores one submitted lab item against its stored answer key.
// optionScore: 1 if the trainee's classification matches, else 0.
// iocScore: how well the selected indicators-of-compromise match the
// correct set, using precision/recall balance so guessing everything
// scores no better than guessing nothing.
export function scoreItem(item, submission) {
  const optionCorrect = submission.selectedOptionId === item.correctOptionId;

  let iocScore = 1; // items without an IOC checklist don't penalize this half
  if (item.iocOptions?.length) {
    const correctSet = new Set(item.correctIocIds);
    const selected = submission.selectedIocIds || [];
    const selectedSet = new Set(selected);

    if (correctSet.size === 0) {
      // Nothing was actually wrong with this item (e.g. a legitimate email
      // with no real red flags) — correct is to flag nothing; any flag
      // raised here is a false positive.
      iocScore = selected.length === 0 ? 1 : 0;
    } else {
      const truePositives = selected.filter((id) => correctSet.has(id)).length;
      const precision = selected.length ? truePositives / selected.length : 0;
      const recall = truePositives / correctSet.size;

      iocScore = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);
    }
  }

  const hasIocs = Boolean(item.iocOptions?.length);
  const itemScore = hasIocs ? 0.6 * (optionCorrect ? 1 : 0) + 0.4 * iocScore : optionCorrect ? 1 : 0;

  return {
    itemId: item.id,
    selectedOptionId: submission.selectedOptionId,
    optionCorrect,
    selectedIocIds: submission.selectedIocIds || [],
    iocScore: Number(iocScore.toFixed(3)),
    itemScore: Number(itemScore.toFixed(3)),
  };
}

export function scoreAttempt(lab, submissions) {
  const byId = new Map(submissions.map((s) => [s.itemId, s]));
  const itemResults = lab.items.map((item) => {
    const submission = byId.get(item.id) || { selectedOptionId: null, selectedIocIds: [] };
    return scoreItem(item, submission);
  });

  const average = itemResults.reduce((sum, r) => sum + r.itemScore, 0) / (itemResults.length || 1);
  const score = Math.round(average * 100);

  return { itemResults, score };
}
