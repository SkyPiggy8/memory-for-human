# Practical and technical guide

[Practical guide](#usage) · [Interview methods](#interview) · [Technical design](#architecture) · [Reference projects](#related-work)

<a id="usage"></a>

## Practical guide

### Begin gently

Ask about one small moment. A relative can type while an older narrator speaks. Stop or skip questions whenever wanted. For a long life story, gather short interviews over time and write one chapter at a time. Do not make a word count a reason to invent or pressure someone.

The app reads text from `.txt`, `.md`, `.csv`, and `.json`, up to 1 MB per file. Keep the narrator, approximate event date, people, place, source, and permission with each piece. A date recorded during the interview is not necessarily the event date.

Chat text does not need speech recognition. Export or copy relevant excerpts through the original tool’s allowed methods. The app is not a universal chat importer. For recordings, preserve the original, transcribe with your own tool, and correct names and important facts. Browser dictation is separate from uploaded-audio transcription.

Photos need captions describing who, when, where, and what is known. Preserve uncertainty. The current app does not read images, PDFs, or handwritten letters. Original media stays in your own folder, outside the text backup.

### AI and review

Imported materials are excluded from AI until selected. Saved answers and selected material provide the basis for chapters; review also uses the current chapter. AI may organize and phrase what was supplied, not invent a life. Keep source markers in the working draft. The narrator decides what is true, what is private, and what to leave out.

“Use my own AI” prepares instructions without private material by default. Choose the task and opt in to include material. Paste the resulting chapter or documented JSON back into the app. An AI with computer access can read [its handoff guide](AI-HANDOFF.en.md).

Online requests and online handoffs send their included text to that service. Local storage does not mean cloud AI is offline. Get permission before collecting or sharing other people’s material. Keys stay out of backups and instructions.

### Save and recover

Download a complete text backup regularly. It includes answers, text sources, chapters, and an unfinished answer; not API Keys or original media. Restore creates a new memoir and keeps existing work. Markdown is for editing and sharing, not a complete project restore file.

Browser storage belongs to a particular browser and address. Direct file mode, another port, and another browser may have different storage. Back up before moving. A browser’s private session or deleted data can remove local work.

### Printed memoir: supplies and steps

Prepare reviewed text, original selected photos with captions, a title and cover, a table of contents, a print PDF, and one proof copy. Use a layout editor you know or ask a print shop for help.

1. Find a local print/copy shop or a small-run book service.
2. Ask about copies, trim size, page count, paper, color, binding, deadline, and price.
3. Get their actual PDF, bleed, inner-margin, cover, and spine requirements before laying out the file.
4. Use original images. Keep text and faces away from trim edges and binding folds.
5. Export and inspect the PDF, including fonts, page order, pictures, and intentional blank pages.
6. Print one proof. Check readability with the intended reader, spelling, photos, cropping, and binding.
7. Correct the file, then order the final copies. Send the print file, not raw private interviews.

An enquiry you can use: “I want a small personal memoir run: about [pages] pages and [copies] copies, with [photos] photos. What size, paper, and binding do you suggest? Please quote a proof and final copies, give a timeline, and send your interior and cover PDF requirements.”

Browser printing offers “Save as PDF”; it does not produce an automatically designed photo book or a shop-ready cover. Confirm the print shop’s specifications separately.

### Albums, frames, and archive

Start a photo book with selected originals and true captions, then proof cropping and page folds. AI-created scene images should say “AI illustration”; they are not historical photos. Keep originals alongside any restored images.

Try photos and story cards on an old tablet or existing frame before buying equipment. Check supported formats. A DIY frame needs supported computing hardware, a display, appropriate power, storage, cables, and an enclosure; test the software before buying a complete set.

Keep independent backups of original recordings, text, pictures, final work, and the source list. A NAS is optional; synchronization alone is not a recovery plan. Keep copies on different media and, when possible, another location, and test opening or restoring them.

Optional independent projects: [faster-whisper](https://github.com/SYSTRAN/faster-whisper) for transcription, [Immich](https://github.com/immich-app/immich) for photos, [picframe](https://github.com/helgeerbe/picframe) for a Raspberry Pi frame, and [Paperless-ngx](https://github.com/paperless-ngx/paperless-ngx) for document archiving. MFH links them; it has not integrated or tested your deployment. Follow their own documentation and terms.

### Interview and technical guides

[Interview methods](guide.en.md#interview) · [Technical design](guide.en.md#architecture) · [Reference projects](guide.en.md#related-work)

<a id="interview"></a>

## Interview methods

“Tell me your whole life” is too broad; an exact date may be hard to remember. Begin with one small moment. More questions mean more choices, not a form everyone must finish.

### Starting questions

| Story | Questions | Topics |
| --- | --- | --- |
| Partners | 24 | Meeting, daily life, distance, change, words to keep |
| Marriage and family | 24 | Decisions, home, routines, care, family changes |
| A life | 48 | Childhood, school, work, moves, family, skills, later life |
| Friends in service | 20 | Shared life, help, parting, reunions, objects |
| Workmates | 20 | Joining, collaboration, disagreements, learning, goodbye |
| Classmates | 20 | School routines, friends, activities, graduation, reunion |

Each language has the same 156 topics. Without AI, questions follow the selected scene's order and cycle back after the last one. API follow-ups use selected answers. There is no automatic life-stage completion tracker.

### Choose one follow-up

Start with a detail already mentioned. Ask where something happened, what someone did, an object they remember, or what happened next. If the scene is clear, try another topic. Ask about sequence only when it matters, allowing approximate dates. Let the narrator describe feelings; do not suggest an emotion or answer.

A fictional example: “I rode a bicycle to work.” → “What places did you pass on that route?” → “A bridge and a breakfast stall.” → “What did you usually eat there?” This gives material for a scene without inventing weather or motivations.

Keep different people's accounts separate. Ask whether a passage can be shared. Skip or pause whenever wanted. A relative can record and read text back, but should label their own additions.

### Tell your own AI

```text
Ask one question at a time, using a concrete detail I have mentioned.
If an answer is clear, move to an uncovered topic.
If it is short, ask about one action, place, person, or object.
Allow approximate dates; clarify sequence only when needed.
Do not supply an emotion, date, or answer in your question.
Keep conflicting accounts attributed to their speakers.
If I decline or am tired, change topic or pause.
Before writing, identify one or two gaps instead of inventing details.
```

For an older narrator, begin with a brief session and one subject. Allow silence, check permission before recording, and read the result back. A short chapter is worthwhile; the narrator decides whether to continue. See the [handoff guide](AI-HANDOFF.en.md).

<a id="architecture"></a>

## Technical design

MFH turns an interview into a writing project that can be continued later. Original answers remain separate from drafts. The user chooses what the model receives, edits the result, and reviews it. This page describes the v0.2 implementation; [related work](guide.en.md#related-work) explains its position.

### The working process

```text
Answers / imported text → stable A… / M… source IDs
    → user-selected sources → task instructions
    → manual handoff OR local API relay
    → editable chapter draft → narrator review
    → text backup / Markdown / browser printing
```

Each language has 156 starting questions across six relationship types, including 48 for a life story. An API interview request asks for one follow-up grounded in selected answers. There is no automatic interview coverage planner or knowledge graph.

### Traceable sources

`app/core.js` defines the `memory-for-human` v2 format. Answers, imported materials, and chapters are separate records. Answer IDs (`A1`…) and material IDs (`M1`…) survive deletions, backup, and restore. Imported materials are excluded from AI by default; answers can also be deselected.

`context()` includes selected sources and, for review, the current chapter. Draft instructions request source markers such as `[A1]`. The program preserves IDs and original text; it does not verify citations sentence by sentence. A marker helps a person check a claim, but does not prove it.

### Model-independent tasks

`taskPrompt()` defines interview, chapter drafting, review, and simple explanation. Manual handoff includes the corresponding rules and selected language; API use applies the same task rules. Returned text or documented JSON becomes a new draft chapter, without approving facts.

`server.mjs` adapts OpenAI-compatible requests and Anthropic Messages separately. Users configure the service, model, and address. Local inference requires their own compatible model server. MFH does not train a foundation model. Changing AI does not remove local sources or existing chapters.

### Human review and recoverable state

Chapters store their content, origin, update time, and `approved` status. New chapters are drafts. A person marks a chapter reviewed; editing returns it to draft. AI review lists unsupported details, conflicting dates, and privacy concerns, and cannot approve a chapter. Review is currently chapter-level, not a fact-by-fact approval queue.

Source instructions are treated as data, not work rules. This constraint is included in prompts; it has not undergone a complete adversarial prompt-injection evaluation.

`app/app.js` stores multiple projects in IndexedDB, including unfinished answers and the active chapter. `publicProject()` exports allowed fields without credentials. `validateProject()` checks format, version, and size; restore creates a new project identity while retaining source IDs and existing work. Oversized data is rejected rather than silently shortened.

Backups contain text, not original photos, scans, or recordings. Browser storage is not encrypted. Different browsers, origins, ports, and direct-file mode can have separate storage: back up before moving.

### Local runtime and credentials

The frontend uses classic scripts with no build step. Direct-file mode supports writing, editing, and backup. API use needs Node.js 22+ with built-in modules only, bound to `127.0.0.1`. The Windows launcher can download official LTS and verify its SHA-256 before extraction.

The server checks Host, Origin, and a per-run session token. Static serving uses an allowlist; private configuration is not served. Keys entered in the page stay in server memory for that run. Provider errors are sanitized before display. Online inference sends selected text to the configured service; see [privacy guidance](guide.en.md#usage).

### Long manuscripts and present limits

Work chapter by chapter with selected sources. A requested length is guidance, not permission to invent. Source JSON over 100,000 characters triggers a request to reduce or split material. This is a character limit, not automatic model-specific token budgeting. An output-limit notice remains in truncated results.

Cross-chapter dates, names, and repetition still need human coordination. Automatic summaries, semantic retrieval, and whole-book consistency checks are future work. Audio-file ASR, OCR, multiple-narrator fact review, and illustrated layout also remain unimplemented.

### Where the work lives

| File | Responsibility |
| --- | --- |
| `app/core.js` | Data format, validation, selection, task rules, text export |
| `app/app.js` | Interview state, persistence, editing, handoff, printing |
| `app/i18n.js` | Three-language interface, explanations, questions |
| `server.mjs` | Local authentication, transport adapters, sanitized errors |
| `docs/templates.md`, `docs/ai-handoff.md` | Instructions usable by relatives or another AI |

Tests cover data recovery, selection, limits, local access controls, and mocked API transport. Real-browser checks cover writing, languages, handoff, restore, editing, and print output. They do not establish live provider access, interview quality, or full-length memoir performance.

<a id="related-work"></a>

## Reference projects

MFH focuses on a family completing a memoir with the AI they already use: relationship-specific questions, relatives helping with the computer, selected source material, editable chapters, recoverable text, and practical production instructions.

### What was checked

Repository documentation and selected source files were inspected on 2026-10-13. These projects were not run; this is not a performance or quality benchmark.

| Project | Documented or inspected direction | Useful lesson |
| --- | --- | --- |
| [StorySage](https://github.com/ShayanTalaei/StorySage/blob/12f3c9148a3d73e96f61737d9f04d354f08e4dde/readme.md) | Specialized interview and writing agents; a vector-memory implementation | Keep interviewing and writing distinct, and continue from existing memories |
| [memoir](https://github.com/Taoyuesong/memoir/blob/83d3cc65fdb16e33e00f116cec47917ee2863c74/README.md) | Rust/Axum, SQLite, SvelteKit; tools for structured records and context budgeting | Long interviews need durable records and context management |
| [Lorevox](https://github.com/lorevox-hx/lorevox) | Search-cached descriptions discuss Archive → History → Memoir and candidate review | Separate raw recollection, claims, and prose; current code could not be verified |

Lorevox's repository page, API, and raw-file request returned 404 on the inspection date. Cached descriptions do not establish current implementation status.

Code references: StorySage [orchestrator](https://github.com/ShayanTalaei/StorySage/blob/12f3c9148a3d73e96f61737d9f04d354f08e4dde/src/agents/biography_team/orchestrator.py) and [vector memory](https://github.com/ShayanTalaei/StorySage/blob/12f3c9148a3d73e96f61737d9f04d354f08e4dde/src/content/memory_bank/memory_bank_vector_db.py); memoir [tools](https://github.com/Taoyuesong/memoir/blob/83d3cc65fdb16e33e00f116cec47917ee2863c74/backend/src/agent/tools.rs) and [context builder](https://github.com/Taoyuesong/memoir/blob/83d3cc65fdb16e33e00f116cec47917ee2863c74/backend/src/agent/context.rs).

### MFH's implementation focus

Manual AI handoff and API use share task rules and feed chapters back into the same local project. Six relationship types have 156 starting questions per language. Chinese, English, and Spanish explanations support narrators and relatives who do not program. The frontend needs no build; the local service uses Node.js built-ins.

Stable source IDs, explicit material selection, chapter review that resets on editing, additive restore, Markdown, browser printing, and book/album preparation instructions support continuing and keeping the work. Album and NAS integrations are not automated.

Source preservation, human review, local storage, and AI interviewing also appear elsewhere. MFH's distinction is this combination and audience, not an invention of those individual ideas. Its current scope is simpler than multi-agent orchestration, token-aware compression, or candidate fact promotion: selected sources, separate tasks, chapter-level review, and clear size limits. Those advanced systems remain possible future work.

Absence from inspected documentation is not evidence that a competitor lacks a feature. Family usability and interview quality should be measured through actual use, not asserted from this comparison. See [technical design](guide.en.md#architecture).
