# MVP Plan

## Goal

Ship a local macOS desktop app that turns raw Markdown into a comfortable reader experience with persistent presentation settings.

## User story

As a user reading long AI-generated or hand-written Markdown documents, I want to paste or open Markdown and read it in a polished, typography-driven interface without needing a browser tab or a technical preview tool.

## Success criteria

- the app works fully offline
- a pasted Markdown document renders within a reader-oriented layout
- reader settings persist across app restarts
- the experience feels closer to a reading app than a code tool

## MVP functional requirements

### 1. Document input

- paste plain Markdown from clipboard
- open local `.md` files
- restore the last unsaved draft on launch

### 2. Rendering

- convert Markdown to sanitized HTML
- support standard Markdown structures:
  - headings
  - paragraphs
  - emphasis
  - links
  - lists
  - blockquotes
  - code fences
  - tables
  - task lists
- syntax highlight code blocks

### 3. Reader controls

- choose font family from a small curated set
- adjust font size
- adjust line height
- adjust content width
- switch among light, dark, and sepia themes

### 4. Local persistence

- save preferences locally
- save last document locally
- restore both on relaunch

## Out of scope

- account system
- sync across devices
- collaborative editing
- plugin architecture
- publishing workflow
- public URLs
- rich Markdown authoring tools
- mobile app

## Suggested implementation order

1. Scaffold Tauri + React + TypeScript app
2. Build base two-pane shell: input + reader
3. Add Markdown render pipeline with sanitization
4. Implement CSS variable-based reader controls
5. Persist document and settings locally
6. Add file-open workflow
7. Add syntax highlighting
8. Manual polish pass for typography and spacing

## Acceptance checklist

- can paste Markdown and immediately read it
- no network access is required for the core flow
- changing controls updates the reader instantly
- relaunch preserves prior reader settings
- relaunch restores the previous draft
- large documents remain usable

## Open questions

- whether to use `markdown-it` or `remark/rehype`
- whether the default view is split-pane or reader-first with collapsible source
- where Tauri-side persistence should live versus frontend storage
