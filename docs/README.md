# Documentation Style Guide

## Goal

Help a newly-onboarded developer understand the app. Every doc should be concise, information-dense, and point to key implementation code as the source of truth.

## Progressive Disclosure

Hub docs (`docs/<module>.md`) give the full picture in under two minutes — purpose, model, lifecycle — then link to subdocs. Subdocs (`docs/<module>/<topic>.md`) go deep on one concern.

## What to include

1. **Purpose** — one or two sentences explaining what the thing does.
2. **Key concepts** — data model, config, or domain terms (only if not obvious from code).
3. **Behavior** — how it works at a high level: lifecycle, triggers, invariants.
4. **Integration points** — source file paths so readers can dive into code.
5. **Related docs** — links to sibling docs if relevant.

## What to leave out

- Information easily gleaned from reading the code itself.
- Lengthy walkthroughs or step-by-step tutorials - I believe every system, however large its internals can be, should be described in 1-3 sentences.
- Things we do not currently implement - `docs/` should describe what this app does today.

## Conventions

- Target `<100` lines per doc. Split into `docs/<module>/` hierarchy if necessary.
