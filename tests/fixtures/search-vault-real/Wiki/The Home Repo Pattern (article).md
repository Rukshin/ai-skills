---
up: ["Home Repo"]
related: ["Home Repo", "Matt Pocock", "Progressive Disclosure", "Grilling"]
created: 2026-11-24
modified: 2026-11-24
sources: ["https://www.aihero.dev/the-home-repo-pattern"]
tags: [wiki/source]
---

# The Home Repo Pattern (article)
Matt Pocock. 2026-11-12. [Original](https://www.aihero.dev/the-home-repo-pattern)

## Summary

A reference article on the Home Repo: one repository that holds your skills, your `AGENTS.md` and shared docs, and points at your other repos. You run your agents from it. The article includes a copyable setup prompt and an FAQ.

## Key claims

- An agent started inside one repo sees only that repo. Each repo ends up with its own copy of the skills and agent setup, and planning a feature that crosses repos happens without the overview.
- A Home Repo gives one place for steering files and tooling, one place to run all agents, and sweeping changes across repos from one session.
- Navigation uses one pointer per repo: `<name> (<what it is>): <local path>. Clone from <remote> if missing.` Add a hint where a repo needs one, such as "read its AGENTS.md first".
- About 20 repos works fine. Around 400, one pointer per repo is too many decisions: point at one file per area instead (see Progressive Disclosure). At thousands of repos, a skills marketplace makes more sense.
- A Home Repo beats a user folder like `~/.claude/skills` because it is a versioned project a team can share. It replaces a monorepo only when you cannot have one (mixed public and private repos, or a team that will not adopt one).
- The setup prompt works in four steps: inventory the repos, inventory the shared material, agree the plan, apply it. The agent asks decisions in numbered rounds with a recommended answer, and only reads until the plan is approved (see Grilling).
- No special tooling is required to start. Later the Home Repo is a good place for tooling such as a CLI that connects the agent to external services. It also works in CI by placing the Home Repo in the sandbox.

## Concepts introduced
Home Repo, Progressive Disclosure, Grilling

## People mentioned
Matt Pocock
