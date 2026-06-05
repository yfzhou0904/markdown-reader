# Markdown Reader

Offline desktop Markdown reader built with `Tauri 2 + React + TypeScript`.

The app is functional today. It provides a two-pane reading surface: raw Markdown input on the left and a rendered reader pane on the right, with local persistence for both the document draft and reader settings.

## Current functionality

- edit or paste raw Markdown in a textarea
- render Markdown into a sanitized reading view
- adjust reader settings:
  - font family
  - font size
  - line height
  - content width
  - theme (`paper`, `sepia`, `dark`)
- persist the current draft in local storage
- persist reader settings in local storage
- show basic reading stats:
  - word count
  - estimated reading time
- reset the document and settings to defaults

## Current implementation notes

- Markdown rendering uses `markdown-it`
- rendered HTML is sanitized with `dompurify`
- raw HTML inside Markdown is disabled
- the app currently runs as a split-pane reader/editor shell
- persistence is frontend-side for now; no Tauri storage plugin is in use yet

## Repo structure

- `src/`: React app UI and reader behavior
- `src-tauri/`: Tauri desktop shell
- `docs/`: planning notes that still describe intended follow-on work

## Tooling

- `pnpm`
- `Vite`
- `React`
- `TypeScript`
- `Tauri 2`

## Development

Install dependencies:

```bash
pnpm install
```

Run the frontend:

```bash
pnpm dev
```

Build the frontend:

```bash
pnpm build
```

Run the desktop app:

```bash
pnpm tauri dev
```

Build the desktop app:

```bash
pnpm tauri build
```

## Linux note

The project target is macOS, but frontend work can be done on Linux. Running Tauri locally on Linux requires the usual GTK/WebKit system packages. If those are missing, `pnpm build` is still the useful validation path for frontend changes.

## Planning docs

These are still useful, but they are planning documents, not an exact statement of shipped behavior:

- [docs/mvp.md](/home/sprite/markdown-reader/docs/mvp.md)
- [docs/architecture.md](/home/sprite/markdown-reader/docs/architecture.md)
- [CONTRIBUTING.md](/home/sprite/markdown-reader/CONTRIBUTING.md)
