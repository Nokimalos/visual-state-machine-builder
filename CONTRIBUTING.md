# Contributing to Visual State Machine Builder

Thank you for considering contributing. This document explains how to run the project, the codebase structure, and how to propose changes.

## Getting started

1. Fork and clone the repo.
2. Install dependencies: `npm install`
3. Start the dev server: `npm run dev`
4. Open http://localhost:5173

## Linting

We use [Oxlint](https://oxc.rs/) for fast, ESLint-compatible linting:

```bash
npm run lint
```

Fix any reported issues before submitting a PR.

## Project structure

```
src/
  model/          # State machine types and validation
  store/          # Editor state (undo/redo, CRUD)
  generators/     # Code generators (useReducer, XState, Zustand)
  components/     # React UI (Canvas, Sidebar, Toolbar, etc.)
  hooks/          # useMachineModel
  utils/          # Export, diagram history, etc.
```

## Adding a new template

1. Open [src/components/TemplateGallery.tsx](src/components/TemplateGallery.tsx).
2. Use the existing `buildTemplate(name, states, transitions, initialLabel)` helper.
3. Add a new entry to the `TEMPLATES` array with `id`, `name`, `description`, and `model` (from `buildTemplate`).
4. States are objects like `{ label: 'loading', type: 'loading' }`; use `contextSchema` for payload types (e.g. `{ error: 'string' }`).

## Adding a new code generator

1. Add a new file under `src/generators/`, e.g. `myFormat.ts`, exporting a function `generateMyFormat(model: StateMachineModel): string`.
2. Extend `OutputFormat` in [src/model/types.ts](src/model/types.ts) with the new option.
3. In [src/utils/export.ts](src/utils/export.ts), add a case in `generateCode()` and wire the new format.
4. In [src/components/Sidebar.tsx](src/components/Sidebar.tsx), add an `<option>` in the "Output format" select and update `FORMAT_HINTS` if needed.

## GitHub Issues and labels

When opening an issue, please use one of these labels (create them in the repo if missing):

| Label | Use for |
| ----- | ------- |
| `good first issue` | Small, well-scoped tasks for new contributors |
| `enhancement` | New features or improvements |
| `bug` | Something that doesn’t work as expected |

## Commits

Prefer clear, concise messages (e.g. "Add Pagination template", "Fix dropdown closing on state type select"). Conventional commits (`feat:`, `fix:`) are optional but welcome.
