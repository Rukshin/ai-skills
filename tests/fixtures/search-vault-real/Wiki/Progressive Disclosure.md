---
up: ["[[Home Repo]]"]
related: ["[[Home Repo]]", "[[Hybrid Search]]", "[[The Home Repo Pattern (article)]]"]
created: 2026-11-24
modified: 2026-11-24
sources: ["https://www.aihero.dev/the-home-repo-pattern"]
tags: [wiki/concept]
---

# Progressive Disclosure

## Core idea

Give the agent a short top-level entry and let it open more detail only when it needs it, instead of loading everything up front.

## In a Home Repo

With about 20 repos, one pointer per repo in `AGENTS.md` works. At around 400 repos, that is too many decisions for the agent. The fix is to point at one file per area and keep the per-repo pointers inside those files, for example `Billing (invoices, payments, tax): see repos/billing.md`. At thousands of repos the skills have so many consumers that a skills marketplace makes more sense. See [[Home Repo]].

## Relation to this wiki

The same idea applies to this vault: `index.md` and `hot.md` act as the short entry, and [[Hybrid Search]] takes over when the index alone stops scaling (about 200 pages).

## Contradictions
_none_

Source: [[The Home Repo Pattern (article)]]
