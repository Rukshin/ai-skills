# ai-skills

Personal AI skills for daily work and personal projects. Structured as a [Claude Code](https://claude.ai/code) plugin, with plain SKILL.md files that are tool-agnostic.

## Install

```bash
claude plugin marketplace add github:Rukshin/ai-skills
claude plugin install ai-skills@ai-skills
```

## Skills

| Skill | Description |
|-------|-------------|
| `wiki-ingest` | Compiles a raw source (file or URL) into the LLM Wiki at `Atlas/Wiki/` |
| `wiki-query` | Answers questions from compiled LLM Wiki pages with citations |
| `wiki-lint` | Health-checks the LLM Wiki — finds orphans, dead links, contradictions, and drift |
| `wiki-ingest-book` | Ingests a ChatGPT Exporter JSON book conversation into the PKM vault |

## Structure

```
ai-skills/
├── .claude-plugin/
│   └── marketplace.json
├── tests/                ← node:test suite and fixtures
└── plugin/
    ├── .claude-plugin/
    │   └── plugin.json
    ├── lib/config.ts         ← vault config resolver
    ├── scripts/wiki-config.ts
    ├── templates/wiki.json
    ├── _shared/
    │   └── cli-commands.md   ← shared Obsidian CLI reference for wiki skills
    └── skills/
        └── <skill-name>/
            └── SKILL.md
```

## Vault config (`.wiki.json`)

The wiki skills read their paths from a per-vault `.wiki.json` at the vault root (template and key docs: `plugin/templates/wiki.json`, `plugin/templates/wiki.json.md`).

Resolution order (fails closed, never guesses a vault):

1. Nearest `.wiki.json` walking up from the working directory.
2. Nearest `Atlas/Wiki/SCHEMA.md` with `type: llm-wiki` (uses `wiki_root`, `raw`, `index`, `hot`, `log`, `areas`; missing keys take defaults).
3. Otherwise an error listing the directories searched.

Run the resolver (Node >= 22.18, or bun; no dependencies):

```bash
node plugin/scripts/wiki-config.ts [--start DIR]   # JSON on stdout; exit 0 ok, 1 error, 2 bad usage
```

Run the tests:

```bash
npm test        # same as: node --test
```

## Adding skills

1. Create `skills/<skill-name>/SKILL.md` following the [LLM-first Skill Style Guide](docs/skill-style-guide.md)
2. Bump `version` in `.claude-plugin/plugin.json`
3. Tag the release: `claude plugin tag`
