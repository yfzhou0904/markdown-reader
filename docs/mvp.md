# MVP Plan

## Goal

Ship a local macOS desktop app that turns pasted or typed Markdown into a comfortable reading surface with persistent presentation settings.

## Product decisions

- local-first: the app works without accounts, sync, or network dependence
- reading-first: the UI should feel closer to a reading app than a code preview
- draft-first: the current document is an unsaved working draft restored on relaunch
- draft-tabs: the app can keep multiple unsaved local drafts open as tabs in one window
- narrow controls: typography and theme settings are curated rather than endlessly configurable
- macOS-native shell: window state and title bar behavior can use Tauri-native integrations when that improves the reading experience

## Success criteria

- the app works fully offline
- a pasted or typed Markdown document renders within a reader-oriented layout
- reader settings persist across app restarts
- open drafts persist across app restarts
- the experience feels closer to a reading app than a code tool

## MVP functional requirements

### 1. Document input

- paste or type plain Markdown into the source pane
- open multiple unsaved local drafts as tabs
- restore open tabs and the active tab on launch

### 2. Rendering

- render Markdown with `react-markdown` and `remark-gfm`
- support common GitHub-flavored Markdown structures including tables and task lists
- render LaTeX math with KaTeX for `$$...$$`, `\[...\]`, and `\(...\)`
- open external HTTP(S) links safely in a new window
- render Mermaid code fences as diagrams when valid, and fall back to code blocks when invalid
- do not execute raw HTML from the document

### 3. Reader controls

- choose font family from a small curated set
- adjust font size
- support keyboard shortcuts for font size in reader view
- support `Cmd/Ctrl+T` for a new tab
- support `Cmd/Ctrl+W` to close the active tab
- adjust font weight
- adjust line height
- switch among light, paper, and dark themes
- open an immersive reader view separate from the source pane
- open preferences in a modal rather than a persistent settings rail

### 4. Local persistence

- save preferences in local storage
- save open tabs and the active tab in local storage
- restore both on relaunch

### 5. Desktop behavior

- package as a Tauri desktop app
- restore the previous window size and position on relaunch
- on macOS, keep the native title bar visually aligned with the active reader theme

## Out of scope

- account system
- sync across devices
- collaborative editing
- plugin architecture
- publishing workflow
- public URLs
- rich Markdown authoring tools
- opening local files
- recent files
- syntax highlighting
- arbitrary layout controls such as reader width sliders
- mobile app

## Acceptance checklist

- can paste or type Markdown and immediately read it
- no network access is required for the core flow
- changing controls updates the reader instantly
- relaunch preserves prior reader settings
- relaunch restores open drafts and the active tab
- reader view is available without losing the underlying draft
- multiple drafts can stay open without leaving the main window
- large documents remain usable
