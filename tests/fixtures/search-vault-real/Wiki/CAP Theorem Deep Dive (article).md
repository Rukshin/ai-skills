---
up: ["CAP Theorem"]
related: ["[[PACELC]]", "Distributed Computing", "[[Martin Kleppmann]]"]
created: 2026-04-13
modified: 2026-04-13
sources: ["https://medium.com/@shivanimutke2501/cap-theorem-a-deep-dive-into-cp-ap-ca-choices-in-distributed-systems-f19496a62d84"]
tags: [wiki/source]
---

# CAP Theorem Deep Dive (article)
CoVaib DeepLearn. 2025. [Original](https://medium.com/@shivanimutke2501/cap-theorem-a-deep-dive-into-cp-ap-ca-choices-in-distributed-systems-f19496a62d84)

## Summary
A deep-dive into CAP Theorem covering the CP/AP/CA classification with concrete real-world database examples, the PACELC extension model, and Martin Kleppmann's 2015 critique of CAP's binary framing.

## Key claims
- Since network partitions are inevitable, every distributed system must choose between **CP** (consistency) or **AP** (availability) — CA is theoretical in distributed settings.
- **PACELC** extends CAP: even when no partition occurs, systems face a trade-off between **Latency** and **Consistency**.
- [[Martin Kleppmann]] argues CAP oversimplifies real-world systems and proposes **delay-sensitivity** as a more practical framework.
- DynamoDB and other AP systems offer configurable consistency modes — the CP/AP binary is a spectrum in practice.

## Concepts introduced
CAP Theorem, [[PACELC]]

## People mentioned
[[Martin Kleppmann]]
