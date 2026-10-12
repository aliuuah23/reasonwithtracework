# TRACEWORK B1.1 — Highlight + Undo + Readability Fixes

Deploy over the current B1 build.

Changes:
- Re-resolves hotspot highlights against the actual visible chunk text so stale offsets cannot split words/phrases.
- Inline hotspot highlights wrap naturally across lines.
- Node/group dragging is now captured by Ctrl/Cmd+Z as a single undoable move.
- Classifier help tooltips are edge-safe in compressed/half-screen layouts.
- Classifier explanation text wraps fully instead of being truncated with ellipses.

Suggested commit message:
`Fix hotspot rendering and workspace undo`
