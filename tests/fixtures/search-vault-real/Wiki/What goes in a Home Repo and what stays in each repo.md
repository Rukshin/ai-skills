---
up: ["[[index]]"]
related: ["[[Home Repo]]"]
created: 2026-11-24
modified: 2026-11-24
sources: ["https://www.aihero.dev/the-home-repo-pattern"]
tags: [wiki/question]
---

# What goes in a Home Repo and what stays in each repo?
Date: 2026-11-24

## Answer

- In the Home Repo: skills used across repos, AGENTS.md with its pointers, steering files and shared docs (coding standards, glossary, system-wide decisions).
- Stays in each repo: anything true of that repo alone (its own AGENTS.md, build and test commands, repo-specific docs). Code, history, remote and issue tracker stay where they are.
- Pointers: one line per repo (name, what it is, local path, where to clone); past about 20 repos they are grouped by area.

## Sources consulted
[[Home Repo#What goes where]], [[Home Repo#Pointers]]
