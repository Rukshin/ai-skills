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
│   └── plugin.json
├── _shared/
│   └── cli-commands.md   ← shared Obsidian CLI reference for wiki skills
└── skills/
    └── <skill-name>/
        └── SKILL.md
```

## Adding skills

1. Create `skills/<skill-name>/SKILL.md` following the [LLM-first Skill Style Guide](docs/skill-style-guide.md)
2. Bump `version` in `.claude-plugin/plugin.json`
3. Tag the release: `claude plugin tag`
