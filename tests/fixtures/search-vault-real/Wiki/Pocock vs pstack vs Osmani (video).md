---
up: ["Skill Pack"]
related: ["Skill Pack", "Addy Osmani", "Matt Pocock", "Doubt-Driven Development", "Anti-Rationalization Table", "Grilling"]
created: 2026-11-24
modified: 2026-11-24
sources: ["https://www.youtube.com/watch?v=sU9MW8Ycq2M&t=638s"]
tags: [wiki/source]
---

# Pocock vs pstack vs Osmani (video)
Rob Shocks (Switch Dimension). 2026-10-07. [Original](https://www.youtube.com/watch?v=sU9MW8Ycq2M&t=638s)

## Summary

A video comparing the three best-known skill packs for AI coding agents: Addy Osmani's `agent-skills` (over 100K GitHub stars), pstack by Lauren Tan at Cursor, and Matt Pocock's skills. The author explains what each is for, when to reach for each, and argues you do not need all of them on every project. The transcript is automatic and has name errors (Loren/Lauren Tan, Adi, Audia Imani); names are normalized here and the exact spelling of Lauren Tan is unverified.

## Key claims

- Each pack answers a different question: Pocock, "do we agree on what we are building?"; pstack, "can you prove it works?"; Osmani, "did we follow the whole process?". See Skill Pack.
- Osmani's pack follows the full software lifecycle (Define, Plan, Build, Verify, Review, Ship) with 25 skills and 4 reviewer personas (staff engineer, test engineer, security auditor, web performance auditor). It is the only one of the three that covers CI/CD, observability and deprecation, and it installs into about 70 agents.
- Every Osmani skill carries an Anti-Rationalization Table: the excuses an agent makes to skip a step, with a rebuttal next to each.
- `/build auto` lets you approve the plan once and runs every task autonomously, but verification stays. Doubt-Driven Development spins up a fresh-context reviewer whose only job is to doubt a claim.
- Pocock's skills are small, composable and openly "anti-framework"; his most popular skill is `grill-me` (see Grilling). pstack deliberately has no planning skills ("the best spec is the code") and puts the weight on investigation, verification and multimodal review.
- You do not need all of them: too many or too long skills bloat and confuse the context window and may auto-trigger by accident. Ceremony should match the stakes: a small tweak, just do it and check; a small feature, a quick grill and TDD; something big or fuzzy, spec and plan in phases; production or irreversible changes, full review, doubt-driven development and security hardening.
- The skills are old engineering ideas (TDD, thin vertical slices, recording why you decided, Chesterton's fence, Hyrum's law, the Beyonce rule) in a format an agent can follow. Treat them like an O'Reilly textbook, adapt them, and update a skill whenever the agent fails.

## Not recorded
The chapter titled "The $87 head-to-head" gives no figures in the transcript, so no cost comparison is recorded. The Neon sponsor segment is omitted.

## Concepts introduced
Skill Pack, Doubt-Driven Development, Anti-Rationalization Table

## People mentioned
Addy Osmani, Matt Pocock
