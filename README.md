TRACEWORK Round B1.9 — website deployment

Extract this ZIP first. Drag the css/, data/, js/ folders plus index.html, about.html, README.md and other root files together into the GitHub repository upload area so the folders remain intact. Do not upload the ZIP itself or individual folder contents at the repository root.

Round B1.9 changes:
- Restore readable Inter source typography (12 px) and bold hotspot text; retain native continuous, correct multiline highlights.
- Stabilise right inspector input drafts across redraws and source/hotspot switching; reject stale async inspector responses.
- Preserve prior B1.8 project combination, undo and classifier tooltip behavior; no browser data reset.
- Versioned CSS/JS assets (b1.9) and visible source renderer label.

Test: Privacy/Users highlight, editor Backspace, right inspector draft after Hide suggestions, half-screen width.
