---
up: ["CAP Theorem"]
related: ["CAP Theorem", "Distributed Computing"]
created: 2026-04-13
modified: 2026-04-13
sources: ["https://medium.com/@shivanimutke2501/cap-theorem-a-deep-dive-into-cp-ap-ca-choices-in-distributed-systems-f19496a62d84"]
tags: [wiki/concept]
---

# PACELC
An extension of CAP Theorem that adds a Latency vs Consistency trade-off for normal (non-partition) operation.

## Core idea
CAP only addresses what happens *during a partition*. PACELC adds:

- **If Partition (P)** → choose between Availability (A) and Consistency (C) — same as CAP.
- **Else (E, no partition)** → choose between Latency (L) and Consistency (C).

This captures the everyday trade-off even when the system is healthy: serving a response faster may mean serving slightly stale data.

## Why it matters
CAP is a crisis model. PACELC is an operational model — it forces system designers to think about consistency vs latency even when nothing is failing.

Most production tuning decisions (read replicas, caching, eventual consistency policies) are PACELC decisions, not CAP decisions.

## Relation to CAP
PACELC is a superset of CAP. All CAP trade-offs are preserved in the P branch; the E branch is new. See [[CAP Theorem Deep Dive (article)]].
