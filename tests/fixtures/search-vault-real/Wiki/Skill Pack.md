---
up: ["[[index]]"]
related: ["[[Pocock vs pstack vs Osmani (video)]]", "[[Addy Osmani]]", "[[Matt Pocock]]", "[[Grilling]]", "[[Home Repo]]", "[[Doubt-Driven Development]]", "[[Anti-Rationalization Table]]"]
created: 2026-11-24
modified: 2026-11-24
sources: ["https://www.youtube.com/watch?v=sU9MW8Ycq2M&t=638s"]
tags: [wiki/concept]
---

# Skill Pack

## Core idea

A skill pack is a bundle of skill files (agent instructions in markdown) that encodes how an experienced engineer works, so an agent can follow it. Packs overlap heavily because engineers converge on how to build software, so choose by the question you need answered, not by brand.

## Three packs compared

| Pack | Question it asks | Shape |
|---|---|---|
| [[Matt Pocock]]'s skills | Do we agree on what we are building? | Small, composable, anti-framework; effort goes up front (`grill-me`, glossary, ADRs, specs, tickets). See [[Grilling]]. |
| pstack (Lauren Tan, Cursor) | Can you prove it works? | No planning skills; weight on investigation, verification and multimodal review; swarms and arenas. |
| [[Addy Osmani]]'s agent-skills | Did we follow the whole process? | Full lifecycle Define to Ship, 25 skills, 4 reviewer personas; team-friendly and portable (about 70 agents). |

## When to reach for each

- Pocock: the problem is fuzzy, or the codebase will live for years and design matters. `grill-me` is the first skill to install.
- Osmani: a team ships to production and wants a predictable, recognizable process and quality gates without designing them.
- pstack: gnarly work such as an unreproducible bug, a migration, long-running or overnight agents, especially in Cursor.

## Match ceremony to stakes

More skills do not make a smarter agent: every installed skill is something the agent has to consider, and long skill files bloat the context. Prune your `AGENTS.md` and skills as models improve. Small tweak: do it and check. Small feature: quick grill and TDD. Big or fuzzy feature: spec and phased plan, verifying each phase. Production or irreversible change: full review, [[Doubt-Driven Development]] and security hardening. A shared pack can live in a [[Home Repo]].

## Contradictions
_none_

Source: [[Pocock vs pstack vs Osmani (video)]]
