---
up: ["index"]
related: ["Progressive Disclosure", "Grilling", "Matt Pocock", "The Home Repo Pattern (article)", "What goes in a Home Repo and what stays in each repo"]
created: 2026-11-24
modified: 2026-11-24
sources: ["https://www.aihero.dev/the-home-repo-pattern"]
tags: [wiki/concept]
---

# Home Repo

## Core idea

A Home Repo is one git repository that holds your shared skills, your `AGENTS.md` and shared docs, and points at your other repos. You start agent sessions from it, not from inside a single repo, so the agent sees the whole project.

## What goes where

- **In the Home Repo:** skills used across repos, `AGENTS.md` with its pointers, steering files, and shared docs such as coding standards, a glossary and system-wide decisions.
- **Stays in each repo:** anything true of that repo alone, such as its own `AGENTS.md`, build and test commands and repo-specific docs. Code, history, remote and issue tracker stay where they are.

## Pointers

Each repo gets one line in an "Other Repos" section: name, what it is, local path, and where to clone it if missing. The agent works in the repo if it is already on disk and clones it there if not. Past about 20 repos, the pointers are grouped by area (see Progressive Disclosure).

## Alternatives

- A user skills folder is a stopgap. A Home Repo is versioned and a team can share it.
- A monorepo is a good fit when you can have one. A Home Repo replaces it when you mix public and private repos or the team will not adopt one.
- Git submodules work at 5-10 repos, but plain pointers do the same job.

## Contradictions
> [!contradiction] resolved 2026-11-24
> Kept "about 20 repos" from The Home Repo Pattern (article) (original source). The "about 50" claim from an unverified web source came with no clear reference refuting it, so it is not recorded.

Source: The Home Repo Pattern (article)
