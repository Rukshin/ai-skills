---
up: ["[[index]]"]
related: ["[[LLM Wiki Pattern]]", "[[Knowledge Graph]]", "[[LLM Wiki v2 (tweet)]]", "[[LLM Wiki v2 (gist)]]"]
created: 2026-04-14
modified: 2026-04-14
sources: ["https://x.com/heynavtoor/status/2043321909971202403", "https://gist.github.com/rohitg00/2067ab416f7bbe447c1977edaaa681e2"]
tags: [wiki/concept]
---

# Hybrid Search

A multi-stream search approach combining BM25, vector embeddings, and graph traversal — designed to replace index.md as the LLM's primary search mechanism once a wiki grows past ~100–200 pages. Introduced in LLM Wiki v2.

## The three streams

| Stream | What it finds |
|---|---|
| **BM25** | Exact keyword matches (stemming + synonym expansion) |
| **Vector search** | Semantic similarity via embeddings |
| **Graph traversal** | Structural connections via the [[Knowledge Graph]] |

Each stream catches things the others miss. Results are fused using **reciprocal rank fusion**.

## Why index.md breaks at scale

The [[LLM Wiki Pattern]]'s index.md works up to ~100–200 pages. Beyond that, the index itself becomes too long for the LLM to read in one pass.

Hybrid search replaces it as the LLM's primary mechanism. index.md is still maintained — but as a human-readable catalog, not a search tool. The dual role:
- **index.md** → for humans browsing the wiki
- **Hybrid search** → for the LLM navigating at query time

## Reciprocal rank fusion

A technique to combine ranked results from multiple streams into a single unified ranking. Each document's combined score is the sum of 1/(rank + k) across streams, where k is a smoothing constant (~60 in practice).

## Implementation note

Hybrid search belongs in the "add scale" tier of the [[LLM Wiki Pattern]] implementation spectrum — necessary when the wiki grows past a few hundred pages. Start with index.md; switch to hybrid when queries start missing relevant content.

## Source
[[LLM Wiki v2 (tweet)]], [[LLM Wiki v2 (gist)]]