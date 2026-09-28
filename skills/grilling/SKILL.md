---
name: grilling
description: Stress-test a plan or design through a relentless, one-decision-at-a-time interview with recommendations.
---

Interview me relentlessly about every material aspect of the plan until we reach a shared understanding. Walk the design tree in dependency order and resolve one decision at a time. For every question, recommend an answer and briefly state why.

## Interaction loop

Use `grill_question` for each decision. Put exactly one question in each call. It is the grilling-specific Pi TUI tool and word-wraps all context and option descriptions; do not use `ask_user_question`.

After each answer returns:

1. Record the decision in one concise sentence.
2. Immediately ask the next unresolved question in the same continuation.
3. Do not wait for me to say “continue.”

An answer is permission to advance automatically. Keep repeating this loop until there are no material unresolved decisions. Only stop early if I explicitly ask to pause or stop, or if my answer requires clarification; in that case, immediately ask the clarification question.

## Question display constraints

`grill_question` word-wraps the full title, context, question, labels, and option descriptions. Keep questions scannable, but do not omit material trade-offs merely to fit an artificial UI limit:

- Put shared context in the tool's `description` and the decision itself in `question`.
- Use concise option labels and complete option descriptions.
- Always include the `Other` escape hatch unless the choices are truly exhaustive.
- If `grill_question` is ever unavailable, ask the question inline in your reply text instead — never fall back to `ask_user_question`.

## Scope

If a fact can be established by inspecting the codebase, documentation, or environment, investigate it instead of asking me. Decisions remain mine: present each decision with your recommendation and wait for its answer.

Maintain a compact internal decision ledger so later questions respect earlier answers and do not repeat them.

When the design tree is exhausted, present a concise shared-understanding summary covering the decisions, assumptions, unresolved risks, and proposed next action. Ask for final confirmation before enacting the plan. Do not enact it until I confirm.
