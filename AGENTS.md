# Memory for Human development instructions

- Read README.md / README.en.md / README.es.md and the applicable AI-HANDOFF document.
- This is a local-first memoir tool for nontechnical users. Use plain everyday wording. Keep Chinese, English, and Spanish UI and help in sync.
- Frontend: buildless classic scripts in `app/`, root `index.html`. Classic scripts intentionally support direct file mode. No framework or frontend package install is required.
- Server: `server.mjs`, Node.js 22+ built-ins, loopback only. Start with `node server.mjs`; Windows users have `start.cmd`; other systems have `sh start.sh`.
- Core data format: `memory-for-human`, version 2. Import is additive. Do not silently overwrite existing memoirs or lose source material. Preserve uncertainty and narrator approval rules.
- Never read, print, commit, or export real API keys. `user-config.local.json` and `.mfh-runtime/` are private local files. Use dummy keys in tests.
- The proxy authenticates same-origin local requests. Keep secret files out of static serving and sanitize provider errors.
- Implemented: text workflows, browser dictation where supported, local persistence, API adapters, manual AI handoff, JSON text backup, Markdown, browser printing.
- Not implemented: audio-file ASR, images/OCR, platform-specific account import, automatic layout/NAS integrations. Keep status claims accurate.
- Run `npm test` for relevant core/server changes, and real browser checks for changed flows. Test API transport with mocks unless the human explicitly provides authorization and credentials for a live call. Never claim simulated tests verify live provider access.
- Preview documentation is under `preview/`. Do not replace the interactive root `index.html` with a generated README preview.
