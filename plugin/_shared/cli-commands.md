# Wiki Skills — Obsidian CLI Reference

Paths below use config placeholders resolved by `plugin/scripts/wiki-config.ts` (`{wiki_root}`, `{raw}`, `{manifest}`, `{attachments}`, `{index}`, `{hot}`, `{log}`); `index`, `hot` and `log` are relative to `{wiki_root}`. Replace them with the resolved values; paths are vault-relative.

**File tools first.** The Read/Write/Edit tools work with Obsidian closed and are the primary way to touch vault files. The `obsidian` CLI is optional: it needs Obsidian open and focused and hangs indefinitely otherwise, so always wrap it in a time limit (e.g. `timeout 20 obsidian ...`) and fall back to file tools on failure or timeout.

## Reading

```bash
# Read by exact vault path
obsidian read path="{wiki_root}/{hot}"

# Read by wikilink name resolution
obsidian read file="Hexagonal Architecture"

# Get note headings (quick structure check before full read)
obsidian outline path="{wiki_root}/[Page].md" format=json

# List files in a folder
obsidian files folder="{wiki_root}"
obsidian files folder="{raw}"

# Search with context lines
obsidian search:context query="hexagonal" path="{wiki_root}"
```

## Writing

```bash
# Create a new file
obsidian create path="{wiki_root}/[Page].md" content="..." silent

# Overwrite an existing file
obsidian create path="{wiki_root}/[Page].md" content="..." overwrite silent

# Prepend content (newest-first logs)
obsidian prepend path="{wiki_root}/{log}" content="..."

# Set a single frontmatter property
obsidian property:set name="modified" value="YYYY-MM-DD" path="{wiki_root}/[Page].md"
```

## Delta check (manifest)

```bash
# Read manifest
obsidian read path="{manifest}"
# or use Read tool if CLI can't handle .json

# Hash a local file
md5 -q "/path/to/file.md"

# Hash a local directory (all .md files)
find "<dir>" -name "*.md" | sort | while read f; do md5 -q "$f"; done | md5 -q
```

## Cleanup

```bash
# Delete a processed raw file (after user confirmation)
rm "<vaultRoot>/{raw}/[filename].md"

# Move local images instead of deleting: move them to the vault attachments folder
mv "<vaultRoot>/{raw}/[image-file]" "<vaultRoot>/{attachments}/"
```

## Contradiction callout format

```markdown
> [!contradiction] YYYY-MM-DD
> [[Source A]] claims X. [[Source B]] claims Y. Needs resolution.
```

## Manifest entry format

```json
{
  "sources": {
    "<local_path_or_url>": {
      "hash": "<md5>",
      "url": "<original URL if applicable>",
      "ingested_at": "YYYY-MM-DD",
      "pages_created": ["Page A.md"],
      "pages_updated": ["index.md"]
    }
  }
}
```

## Log entry format

```
## [YYYY-MM-DD] ingest | [Source Title]
Pages created: [[Page A]], [[Page B]]
Pages updated: [[Page C]]

```
