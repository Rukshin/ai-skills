---
up: ["index"]
related: ["LLM Wiki Pattern", "Memory Tiers", "Wiki Quality Scoring", "LLM Wiki v2 (tweet)", "LLM Wiki v2 (gist)"]
created: 2026-04-14
modified: 2026-04-14
sources: ["https://x.com/heynavtoor/status/2043321909971202403", "https://gist.github.com/rohitg00/2067ab416f7bbe447c1977edaaa681e2"]
tags: [wiki/concept]
---

# Memory Lifecycle

The principle that knowledge in an LLM Wiki should not be equally valid forever — facts should carry confidence, be superseded by newer evidence, and fade when no longer reinforced. A core extension of the LLM Wiki Pattern introduced in LLM Wiki v2.

## Confidence scoring

Every fact carries a confidence score encoding:
- How many sources support it
- How recently it was confirmed
- Whether anything contradicts it

Confidence decays with time and strengthens with reinforcement. This turns the wiki from a flat collection of equally-weighted claims into a living model.

Example: "Project X uses Redis for caching" — came from 2 sources, last confirmed 3 weeks ago, confidence 0.85.

## Supersession

When new information contradicts an existing claim, the new claim explicitly supersedes the old one. The old version is preserved but marked stale — version control for knowledge, not just for files. Linked, timestamped.

## Forgetting curves

Facts that haven't been accessed or reinforced in months gradually fade — not deleted, but deprioritized. Based on Ebbinghaus's forgetting curve: retention decays exponentially with time, but each reinforcement (access, confirmation from a new source) resets the curve.

- Architecture decisions → slow decay
- Transient bugs → fast decay

A wiki that never forgets becomes noisy. Forgetting is a feature, not a failure.

## Quality scoring at write time

Every piece of content the LLM writes should get a quality score at creation: is it well-structured, does it cite sources, is it consistent with the rest of the wiki? Content below a threshold gets flagged for review or rewritten. This is distinct from confidence (which tracks truth over time) — quality is about structure at write time. See Wiki Quality Scoring.

## Contradiction resolution

The LLM doesn't only flag contradictions — it resolves them based on source recency, source authority, and number of supporting observations. Human can override but the default should usually be right.

## Consolidation pipeline

Raw observations are not the same as established facts. The Memory Tiers pipeline (working → episodic → semantic → procedural) is the mechanism by which the lifecycle plays out: observations enter at the bottom, consolidate upward as evidence accumulates.

## Source
LLM Wiki v2 (tweet), LLM Wiki v2 (gist)