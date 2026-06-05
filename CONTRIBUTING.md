# Contributing

Start with [`docs/`](./docs/). It is the project reference point:

- [`docs/README.md`](./docs/README.md) explains how docs should be written
- [`docs/mvp.md`](./docs/mvp.md) captures product scope and open gaps
- [`docs/architecture.md`](./docs/architecture.md) describes the intended app shape

When code and planning docs differ, treat shipped behavior in `src/` and `src-tauri/` as the source of truth, then update `docs/` if the change affects scope or architecture.

## Project shape

- `src/`: React reader UI, Markdown render pipeline, and local persistence
- `src-tauri/`: Tauri desktop shell
- `docs/`: concise product and architecture notes

## Contribution rules

- Keep the app reading-first, offline-safe, and intentionally narrow.
- Prefer small changes over broad refactors.
- Treat Markdown as untrusted input; keep sanitization intact.
- Do not add HTTP endpoints or anything that could expose local files, env vars, or credentials.
- Update `docs/` when behavior, scope, or architecture changes.

## Validation

- Install: `pnpm install`
- Frontend dev: `pnpm dev`
- Frontend build: `pnpm build`
- Desktop app: `pnpm tauri dev`

For UI and rendering changes, manually verify Markdown rendering, settings persistence, and reset/fullscreen flows.
