# Wiki Skills — Obsidian CLI Reference

All commands use the `obsidian` CLI. Obsidian must be open and focused — commands hang indefinitely without a running instance.

## Reading

```bash
# Read by exact vault path
obsidian read path="Atlas/Wiki/hot.md"

# Read by wikilink name resolution
obsidian read file="Hexagonal Architecture"

# Get note headings (quick structure check before full read)
obsidian outline path="Atlas/Wiki/[Page].md" format=json

# List files in a folder
obsidian files folder="Atlas/Wiki"
obsidian files folder="+/raw"

# Search with context lines
obsidian search:context query="hexagonal" path="Atlas/Wiki"
```

## Writing

```bash
# Create a new file
obsidian create path="Atlas/Wiki/[Page].md" content="..." silent

# Overwrite an existing file
obsidian create path="Atlas/Wiki/[Page].md" content="..." overwrite silent

# Prepend content (newest-first logs)
obsidian prepend path="Atlas/Wiki/log.md" content="..."

# Set a single frontmatter property
obsidian property:set name="modified" value="YYYY-MM-DD" path="Atlas/Wiki/[Page].md"
```

## Delta check (manifest)

```bash
# Read manifest
obsidian read path="+/raw/.manifest.json"
# or use Read tool if CLI can't handle .json

# Hash a local file
md5 -q "/path/to/file.md"

# Hash a local directory (all .md files)
find "<dir>" -name "*.md" | sort | while read f; do md5 -q "$f"; done | md5 -q
```

## Cleanup

```bash
# Delete a processed raw file (after user confirmation)
rm ~/Code/mine/pkm/+/raw/[filename].md

# Move local images instead of deleting
mkdir -p ~/Code/mine/pkm/x/Wiki
mv ~/Code/mine/pkm/+/raw/[image-file] ~/Code/mine/pkm/x/Wiki/
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
