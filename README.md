# Markdown Reader

Offline macOS desktop app for reading raw Markdown as polished long-form text.

This repository now contains the initial `Tauri 2 + React + TypeScript` scaffold for the app, plus the planning docs that define the Phase 1 MVP.

## Goal

Build a reading-first Markdown desktop app that feels closer to Safari Reader, Instapaper, or Kindle than a technical Markdown previewer.

Core product traits:

- paste-first workflow
- calm typography
- adjustable reading controls
- local-only state
- no network dependency at runtime

## Phase 1 MVP

The MVP should deliver:

- a macOS desktop app shell
- paste or open raw Markdown
- render a clean reader view
- adjustable font family, font size, line height, and content width
- theme selection: light, dark, sepia
- persistent local preferences
- fully offline operation

## Repo structure

- `src/`: React frontend
- `src-tauri/`: Tauri desktop shell
- `docs/`: MVP and architecture planning docs

## Tooling

- `pnpm`
- `Vite`
- `React`
- `TypeScript`
- `Tauri 2`

## Getting started

Install dependencies:

```bash
pnpm install
```

Run the frontend only:

```bash
pnpm dev
```

Build the frontend:

```bash
pnpm build
```

Run the Tauri desktop app:

```bash
pnpm tauri dev
```

Build the desktop app:

```bash
pnpm tauri build
```

## Linux note

This project targets macOS, but scaffolding may happen in Linux environments. Running `pnpm tauri dev` on Linux requires Tauri system dependencies such as `webkit2gtk`. If those packages are missing, frontend builds can still be validated separately.

## Planning docs

- [docs/mvp.md](/home/sprite/markdown-reader/docs/mvp.md)
- [docs/architecture.md](/home/sprite/markdown-reader/docs/architecture.md)
- [CONTRIBUTING.md](/home/sprite/markdown-reader/CONTRIBUTING.md)

## Status

The app is scaffolded. Actual MVP feature implementation has not started yet.
