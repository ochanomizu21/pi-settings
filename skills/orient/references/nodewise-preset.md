# Nodewise preset for `orient`

This is the worked default when orienting inside the Nodewise repo
(`/home/ochanomizu/nodewise`). The generic process in `SKILL.md` always applies;
this file gives the exact files, commands, and conventions so the skill just
works here.

## Read order (step 1)

Read these, in order, to load the navigation layer:

1. `AGENTS.md` — operating rules, safe commands, task routing.
2. `docs/repo-map.md` — task → file/data-flow/API map.
3. `roadmap.md` — the current **evidence-led BESS investigation roadmap**. This
   is the canonical plan. (The older `docs/roadmap-mvp-daten-pipelines-modelle.md`
   is historical context only — do not treat it as binding.)
4. `CONTEXT.md` — the **domain glossary**. Seed the jargon table from here.
5. `docs/agents/issue-tracker.md` — issues live as GitHub issues; use `gh`.
6. `README.md` — quick start, prerequisites, make targets.
7. The most recent files in `docs/reports/*.md` — dated, what was actually
   concluded lately. Read the 2–3 newest.

Optional for depth: `docs/geschaeftsidee-nodewise-grid-connection-intelligence.md`
(business framing), `docs/adr/*` (accepted methodology decisions).

## Commands (step 4 — reconciliation)

- `make help` — command index; confirms the project's stable surface.
- `make check` — **safe, data-free** syntax/manifest checks. Always run this.
- `make test-<area>` — the **narrow** test for the in-flight issue. Examples:
  `make test-evidence-regime-audit`, `make test-matched-candidate-controls`,
  `make test-physical-bess-sites`, `make test-mastr-connection-evidence`.
- **Never** run `make map`, `make db-start`, `make osm-germany`,
  `make mastr-import`, or anything data/network/DB-dependent during orientation.
  Those are not safe.

## Live state (step 2)

- Git: `git log --oneline -15`, `git status --short --branch`, `git diff --stat`.
- Issues (GitHub): `gh issue list --state open` and `--state closed`; for the
  in-flight and next issues, `gh issue view <n> --comments`.
- Dependencies: `gh api repos/{owner}/{repo}/issues?state=open` and read
  `issue_dependencies_summary.blocked_by` to find what's gated vs. unblocked.

The frontier is: the lowest open issue that is **unblocked**. Issues are
sequentially numbered (#1 → #N) and build on each other.

## Phase map (for "where we are")

The roadmap (`roadmap.md` §14) runs A → G:

- **Phase A** — Reproducible source foundation (MaStR atomic snapshots, source
  pinning, coverage audits).
- **Phase B** — Physical sites, controls, analysis scaffolding.
- **Phase C** — Grid vertical slice (the linked H001/H011 proximity package,
  H002, H007).
- **Phase D** — Grid external validation (VNB labels).
- **Phase E** — Site feasibility provisional program.
- **Phase F** — Methodology spec + released slices.
- **Phase G** — Real portfolios + outcome learning.

As of the last orientation, A was substantially complete and B nearly so; C had
not yet produced a substantive answer. Re-verify against git/issues each run.

## Domain separation (keep these distinct in the briefing)

The repo keeps four data domains plus the methodology domain deliberately
separate. Do not blur them:

- `grid.*` — physical OSM grid assets.
- `mast.*` — registered MaStR units (legacy exploratory helpers).
- `boundaries.*` — BKG VG250 admin polygons.
- `vnb.*` — DSO service areas.
- `analysis.*` — **immutable, versioned methodology** (Assessment Runs, sites,
  controls, audits). This is where released evidence lives.

Also keep these boundaries honest (they are the project's whole point):

- **Provisional vs. released.** Most outputs are Provisional Priority until a
  Validated Slice passes its external-validation gate.
- **Legacy helpers vs. methodology v0.1.** `grid.*`/`mast.*` helpers are legacy
  map inputs, not v0.1 evidence (they carry a hardcoded 20–50 MW heuristic,
  additive confidence, mutable date windows — flagged in `roadmap.md` §12).
- **observed vs. inferred vs. proxy** evidence class.
- **import vs. export** direction (a symmetric BESS still assesses each
  direction separately; the weaker caps the result).
- **public baseline vs. evidence-enriched** rank.

## What the product will NOT claim (honesty guardrails)

The roadmap (`§16`) is explicit. Nodewise does not claim available MW,
connection probability, an offered connection point, cost/timing, planning
approval, bankability/revenue, queue position, nationwide comparability from one
VNB, or historical predictive accuracy from present-day data. The briefing must
not imply any of these either.

## Jargon seed

Seed the jargon table from `CONTEXT.md`. Plain one-liners to start from:

| Term | Plain meaning |
| --- | --- |
| Source Snapshot | A frozen, checked copy of one dataset. |
| Physical BESS Site | One real battery project, possibly several registry rows. |
| Matched Candidate Control | A similar location used for a fair comparison — not a failed project. |
| Pseudo-candidate Eligibility Frame | The pool of plausible comparison locations, built without the grid feature under study. |
| Evidence Regime | A region where the data is comparable enough to rank within. |
| Voltage Scenario | One explicit voltage assumption — alternatives stay separate, never averaged. |
| Assessment Run | A sealed, reproducible analysis bound to exact sources/code. |
| Plausible Connection Asset | A substation worth investigating — not an offered connection point. |
| Registered Connection Level | MaStR's recorded voltage level for a site — observed registry evidence only, not capacity or direction. |
| Evidence Class | observed / inferred / proxy — limits how strong a conclusion the evidence supports. |
| Validated Slice | One narrow (profile × voltage × direction × regime) combination that passed its release gate. |
| Provisional Priority | A research result that has not passed the release gate — visibly distinct from released. |

Expand this from `CONTEXT.md` each run; don't treat the table above as complete.
