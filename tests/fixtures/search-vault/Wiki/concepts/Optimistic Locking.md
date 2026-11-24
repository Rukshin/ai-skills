---
title: Optimistic Locking
tags: [concurrency]
sources: ["[[raw/locking.md]]"]
---
# Optimistic Locking

Detect conflicting writes with a version column instead of holding locks.

## Retry strategy

Retry the transaction when the version check fails.
