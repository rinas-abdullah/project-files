# Readiness methodology — readiness-v1

Implemented in `src/domain/readiness/scoring.ts`; explained in-app at `/app/methodology`.
Scores describe performance **inside AMAD simulations**. They are not validated predictors of
real-world incident performance; no empirical validation study has been done.

Overall = mean(Speed, Accuracy, Independence, Completeness) × 100.

- **Speed** — contained: `0.6·(1 − endMinute/timeBudget) + 0.4·(1 − objective/100)`; otherwise `0.25·(1 − objective/100)`.
- **Accuracy** — `0.6·(effective containment actions / all containment actions) + 0.4·investigationTotal − 0.1·falseContainmentClaims`, clamped to [0,1]. A containment action is effective when it targets a genuinely malicious entity (compromised asset/identity, malicious process, adversary infrastructure IP — pre-emptive blocks count).
- **Independence** — `1 − 0.2·hintsUsed`.
- **Completeness** — `0.4·contained + 0.3·(imaged compromised assets / compromised assets) + 0.3·mean(assetsF1, identitiesF1, sequenceLCS)`.

Investigation total = 0.2 entry + 0.2 assets F1 + 0.15 identities F1 + 0.25 sequence (LCS ratio) + 0.2 evidence
(0.6 precision of cited evidence + 0.4 if the entry-point evidence is cited; only evidence actually acquired can be cited).

Competency scores per session: investigative commands → share that surfaced adversary evidence (×2, capped at 1);
containment commands → effective share; evidence-handling → preservation ratio; incident-coordination →
1 if contained (0.2 otherwise) − 0.25 per false claim; incident-reconstruction → investigation total.
Profile levels update by EMA (first sample sets the level; afterwards α = 0.4).

Every `ReadinessScore` row stores each dimension's formula and inputs plus per-competency scores.
