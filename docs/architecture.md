# Architecture Notes

## App shape

The app should stay simple:

- `frontend`: React UI for input, reader surface, and controls
- `desktop shell`: Tauri for packaging and native file integration
- `render pipeline`: Markdown parser + sanitizer + syntax highlighter
- `local state`: preferences and draft persistence

## Recommended structure

```text
markdown-reader/
  README.md
  CONTRIBUTING.md
  docs/
    architecture.md
    mvp.md
  src/
    App.tsx
    App.css
    main.tsx
  src-tauri/
```

## State model

Keep state separated by concern:

- `document state`: current Markdown source, open file metadata, last draft
- `reader settings`: theme, font family, font size, line height, width
- `derived render state`: rendered HTML and parse errors if any

Reader preferences should persist independently from any specific document.

## Rendering pipeline

Preferred order:

1. ingest raw Markdown
2. parse to HTML
3. sanitize output
4. apply syntax highlighting
5. render inside the reader surface

The app should assume pasted Markdown may contain raw HTML and handle it defensively.

## UI model

Phase 1 should favor a simple shell:

- source input area
- reader preview area
- compact control bar for presentation settings

The visual emphasis should stay on the reader pane, even if the source pane is visible.

## Persistence model

For MVP, local persistence is enough:

- store reader settings under a stable app key
- store the last unsaved Markdown draft
- optionally store recent file paths later

Whether this lives in frontend storage or a Tauri-side store can be decided during implementation.

## Security

- no runtime backend
- no remote fetch requirement for core rendering
- sanitize untrusted Markdown output
- avoid exposing arbitrary local file contents through any embedded HTTP mechanism
