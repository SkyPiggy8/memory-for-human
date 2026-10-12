# Reference projects and MFH's choices

[简体中文](related-work.md) · [English](related-work.en.md) · [Español](related-work.es.md)

MFH focuses on a family completing a memoir with the AI they already use: relationship-specific questions, relatives helping with the computer, selected source material, editable chapters, recoverable text, and practical production instructions.

## What was checked

Repository documentation and selected source files were inspected on 2026-10-13. These projects were not run; this is not a performance or quality benchmark.

| Project | Documented or inspected direction | Useful lesson |
| --- | --- | --- |
| [StorySage](https://github.com/ShayanTalaei/StorySage/blob/12f3c9148a3d73e96f61737d9f04d354f08e4dde/readme.md) | Specialized interview and writing agents; a vector-memory implementation | Keep interviewing and writing distinct, and continue from existing memories |
| [memoir](https://github.com/Taoyuesong/memoir/blob/83d3cc65fdb16e33e00f116cec47917ee2863c74/README.md) | Rust/Axum, SQLite, SvelteKit; tools for structured records and context budgeting | Long interviews need durable records and context management |
| [Lorevox](https://github.com/lorevox-hx/lorevox) | Search-cached descriptions discuss Archive → History → Memoir and candidate review | Separate raw recollection, claims, and prose; current code could not be verified |

Lorevox's repository page, API, and raw-file request returned 404 on the inspection date. Cached descriptions do not establish current implementation status.

Code references: StorySage [orchestrator](https://github.com/ShayanTalaei/StorySage/blob/12f3c9148a3d73e96f61737d9f04d354f08e4dde/src/agents/biography_team/orchestrator.py) and [vector memory](https://github.com/ShayanTalaei/StorySage/blob/12f3c9148a3d73e96f61737d9f04d354f08e4dde/src/content/memory_bank/memory_bank_vector_db.py); memoir [tools](https://github.com/Taoyuesong/memoir/blob/83d3cc65fdb16e33e00f116cec47917ee2863c74/backend/src/agent/tools.rs) and [context builder](https://github.com/Taoyuesong/memoir/blob/83d3cc65fdb16e33e00f116cec47917ee2863c74/backend/src/agent/context.rs).

## MFH's implementation focus

Manual AI handoff and API use share task rules and feed chapters back into the same local project. Six relationship types have 156 starting questions per language. Chinese, English, and Spanish explanations support narrators and relatives who do not program. The frontend needs no build; the local service uses Node.js built-ins.

Stable source IDs, explicit material selection, chapter review that resets on editing, additive restore, Markdown, browser printing, and book/album preparation instructions support continuing and keeping the work. Album and NAS integrations are not automated.

Source preservation, human review, local storage, and AI interviewing also appear elsewhere. MFH's distinction is this combination and audience, not an invention of those individual ideas. Its current scope is simpler than multi-agent orchestration, token-aware compression, or candidate fact promotion: selected sources, separate tasks, chapter-level review, and clear size limits. Those advanced systems remain possible future work.

Absence from inspected documentation is not evidence that a competitor lacks a feature. Family usability and interview quality should be measured through actual use, not asserted from this comparison. See [technical design](architecture.en.md).
