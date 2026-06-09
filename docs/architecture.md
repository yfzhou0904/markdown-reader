# Architecture Notes

## App shape

The app stays simple:

- `frontend`: React UI for source input, reader surface, preferences, and reader mode
- `desktop shell`: Tauri for packaging plus window-specific native behavior
- `render pipeline`: `react-markdown` + `remark-gfm` with a Mermaid override
- `local state`: draft and reader preferences in browser storage

Integration points:
- [src/App.tsx](../src/App.tsx)
- [src/Mermaid.tsx](../src/Mermaid.tsx)
- [src/App.css](../src/App.css)
- [src-tauri/src/lib.rs](../src-tauri/src/lib.rs)
- [src-tauri/tauri.conf.json](../src-tauri/tauri.conf.json)

## State model

- `document state`: one current Markdown draft string
- `reader settings`: theme, font family, font size, and line height
- `view state`: whether reader mode or preferences modal is open
- `derived state`: word count, estimated reading time, rendered Mermaid output

Document and settings persist independently under stable local-storage keys.

## Rendering pipeline

The document is rendered directly from Markdown in the React tree rather than through a prebuilt HTML string.

- `react-markdown` handles Markdown rendering
- `remark-gfm` adds tables, task lists, and related GitHub-flavored Markdown features
- external links get `target="_blank"` and `rel="noopener noreferrer"`
- Mermaid fences are intercepted and rendered client-side with strict Mermaid security settings
- invalid Mermaid falls back to showing the original code block

The app treats Markdown as untrusted input by not enabling raw HTML rendering.

## UI model

- default mode is a two-pane shell: source on the left, reader on the right
- reader mode turns the preview into the primary surface without destroying the draft
- preferences live in a modal instead of an always-visible sidebar
- controls stay intentionally narrow: font family, font size, line height, theme, and reset

The product decision is to optimize for reading comfort, not authoring power.

## Persistence model

- the frontend stores the current draft and settings in local storage
- the Tauri shell restores native window size and position across relaunches
- on macOS, the frontend can push theme changes into the native window background so the transparent title bar tracks the active reader theme

## Security

- no runtime backend
- no remote fetch requirement for core rendering
- do not enable raw HTML rendering from Markdown
- Mermaid runs with `securityLevel: "strict"`
- avoid exposing arbitrary local file contents through any embedded HTTP mechanism
