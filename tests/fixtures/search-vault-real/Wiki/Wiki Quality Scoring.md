---
up: ["index"]
related: ["LLM Wiki Pattern", "Memory Lifecycle", "LLM Wiki v2 (gist)"]
created: 2026-04-14
modified: 2026-04-14
sources: ["https://gist.github.com/rohitg00/2067ab416f7bbe447c1977edaaa681e2"]
tags: [wiki/concept]
---

# Wiki Quality Scoring

A set of write-time and maintenance-time controls that prevent an LLM Wiki from accumulating noise. Introduced in LLM Wiki v2 as a complement to Memory Lifecycle (which handles truth over time — quality scoring handles structure at creation time).

## Score everything at write time

Every piece of content the LLM writes should receive a quality score:
- Is it well-structured?
- Does it cite sources?
- Is it consistent with the rest of the wiki?

The LLM can self-evaluate, or a second pass with a different prompt can review. Content below a threshold gets flagged for review or rewritten before it enters the wiki.

## Self-healing

The lint operation from the original LLM Wiki Pattern should be more than suggestions — it should automatically fix what it can:
- Orphan pages get linked or flagged
- Stale claims get marked
- Broken cross-references get repaired

The wiki should tend toward health on its own, not only when you remember to ask. See the wiki-lint skill.

## Contradiction resolution

The original pattern flags contradictions. Quality scoring takes it further: the LLM proposes which claim is more likely correct based on:
- Source recency
- Source authority
- Number of supporting observations

The human can override, but the default should usually be right. Both positions are preserved until resolved.

## Audit trail

Every write operation (ingest, edit, delete) should be logged with timestamp, what changed, and why. When something looks wrong in the wiki, the audit trail tells you how it got there.

## Source
LLM Wiki v2 (gist)