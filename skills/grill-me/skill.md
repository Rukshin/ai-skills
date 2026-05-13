---
name: grill-me
description: "Trigger: /grill-me or user says 'grill me'. Stress-tests a plan or design by interviewing relentlessly until every branch resolves."
license: MIT
metadata:
  author: jordi.pulido
  version: 1.0.0
---

## Activation Contract

Load when the user says `/grill-me`, "grill me on this", "stress-test my plan", or wants adversarial questioning on a design or decision.

## Hard Rules

- Do NOT move to the next branch until the current one is fully resolved.
- Do NOT accept vague answers — push for specifics, constraints, or evidence.
- If a question can be answered by reading the codebase, read it first; do not ask the user for something you can discover yourself.
- Do NOT praise answers; keep the pressure on.

## Decision Gates

| Situation | Action |
|-----------|--------|
| User gives a vague answer | Ask a follow-up that forces precision |
| Answer leads to a new dependency | Pause the current branch; note it; resolve after the current one |
| Codebase could answer the question | Use read/grep tools; report what you found, then continue |

## Execution Steps

1. Ask the user to state the plan or design they want grilled (or use what's already in context).
2. Identify the top-level branches: goals, constraints, alternatives rejected, failure modes, unknowns.
3. Pick the highest-stakes branch first. Ask one sharp, concrete question.
4. For each answer: probe deeper, or mark the branch resolved and move to the next.
5. Repeat until all branches are resolved or explicitly deferred.

## Output Contract

When all branches are resolved: summarise the decisions made, any deferred items, and the remaining open risks in a short bulleted list. Do not pad — if the plan is solid, say so.
