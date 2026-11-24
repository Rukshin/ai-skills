---
up: ["index"]
related: ["Incremental Knowledge Accumulation", "LLM Knowledge Bases (thread)", "LLM Wiki v2 (tweet)", "Memory Lifecycle", "Memory Tiers", "Knowledge Graph", "Hybrid Search"]
created: 2026-04-13
modified: 2026-04-14
sources: ["https://x.com/karpathy/status/2039805659525644595"]
tags: [wiki/concept]
---

# LLM Wiki Pattern
An architecture for LLM-maintained personal knowledge bases: raw sources are compiled into a structured `.md` wiki, which the LLM writes and maintains while a human-friendly IDE surfaces it.

## Core idea

Three-layer pipeline:

1. **Raw/** — source documents (articles, papers, repos, images) clipped and stored locally. The LLM reads but never modifies this layer.
2. **Wiki** — a flat directory of `.md` files compiled by the LLM from raw sources. Includes summaries, backlinks, concept articles, and index files. The LLM owns this layer entirely.
3. **IDE (Obsidian)** — the human-facing view. Used to browse raw data, the compiled wiki, and derived outputs (slides, visualizations).

The human's role is to source raw material and ask questions. The LLM's role is to compile, maintain, lint, and answer.

## Q&A without RAG

At ~100 articles / ~400K words, auto-maintained index files and brief summaries give the LLM enough orientation to handle complex Q&A without a vector retrieval layer. RAG becomes relevant only at larger scale.

## Outputs

Query outputs (markdown files, Marp slides, matplotlib images) are filed back into the wiki to enhance it for further queries. See Incremental Knowledge Accumulation.

## Linting

LLM health checks over the wiki: find inconsistent data, impute missing data via web search, surface new article candidates from implicit connections. See the `wiki-lint` skill.

## v2 extensions

The original pattern treats all knowledge as equally valid forever. LLM Wiki v2 (see LLM Wiki v2 (tweet)) adds the machinery to keep the wiki healthy at scale:

- **Memory Lifecycle** — confidence scoring, supersession, forgetting curves; knowledge that strengthens, weakens, and expires
- **Memory Tiers** — 4-tier consolidation (working → episodic → semantic → procedural)
- **Knowledge Graph** — typed entities and relationships layered on top of pages; graph traversal for queries
- **Hybrid Search** — BM25 + vector + graph traversal, fused with reciprocal rank fusion; replaces `index.md` past ~200 pages

## Source
LLM Knowledge Bases (thread) by Andrej Karpathy