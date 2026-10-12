# Technical design: sources, models, and reviewed chapters

[简体中文](architecture.md) · [English](architecture.en.md) · [Español](architecture.es.md)

MFH turns an interview into a writing project that can be continued later. Original answers remain separate from drafts. The user chooses what the model receives, edits the result, and reviews it. This page describes the v0.2 implementation; [related work](related-work.en.md) explains its position.

## The working process

```text
Answers / imported text → stable A… / M… source IDs
    → user-selected sources → task instructions
    → manual handoff OR local API relay
    → editable chapter draft → narrator review
    → text backup / Markdown / browser printing
```

Each language has 156 starting questions across six relationship types, including 48 for a life story. An API interview request asks for one follow-up grounded in selected answers. There is no automatic interview coverage planner or knowledge graph.

## Traceable sources

`app/core.js` defines the `memory-for-human` v2 format. Answers, imported materials, and chapters are separate records. Answer IDs (`A1`…) and material IDs (`M1`…) survive deletions, backup, and restore. Imported materials are excluded from AI by default; answers can also be deselected.

`context()` includes selected sources and, for review, the current chapter. Draft instructions request source markers such as `[A1]`. The program preserves IDs and original text; it does not verify citations sentence by sentence. A marker helps a person check a claim, but does not prove it.

## Model-independent tasks

`taskPrompt()` defines interview, chapter drafting, review, and simple explanation. Manual handoff includes the corresponding rules and selected language; API use applies the same task rules. Returned text or documented JSON becomes a new draft chapter, without approving facts.

`server.mjs` adapts OpenAI-compatible requests and Anthropic Messages separately. Users configure the service, model, and address. Local inference requires their own compatible model server. MFH does not train a foundation model. Changing AI does not remove local sources or existing chapters.

## Human review and recoverable state

Chapters store their content, origin, update time, and `approved` status. New chapters are drafts. A person marks a chapter reviewed; editing returns it to draft. AI review lists unsupported details, conflicting dates, and privacy concerns, and cannot approve a chapter. Review is currently chapter-level, not a fact-by-fact approval queue.

Source instructions are treated as data, not work rules. This constraint is included in prompts; it has not undergone a complete adversarial prompt-injection evaluation.

`app/app.js` stores multiple projects in IndexedDB, including unfinished answers and the active chapter. `publicProject()` exports allowed fields without credentials. `validateProject()` checks format, version, and size; restore creates a new project identity while retaining source IDs and existing work. Oversized data is rejected rather than silently shortened.

Backups contain text, not original photos, scans, or recordings. Browser storage is not encrypted. Different browsers, origins, ports, and direct-file mode can have separate storage: back up before moving.

## Local runtime and credentials

The frontend uses classic scripts with no build step. Direct-file mode supports writing, editing, and backup. API use needs Node.js 22+ with built-in modules only, bound to `127.0.0.1`. The Windows launcher can download official LTS and verify its SHA-256 before extraction.

The server checks Host, Origin, and a per-run session token. Static serving uses an allowlist; private configuration is not served. Keys entered in the page stay in server memory for that run. Provider errors are sanitized before display. Online inference sends selected text to the configured service; see [privacy guidance](guide.en.md).

## Long manuscripts and present limits

Work chapter by chapter with selected sources. A requested length is guidance, not permission to invent. Source JSON over 100,000 characters triggers a request to reduce or split material. This is a character limit, not automatic model-specific token budgeting. An output-limit notice remains in truncated results.

Cross-chapter dates, names, and repetition still need human coordination. Automatic summaries, semantic retrieval, and whole-book consistency checks are future work. Audio-file ASR, OCR, multiple-narrator fact review, and illustrated layout also remain unimplemented.

## Where the work lives

| File | Responsibility |
| --- | --- |
| `app/core.js` | Data format, validation, selection, task rules, text export |
| `app/app.js` | Interview state, persistence, editing, handoff, printing |
| `app/i18n.js` | Three-language interface, explanations, questions |
| `server.mjs` | Local authentication, transport adapters, sanitized errors |
| `templates/`, `prompts/` | Instructions usable by relatives or another AI |

Tests cover data recovery, selection, limits, local access controls, and mocked API transport. Real-browser checks cover writing, languages, handoff, restore, editing, and print output. They do not establish live provider access, interview quality, or full-length memoir performance.
