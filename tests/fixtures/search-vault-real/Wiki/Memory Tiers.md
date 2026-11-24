---
up: ["[[index]]"]
related: ["[[LLM Wiki Pattern]]", "[[Memory Lifecycle]]", "[[Incremental Knowledge Accumulation]]", "[[LLM Wiki v2 (tweet)]]", "[[LLM Wiki v2 (gist)]]"]
created: 2026-04-14
modified: 2026-04-14
sources: ["https://x.com/heynavtoor/status/2043321909971202403", "https://gist.github.com/rohitg00/2067ab416f7bbe447c1977edaaa681e2"]
tags: [wiki/concept]
---

# Memory Tiers

A 4-tier consolidation pipeline for LLM Wiki knowledge, extending [[Incremental Knowledge Accumulation]]. Each tier is more compressed, more confident, and longer-lived than the one below it. Introduced in LLM Wiki v2.

## The four tiers

| Tier | Contents | Lifetime |
|---|---|---|
| **Working memory** | Recent observations, not yet processed | Hours–days |
| **Episodic memory** | Session summaries, compressed from raw observations | Days–weeks |
| **Semantic memory** | Cross-session facts, consolidated from episodes | Weeks–months |
| **Procedural memory** | Workflows and patterns, extracted from repeated semantics | Persistent |

## Promotion logic

The LLM promotes information up the tiers as evidence accumulates:
- Seen once → stays in episodic memory
- Seen across multiple sessions → graduates to semantic
- Repeated pattern → promoted to procedural

This is how you go from "I saw this once" to "this is how things work."

## When to add tiers

In the implementation spectrum of the [[LLM Wiki Pattern]], tiers belong in the second stage (after a minimal viable wiki is working). Start with raw sources + wiki pages + index.md. Add lifecycle and tiers once the wiki starts feeling like a junk drawer of equally-weighted facts.

## Relation to engram

The engram memory system (used in this vault) implements a similar tier structure:
- Raw conversation observations → session summaries → cross-session search index
- Aligns with working → episodic → semantic

Procedural memory maps to skills and CLAUDE.md conventions.

## Source
[[LLM Wiki v2 (tweet)]], [[LLM Wiki v2 (gist)]]