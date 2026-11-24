# ai-skills

Personal AI skills for daily work and personal projects. Structured as a [Claude Code](https://claude.ai/code) plugin, with plain SKILL.md files that are tool-agnostic.

## Install

```bash
claude plugin marketplace add github:Rukshin/ai-skills
claude plugin install ai-skills@ai-skills
```

## Plugins

The marketplace ships two plugins:

| Plugin | Source | Contents |
|--------|--------|----------|
| `ai-skills` | `plugin/` | Portable wiki skills (`wiki-ingest`, `wiki-query`, `wiki-lint`, ...) for any vault with a `.wiki.json` |
| `ai-skills-personal` | `personal/` | Owner-only skills for the personal pkm vault (`wiki-ingest-book`); it refuses to run in a vault without a `Fiction` area |

```bash
claude plugin install ai-skills@ai-skills
claude plugin install ai-skills-personal@ai-skills
```

## Skills

| Skill | Description |
|-------|-------------|
| `wiki-ingest` | Compiles a raw source (file or URL) into the LLM Wiki at `Atlas/Wiki/` |
| `wiki-query` | Answers questions from compiled LLM Wiki pages with citations |
| `wiki-lint` | Health-checks the LLM Wiki — finds orphans, dead links, contradictions, and drift |
| `wiki-ingest-book` | (personal plugin) Ingests a ChatGPT Exporter JSON book conversation into the personal PKM vault |

## Structure

```
ai-skills/
├── .claude-plugin/
│   └── marketplace.json
├── tests/                ← node:test suite and fixtures
├── personal/             ← second plugin (owner-only): .claude-plugin/plugin.json, skills/wiki-ingest-book/
└── plugin/
    ├── .claude-plugin/
    │   └── plugin.json
    ├── lib/                  ← config resolver, manifest helpers, markdown parsers, lint
    ├── scripts/              ← wiki-config.ts, wiki-hash.ts, wiki-lint.ts
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

## Wiki lint and hashing

`wiki-lint` is a read-only script: it never writes to the vault. It resolves the vault like `wiki-config`, runs eight checks (`dead-links`, `orphans`, `frontmatter-gaps`, `up-chain`, `index-drift`, `manifest-drift`, `stale-contradictions`, `empty-sections`) and prints a JSON report (or markdown).

```bash
node plugin/scripts/wiki-lint.ts [--start DIR] [--as-of YYYY-MM-DD] [--exclude GLOB]... [--strict] [--format json|markdown]
# exit 0 ok (1 with --strict and issues), 1 no vault / invalid config, 2 bad usage
```

`--exclude` globs match vault-relative paths (`Atlas/Wiki/Fiction/**`) or bare file names (`Stale.md`); excluded files are not reported but still resolve links. Dot-directories are skipped.

`wiki-hash` prints a file's hash for the ingest manifest. New manifest entries use sha256; entries without `hash_algo` are legacy md5 (format: `plugin/_shared/cli-commands.md`).

```bash
node plugin/scripts/wiki-hash.ts [--algo sha256|md5] <file>   # prints sha256:<hex>; exit 1 unreadable file, 2 bad usage
```

Run the tests:

```bash
npm test        # same as: node --test
```

## Testing

`npm test` runs the script tests and the static skill checks (`tests/skills.test.ts`: frontmatter, section order, token budget, references). Skill behavior is evaluated by manual scenarios in `tests/scenarios/` (see its `README.md`), not by unit tests.

## Adding skills

1. Create `skills/<skill-name>/SKILL.md` following the [LLM-first Skill Style Guide](docs/skill-style-guide.md)
2. Bump `version` in `.claude-plugin/plugin.json`
3. Tag the release: `claude plugin tag`
