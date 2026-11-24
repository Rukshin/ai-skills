---
up: ["[[Home]]"]
created: 2026-04-13
modified: 2026-11-24
---

# Wiki Index

The root of the LLM Wiki layer. All wiki pages chain up to here.

## Concepts
- [[LLM Wiki Pattern]] — Architecture for LLM-maintained personal knowledge bases: raw/ → compiled .md wiki → Obsidian IDE; v2 extensions add lifecycle, graph, and hybrid search
- [[Incremental Knowledge Accumulation]] — Principle that query outputs should be filed back into the wiki so knowledge compounds over time
- [[Memory Lifecycle]] — Confidence scoring, supersession, and forgetting curves; knowledge that strengthens with reinforcement and decays with time
- [[Memory Tiers]] — 4-tier consolidation pipeline: working → episodic → semantic → procedural
- [[Knowledge Graph]] — Typed entity + relationship layer on top of wiki pages; graph traversal for queries that keyword search misses
- [[Hybrid Search]] — BM25 + vector + graph traversal fused with reciprocal rank fusion; replaces index.md past ~200 pages
- [[Crystallization]] — Distilling completed work chains into structured wiki digests; explorations become first-class sources
- [[Wiki Quality Scoring]] — Write-time quality controls, self-healing lint, and auto-contradiction resolution
- [[The Schema as Product]] — SCHEMA.md is the most important file; encodes domain knowledge; co-evolves with you; transferable
- [[PACELC]] — Extends CAP with a Latency vs Consistency trade-off during normal (non-partition) operation
- [[Linking Your Thinking (LYT)]] — Hub for Nick Milo's LYT method: linked notes plus fluid frameworks (Home note, MOCs); Ideaverse Lite kit ingest
- [[ACE Folder Framework (LYT)]] — Atlas, Calendar, Efforts: three head spaces (knowledge, time, action) as a minimal folder scheme
- [[STIR]] — Space, Time, Importance, Relatedness: the four universal ways we organize and remember
- [[Maps of Content]] — Link-based notes with three overlapping phases: gather, develop, navigate
- [[Higher-Order Notes]] — Notes made mostly of links (hub, index, structure notes, MOCs)
- [[Home Note]] — The north-star launchpad into your MOCs; start with 2-3 broad maps
- [[Fluid Frameworks (LYT)]] — Non-essential flexible structures that curate access, versus rigid folders
- [[Efforts vs Projects]] — Efforts as loose, deadline-free alternatives to projects; four intensities On/Ongoing/Simmering/Sleeping
- [[Note-Making]] — Making living notes in your own words instead of taking disposable ones
- [[Evergreen Notes (LYT)]] — Clear, own-words, linked, non-static notes that compound in value
- [[Mental Squeeze Point (LYT)]] — The overwhelm moment that signals it is time to build a MOC
- [[Ideaverse]] — The universe of ideas, typically your digitally linked notes
- [[Personal Knowledge Management (LYT)]] — PKM as the process of making sense of the world; good versus bad PKM
- [[PKM Planet]] — Six realms of knowledge management (memory, idea, writing, productivity, skill, relationship)
- [[Triangulation (LYT)]] — Two known points find a third: the powers to understand, remember and imagine
- [[Relationship Builders for Notes (LYT)]] — Links, folders, tags, proximity, MOCs and Home note: strengths and limits of each

- [[Home Repo]] — One repo holding shared skills, AGENTS.md and docs, with pointers to your other repos; agents run from it
- [[Progressive Disclosure]] — Short entry point, detail opened on demand; pointer files per area as repo counts grow
- [[Grilling]] — Agent interviews you in numbered rounds with a recommended answer before changing anything

- [[Skill Pack]] — Bundles of agent skills compared by the question they answer: agree on the build (Pocock), prove it works (pstack), follow the process (Osmani)
- [[Doubt-Driven Development]] — Fresh-context reviewer whose only job is to doubt a claim; adversarial review during the build
- [[Anti-Rationalization Table]] — Excuses an agent uses to skip a step, paired with rebuttals, inside each skill

## People
- [[Andrej Karpathy]] — AI researcher/educator; creator of the LLM Wiki Pattern; ex-OpenAI co-founder, ex-Tesla AI Director
- [[Martin Kleppmann]] — Distributed systems researcher; *Designing Data-Intensive Applications*; 2015 CAP Theorem critique
- [[Nick Milo]] — Creator of Linking Your Thinking (LYT) and the Ideaverse Lite kit

- [[Matt Pocock]] — AI Hero author; the Home Repo Pattern, grilling and shared skills

- [[Addy Osmani]] — Creator of agent-skills; six-stage agent lifecycle, ex-Chrome DX at Google

## Sources
- [[LLM Knowledge Bases (thread)]] — Karpathy's description of his LLM Wiki system: the architecture behind Atlas/Wiki/
- [[LLM Wiki v2 (tweet)]] — Nav Toor's thread announcing LLM Wiki v2 extensions: memory lifecycle, graph, hybrid search
- [[LLM Wiki v2 (gist)]] — Rohit Ghumare's full writeup; all v2 concepts in detail; implementation spectrum
- [[CAP Theorem Deep Dive (article)]] — CP/AP/CA classification with DB examples, PACELC model, and Kleppmann critique
- [[Ideaverse Lite (kit)]] — Nick Milo's LYT starter vault: release history and folder changes
- [[Information Anxiety (book)]] — Wurman's five ways to organize information (LATCH); the seed of STIR

- [[The Home Repo Pattern (article)]] — Matt Pocock's reference on the Home Repo: pointers, scaling past 20 repos, setup prompt

- [[Pocock vs pstack vs Osmani (video)]] — Rob Shocks compares three skill packs and argues for matching ceremony to stakes

## Fiction
- [[Fiction]] — Ficción y literatura: novelas, personajes, temas. Todo en español. Ver MOC completo.


## Questions
- [[What goes in a Home Repo and what stays in each repo]] — Skills, AGENTS.md and shared docs live in the Home Repo; repo-specific material stays; one pointer per repo
