---
up: ["index"]
related: ["Home Repo", "Matt Pocock", "The Home Repo Pattern (article)"]
created: 2026-11-24
modified: 2026-11-24
sources: ["https://www.aihero.dev/the-home-repo-pattern"]
tags: [wiki/concept]
---

# Grilling

## Core idea

A way of working where the agent interviews you about a plan before changing anything. It looks up every fact itself (filesystem, git, `gh`), using subagents for wide searches, and brings you only decisions.

## How a round works

- Each decision is a numbered question with the agent's recommended answer, worded so that "yes" accepts it.
- A question that depends on one still open waits for a later round.
- Until you approve the plan, the agent only reads. Secret files such as `.env` stay unread.
- The session ends when every decision is settled and you approve the plan.

## In the Home Repo setup

The setup prompt in The Home Repo Pattern (article) uses grilling in its first round (which repos are in, where the Home Repo lives, personal or shared, which file the harness loads) and again to agree the plan table before applying it.

## In skill packs

`grill-me` is Matt Pocock's most popular skill, and Pocock vs pstack vs Osmani (video) calls it the single best skill to install first when a problem is fuzzy or the design matters: the agent interrogates you before it writes anything. See Skill Pack.

## Contradictions
_none_

Source: The Home Repo Pattern (article)
