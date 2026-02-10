# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

- (Add new changes here)

## [0.1.0] - 2026-02-07

### Added

- Visual canvas (React Flow) to draw state machines: states as nodes, transitions as edges with event labels
- Output format: useReducer, XState, Zustand with full TypeScript types
- Templates: Async fetch, List with empty, Form submit
- Save / Open diagram as JSON; in-app History (localStorage) for recent diagrams
- Custom event name modal when connecting two states (no browser prompt)
- Persisted node positions (saved in model and JSON)
- Toolbar: New, Open, Save, History, Undo/Redo, Copy code, Download .ts, Snippet for AI
- Sidebar: output format selector, states list (add/edit/remove, set initial), transitions list (edit event, remove)
- Validation: initial state required, valid event names, deterministic transitions
- Dark theme (Tailwind), toasts (Sonner), Oxlint

### Technical

- Model: `StateMachineModel`, `StateNode`, `Transition` in `src/model/types.ts`
- Generators: `src/generators/useReducer.ts`, `xstate.ts`, `zustand.ts`
- Editor store with undo/redo in `src/store/editorStore.ts`

[Unreleased]: https://github.com/Nokimalos/visual-state-machine-builder/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/Nokimalos/visual-state-machine-builder/releases/tag/v0.1.0
