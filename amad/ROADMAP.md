# AMAD Roadmap

Ordered by technical dependency on the five-stage loop. Each phase must ship working, tested code.

| # | Phase | Status |
|---|---|---|
| 1 | Repository audit & startup | Done — no prior AMAD code existed; built as `amad/` |
| 2 | Architecture & design system | Done (tokens + primitives; see docs/DESIGN_SYSTEM.md) |
| 3 | Database & authentication | Done (register/login/logout/sessions/RBAC/tenancy/audit). Missing: email verification, password reset, invitations, MFA |
| 4 | Command Center | Done (persisted metrics only). Missing: threat-intel panel (needs phase 9) |
| 5 | Defensive simulation engine | Done |
| 6 | Adaptive adversary + Guardian | Done (deterministic planner). Missing: LLM planner behind the guardian |
| 7 | Digital forensics | Done. PDF via browser print; server-side PDF not implemented |
| 8 | Readiness intelligence | Done (individual + basic team aggregation) |
| 9 | **Live threat-intelligence pipeline** | **Next.** CISA KEV / MITRE ATT&CK / NVD ingestion, provenance, dedup, review workflow, scheduled sync |
| 10 | AI scenario generation | Depends on 9: intel → structured extraction → schema-validated `ScenarioDefinition` → guardian validation → human approval → publish (DRAFT/IN_REVIEW statuses already exist) |
| 11 | Recommendations + threat relevance | Engine done; add intel relevance input after 9, and assignment overrides by instructors |
| 12 | Cyber digital twin visual depth | Basic twin done; richer topology, per-asset event drill-down |
| 13 | Counterfactual "What If?" | Engine is deterministic & replayable — implement replay with one substituted decision |
| 14 | Enterprise & university portals | Invitations, teams/cohorts, assignments, scheduling, exports, executive dashboards |
| 15 | Security testing & production prep | Nonce CSP, Redis rate limiting, Docker, CI, health checks, monitoring, external pentest |

Also pending: English UI toggle (Arabic-first UI only today), public pages (solutions, pricing,
demo request, contact), admin panel, email notifications, official logo asset.
