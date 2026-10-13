# Memory for Human development instructions

- Read root README.md and docs/ai-handoff.md first. Existing English and Spanish documents are grouped under docs/translations/.
- Maintain only the Chinese README by default. Do not rewrite or synchronize other-language READMEs unless the user asks. Relocation may require link-only repairs; preserve their prose.
- This is a local-first memoir tool for nontechnical users. Use plain everyday wording. Keep Chinese, English, and Spanish UI behavior in sync; README translations are retained snapshots.
- Project-owned code, documentation, and assets use Apache-2.0 OR MIT, at the recipient's choice. Preserve all third-party notices. License declarations in retained translations must match the current project license; otherwise keep their README prose unchanged.
- Keep the repository compact. Chinese documentation is consolidated into docs/guide.md, docs/templates.md, docs/ai-handoff.md, docs/technical.md, and docs/development.md. Add sections to the relevant document instead of creating overlapping guides.
- Frontend: buildless classic scripts in `app/`, root `index.html`. Classic scripts intentionally support direct file mode. No framework or frontend package install is required.
- Server: `server.mjs`, Node.js 22+ built-ins, loopback only. Start with `node server.mjs`; Windows users have `start.cmd`; other systems have `sh start.sh`.
- Core data format: `memory-for-human`, version 2. Import is additive. Do not silently overwrite existing memoirs or lose source material. Preserve uncertainty and narrator approval rules.
- Never read, print, commit, or export real API keys. `user-config.local.json` and `.mfh-runtime/` are private local files. Use dummy keys in tests.
- The proxy authenticates same-origin local requests. Keep secret files out of static serving and sanitize provider errors.
- Implemented: text workflows, browser dictation where supported, local persistence, API adapters, manual AI handoff, AI rewrites retaining previous drafts, local JPG/PNG/WebP photos with descriptions and significance, text-based AI placement suggestions requiring human confirmation, JSON backup including photos, Markdown/photo ZIP, browser printing.
- Never include original image data in model context or manual AI handoff. Send only selected photo descriptions and task-scoped chapter text. Reconfirm photo positions after chapter or metadata changes. Keep original uploaded bytes in backup and book packages.
- Not implemented: audio-file ASR, image recognition/OCR, platform-specific account import, professional print layout, automatic album/NAS integrations. Keep status claims accurate.
- Run `npm test` for relevant core/server changes, and real browser checks for changed flows. Test API transport with mocks unless the human explicitly provides authorization and credentials for a live call. Never claim simulated tests verify live provider access.
- Keep only the six app help previews in preview/: README.html, README.en.html, README.es.html, guide.html, guide.en.html, guide.es.html. Do not generate a separate HTML copy of every source document. Never replace the interactive root index.html with a README preview.
