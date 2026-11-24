---
up: ["[[index]]"]
related: ["[[LLM Wiki Pattern]]", "[[Hybrid Search]]", "[[LLM Wiki v2 (tweet)]]", "[[LLM Wiki v2 (gist)]]"]
created: 2026-04-14
modified: 2026-04-14
sources: ["https://x.com/heynavtoor/status/2043321909971202403", "https://gist.github.com/rohitg00/2067ab416f7bbe447c1977edaaa681e2"]
tags: [wiki/concept]
---

# Knowledge Graph

A typed entity + relationship layer built on top of wiki pages. Augments the flat-page [[LLM Wiki Pattern]] with structured navigation and discovery. Introduced in LLM Wiki v2.

## What it adds over wikilinks

Plain wikilinks say "A relates to B." A knowledge graph says "A caused B, confirmed by 3 sources, confidence 0.9." Typed relationships carry semantic weight that flat links cannot express.

## Entity extraction

When the LLM ingests a source, it extracts structured entities in addition to writing prose:
- People, projects, libraries, concepts, files, decisions
- Each entity gets a type, attributes, and relationships to other entities

Example: "React" is a library. "Auth migration" is a project. "Sarah" is a person who owns the auth migration and has opinions about React.

## Typed relationships

Not all connections are equal. Relationship types like _uses_, _depends on_, _contradicts_, _caused_, _fixed_, _supersedes_ carry different semantic weight.

Each relationship carries:
- Direction (A → B)
- Type (caused, uses, contradicts…)
- Confidence score
- Source count

## Graph traversal for queries

Instead of keyword search: start at an entity node, walk outward through typed edges, find everything downstream. Catches connections that keyword search misses.

Example: "What's the impact of upgrading Redis?" → start at Redis node → walk _depends on_ and _uses_ edges → find all affected systems.

## Relation to wiki pages

The graph doesn't replace pages — it augments them.
- Pages are for reading (human-friendly prose)
- The graph is for navigation and discovery (machine-queryable structure)

## Privacy consideration

Before any entity hits the wiki, strip sensitive data — API keys, credentials, PII. Entity extraction is a write-time operation; filtering must happen here.

## Source
[[LLM Wiki v2 (tweet)]], [[LLM Wiki v2 (gist)]]