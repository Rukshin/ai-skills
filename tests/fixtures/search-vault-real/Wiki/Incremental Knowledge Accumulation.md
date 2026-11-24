---
up: ["[[LLM Wiki Pattern]]"]
related: ["[[LLM Wiki Pattern]]", "[[LLM Knowledge Bases (thread)]]"]
created: 2026-04-13
modified: 2026-04-13
sources: ["https://x.com/karpathy/status/2039805659525644595"]
tags: [wiki/concept]
---

# Incremental Knowledge Accumulation
The principle that every query, output, and exploration should be filed back into the knowledge base so that the wiki compounds over time rather than delivering one-shot answers.

## Core idea

In the [[LLM Wiki Pattern]], outputs are not discarded after a query. Markdown answers, slide decks, and visualizations are "filed back" into the wiki, making the knowledge base richer for future queries. Each exploration adds up.

Karpathy: "Often, I end up 'filing' the outputs back into the wiki to enhance it for further queries. So my own explorations and queries always 'add up' in the knowledge base."

## Implications

- A knowledge base used more is a better knowledge base — usage is a form of maintenance.
- The human's curiosity directly drives the wiki's growth; no separate curation step needed.
- Linting and contradiction resolution also contribute to accumulation (quality accumulates, not just quantity).

## Long-term direction

When the wiki grows large enough, synthetic data generation and finetuning can encode the accumulated knowledge into model weights directly, removing the context-window dependency entirely.

## Source
[[LLM Knowledge Bases (thread)]] by [[Andrej Karpathy]]
