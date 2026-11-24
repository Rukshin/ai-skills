---
up: ["[[index]]"]
related: ["[[LLM Wiki Pattern]]", "[[Incremental Knowledge Accumulation]]", "[[Memory Tiers]]", "[[LLM Wiki v2 (gist)]]"]
created: 2026-04-14
modified: 2026-04-14
sources: ["https://gist.github.com/rohitg00/2067ab416f7bbe447c1977edaaa681e2"]
tags: [wiki/concept]
---

# Crystallization

The process of taking a completed chain of work — a research thread, a debugging session, an analysis — and automatically distilling it into a structured wiki digest. Introduced in LLM Wiki v2.

## Core idea

Your explorations are a source, just like an article or a paper. The wiki should treat them that way: ingest the results, update the graph, strengthen or challenge existing claims.

This extends [[Incremental Knowledge Accumulation]] beyond Q&A outputs — the entire trajectory of a session becomes first-class wiki content.

## What the digest captures

A crystallized page answers:
- What was the question or goal?
- What did we find?
- What files or entities were involved?
- What lessons emerged?

The digest becomes a first-class wiki page. The lessons get extracted as standalone facts that strengthen or challenge the knowledge base — they flow into [[Memory Tiers]] like any other source.

## Why it matters

Without crystallization, explorations disappear into chat history. With it, every investigation compounds — each session leaves a permanent residue in the wiki. The wiki learns from your work, not just from articles you clip.

## Automated crystallization

In a fully automated [[LLM Wiki Pattern]] setup, crystallization triggers on session end:
1. Compress the session into observations
2. Score the session's insights against existing wiki content
3. Create or update wiki pages for significant findings
4. Promote new facts into the appropriate [[Memory Tiers]] tier

## Source
[[LLM Wiki v2 (gist)]]