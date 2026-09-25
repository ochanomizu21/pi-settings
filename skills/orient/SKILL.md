---
name: orient
description: Orient a lost or returning user on a complex project by synthesizing roadmap, issue tracker, recent reports, git state, and the project's own glossary into a plain-language briefing — where we are, what we're doing now, where we're going, and why — with a jargon-to-plain-language table, an honest risk call, and the single next milestone that matters. Use when the user says they feel lost or overwhelmed, asks "where are we / what's the state of this project / what are we doing", returns after a break, onboards, or any time a project's docs, roadmap, and issues have grown dense. Always reconciles claims against reality (git + safe verification) rather than paraphrasing the docs.
disable-model-invocation: true
---

# Orient

Produce a plain-language orientation briefing that lets someone who feels lost
understand a complex project *accurately*, not just *reassuringly*. The defining
trait is **reconciliation**: the briefing does not paraphrase the roadmap. It
checks what issues/commits claim is done against what is actually built,
committed, and passing, and reports any divergence.

Answer in the conversation **and** write a dated markdown briefing to the repo's
reports directory.

## Why this skill exists

As a project's roadmap, glossary, and issue tracker grow dense, the navigation
cost explodes. A user (or returning developer, or new agent) reads five
interlinked docs full of jargon and ends up more lost, not less. The fix is not
more docs — it is a synthesized, plain-language, reality-checked briefing that
translates the jargon, locates the project on its own roadmap, and names the one
next milestone that will produce a real answer.

## Process

### 1. Load the navigation layer

Read the project's own map of itself, in roughly this order. If a file is
missing, skip it rather than guess.

- Agent/contributor operating doc — `AGENTS.md`, `CLAUDE.md`, `CONTRIBUTING.md`.
- Repo/task map — anything named `repo-map`, `ARCHITECTURE`, or a docs index.
- The current roadmap/plan — `roadmap.md`, `ROADMAP.md`, `docs/roadmap*`, a
  `PLAN`/`DECISIONS` log.
- Issue-tracker conventions — e.g. `docs/agents/issue-tracker.md`.
- Domain language / glossary — `CONTEXT.md`, `GLOSSARY.md`, a "ubiquitous
  language" doc. This is the source for the jargon table later.
- README / quick-start.

**If the project has a preset in `references/` (e.g. Nodewise), start there** —
it lists the exact files and the safe commands for that repo. The preset is the
default; the generic process above is the fallback for any other repo.

### 2. Load live state

- Git: `git log --oneline -15`, `git status --short --branch`,
  `git diff --stat`.
- Issue tracker: list open **and** closed issues with labels, and fetch the body
  + dependency/blocker info for the in-flight and the next-unblocked issues.
  Use the issue tracker convention doc for the right CLI (GitHub = `gh`).
- Recent dated reports / ADRs / decision logs — read the most recent 2–4 to see
  what has actually been concluded lately.

### 3. Map the dependency frontier

From issue blockers/dependencies, work out which open issues are **unblocked and
ready** versus **gated**. "What we're doing now" must reflect this, not just the
top of the issue list. The current milestone is the lowest-numbered (or
roadmap-ordered) open issue that is unblocked.

### 4. Reconcile claims vs. reality — the crucial step

This is what separates a trustworthy briefing from a doc summary.

- Run the project's **safe, data-free verification** (Nodewise: `make check`).
  Never run anything destructive or that starts services, DBs, network imports,
  or long jobs. If the only checks are data-dependent, skip this and say so.
- If a specific issue is in flight, run its **narrowest** test/build target
  (Nodewise: `make test-<area>`), not the whole suite.
- Then **compare**:
  - issues/commits that say "done" vs. what the build/tests actually show;
  - work that is built and passing but **uncommitted** vs. committed;
  - work committed to a branch but **not merged**;
  - docs that describe a state the code has not reached.
- State each divergence explicitly in the briefing
  (e.g. *"issue #8 is built and its tests pass, but it is uncommitted and the
  issue is still open"*). This is the highest-value finding the skill produces.

### 5. If you can't find a core source, ask

If after step 1 you genuinely cannot locate the roadmap, the glossary, or the
issue tracker, **ask the user where they live** before synthesizing. Do not
invent an orientation around guessed sources. One short question beats a
confidently wrong briefing.

### 6. Synthesize the briefing

Plain language throughout: short sentences, translate every domain term on first
use, no hype. Use the project's own glossary to seed the jargon table. The seven
canonical sections (default: all present) are:

1. **The short version** — one paragraph, no jargon, that a non-expert could
   repeat back. If they read nothing else, they read this.
2. **Where we currently are** — foundation status mapped onto the project's own
   phases/stages. Distinguish built vs. in-flight vs. not-started. Include the
   reality-check from step 4.
3. **What we're doing now** — the in-flight issue(s) and the next-unblocked work,
   in plain terms. Explain *what question the work is trying to answer*, not
   just the task title.
4. **Where we're going** — the intended product/output, including what it will
   and will **not** claim. Keep the project's honesty boundaries (e.g.
   "screening, not prediction"; "provisional, not released").
5. **Why** — why the approach/roadmap is what it is, including what changed from
   any earlier/simpler plan and what problem forced the change.
6. **Jargon → plain-language table** — every loaded domain term, defined in one
   plain line, with what it is *not*. Pull definitions from the glossary; do not
   invent.
7. **Candid risk / honest assessment** — the unvarnished status call, including
   the risk the project itself is most exposed to (e.g. over-engineering,
   research drift, never returning to a real decision). This section is the one
   place to be blunt.

End with a one-line **single next milestone that matters** — the concrete thing
that should produce a real answer or decision next, not another layer of
scaffolding.

### 7. Write it down

- Answer in the conversation (full briefing).
- Also write a dated file to the repo's reports directory. Discover it from the
  preset or the existing convention:
  - Nodewise: `docs/reports/orientation-YYYY-MM-DD.md` (today's date).
  - Generic: wherever the repo already keeps dated reports (`docs/reports/`,
    `decisions/`, `notes/`); if none, use `.scratch/orientation-YYYY-MM-DD.md`
    and say where you put it.
- The file is a snapshot, not a living doc. A later orientation run writes a new
  dated file rather than editing an old one.

## Honesty rules (do not break)

- **Claimed ≠ done.** Always separate what is *described* from what is *built,
  committed, and passing*.
- **Provisional ≠ released.** Never present research/provisional output as a
  validated, customer-facing result. Preserve the project's own release gates.
- **Don't collapse distinctions the methodology keeps separate.** If the project
  separates import from export, or public-baseline from enriched results, or
  observed from inferred from proxy evidence, the briefing keeps them separate
  too.
- **"Insufficient evidence" is a valid answer.** If the data does not support a
  confident status call, say so. Do not spin a clean story to feel productive.
- **No invented certainty.** Never assert available capacity, a guaranteed
  outcome, a probability, a cost, or a date the sources do not actually support.

## Tone

The user came in feeling lost because density increased. Reward them with
clarity, not more density. Short sentences. Translate first, abbreviate never.
The jargon table exists so the rest of the briefing can stay plain.

## Reference

- [`references/nodewise-preset.md`](references/nodewise-preset.md) — exact
  files, safe commands, phase map, domain separation, and a jargon seed for the
  Nodewise repo. Load this when working in Nodewise.
