# Contributing

This project is intentionally narrow. Keep changes aligned with the MVP.

## Current phase

Active target: `Phase 1 / MVP`

Before broadening scope, verify that a change improves one of these jobs:

- get Markdown into the app quickly
- render it as comfortable long-form reading
- let the reader tune presentation
- preserve local state between sessions

## Working rules

- Prefer proven libraries over custom infrastructure.
- Keep the product reading-first, not editor-first.
- Default to offline-safe choices.
- Treat raw HTML inside Markdown as untrusted.
- Keep the UI sparse and calm.

## Definition of done for MVP changes

A change is complete when:

- behavior works end to end
- the code fits the chosen app architecture
- obvious regressions are tested
- docs are updated when scope or decisions changed

## Testing expectations

For MVP work, test depth should scale with risk:

- UI preference changes: verify persistence across relaunch
- Markdown rendering changes: test representative fixtures
- file/open or clipboard flows: verify with realistic local inputs
- platform integrations: manual verification on macOS

## Scope control

Open a design note before introducing:

- new storage systems
- sync features
- plugin hooks
- alternate editor modes
- embedded network services

These are likely post-MVP concerns.

## Security constraints

- No backend is required for MVP.
- Do not expose local files or environment data through HTTP endpoints.
- Sanitize rendered output before presenting it in the reader surface.
