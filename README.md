# TRACEWORK — Give reasoning traction

**Round B2.1 · Interactive Source Editing + Stage B stabilisation**  
12 October 2026 · Status: test deployment, NOT final public release.

TRACEWORK is an experimental browser-based architectural design reasoning environment. It connects ambiguous source language to explicit interpretation, grounding, spatial consequence, evaluation and design aims, with optional framework lenses. Its purpose is to make the designer’s reasoning trace inspectable and discussable, not to automate design decisions.

## Getting started

1. Open `index.html` through GitHub Pages (the live repository) or serve this folder through a local web server. Opening it with `file://` may block module and JSON requests.
2. Choose **Quick brief** or **Long brief / document**, paste or upload a source, and select **Start tracing**. The supplied demo/test projects can also be opened on the homepage.
3. Select a highlighted phrase or a hotspot chip. TRACEWORK creates a linked input node in Focus Map; the right inspector prompts a next step.
4. Enter interpretations, grounds and spatial moves. Switch reasoning frameworks when useful; Aggregate Map displays the broader connected project.
5. To **edit a hotspot**, click ✎ beside its chip or **Edit source selection** in the right inspector, type an exact phrase from that brief section or drag across the source excerpt, then **Save selection**. The existing source node and downstream reasoning retain their IDs. **×** deletes the hotspot after confirmation; **Ctrl+Z** restores the previous state.
6. For brief filing, document-mode chunks can be selected, edited or added. **Combine projects** on the homepage creates a separate composite trace from 2+ selected saved projects; originals are preserved.

## What changed in B2.1

- Added true source-bound hotspot **Edit (✎)** for suggested and user-selected hotspots, supporting re-selection of exact words without recreating linked source nodes or deleting existing reasoning.
- Validate edited phrases against their brief section and prevent exact duplicate hotspots. Support text selection directly from the edit modal; provide clear feedback and cancel behaviour.
- Save edit operations into undo history, log revisions, preserve hotspot identity and maintain linkage to the reasoning graph.
- Keep smaller source chips with compact Edit/Delete controls; provide the same Edit action in the right inspector for source nodes and selected hotspots. Preserve left-aligned highlights, cursor hover affordances and responsive hotspot panels.
- Added narrow-panel constraints for inspector form fields to reduce horizontal overflow.
- Replaced an outdated 1-line B1.8 README with detailed usage instructions, changelog, architecture, testing notes and known limitations.
- Kept the B1.9 highlight engine and verified node-drag undo unchanged; versioned script and CSS URLs for cache refresh.

## Previous working improvements — cumulative

| Round | Result |
|---|---|
| Stage A | Alternative structuring frameworks, first-use guidance, provenance, ontology categories, evidence-type distinctions, example scaffolds |
| B1.5–B1.6 | Repaired legacy privacy source wording and overlap attempts; B1.6 was superseded |
| B1.7–B1.8 | Browser Highlight-based overlapping phrase rendering, responsive left alignment, and correct repository folder deployment; initial source test failures were attributable in part to flattened GitHub uploads |
| B1.9 | Friendlier font/bold emphasis; inspector draft preservation when changing views; partial tooltip text stability |
| B2.0 | Half-screen hotspot header wrapping, compact hotspot buttons, pointer cursor on selectable text |
| **B2.1** | **Editable source-bound hotspot selections**, detailed documentation, inspector width constraints |

## Repository and deployment

Site root: `index.html`, `about.html`, `README.md`, `css/`, `js/`, `data/`. `js/app.js` is the module entrypoint. `js/ui/workspace.js` renders source language and hotspots; `js/ui/panels.js` handles inspector content; `js/input/hotspot-detector.js` detects and normalises ranges; `js/core/state.js` manages in-memory state; `js/core/storage.js` stores browser-local projects. `css/` provides UI styles. JSON datasets under `data/` include prompts and reference examples.

**Deploy on GitHub website:** Extract ALL contents of `TRACEWORK_Round_B2.1_DEPLOY.zip`; drag the entire folder contents (especially the nested `css/`, `js/`, `data/` directories) into the repository upload page. Ensure paths remain nested; do not upload the ZIP itself or flatten individual folders. Commit normally. GitHub Desktop is an optional alternative.

Important: TRACEWORK saves locally in the browser via `localStorage` (`tracework.projects.v3`). Deploying code does not reset stored traces. **Do not clear site data** to fix a visual bug. Export a JSON backup before any intentional cleanup. Combining projects makes copies and preserves originals.

## B2.1 acceptance tests

1. Open a long brief (the pavilion test) → Privacy → select `Different degrees of privacy`, then select a shorter overlapping term. The full phrase remains bold/highlighted, with natural wrapping.
2. In hotspot chips, click **✎** on Privacy. Replace `Different degrees of privacy` with `privacy` (when not already stored as an identical hotspot), or drag an alternative phrase in the modal. Save; confirm the chip and source-node label update while linked interpretations remain.
3. Attempt to type a phrase absent from the brief: Save should be disabled and the original hotspot should remain unchanged.
4. Click **×** on a test hotspot, confirm, then **Ctrl+Z** to restore. Move a graph node and **Ctrl+Z** as a quick regression check if needed.
5. Half-screen: source header, chip Edit/Delete controls and inspector inputs should fit without horizontal clipping. Type and Backspace in a right-panel draft and switch inspectors to ensure editing survives.
6. On the home screen, select two projects and Combine. Confirm a NEW combined project is created and the originals are still present.

## Known limitations / Stage C backlog

- Browser-local data is device-specific; shared accounts/classroom persistence is not yet implemented.
- Changing the underlying **brief text/chunk** triggers reanalysis, unlike editing a specific hotspot selection. Reanalysis can replace hotspot IDs: export first if you need exact provenance across major brief revisions.
- Combine projects creates a separate composite project; independent update synchronization between source projects and composite is not implemented.
- Splitting a large brief into independently exported files and combining multiple brief files within one project remain future work (distinct from combining whole projects).
- Full end-to-end regression, comprehensive responsive layout testing, Aggregate Map refinements and framework-aware Arrange Map are later Stage C priorities.
- Browser application behaviours are ultimately confirmed after GitHub Pages deployment, not by static syntax or ZIP checks alone.

## Research frame

TRACEWORK belongs to *Traction Through Translation*: tracing the interval from source language to architectural decision. The grammar is a scaffold rather than a mandatory universal sequence; multiple reasoning frameworks and source provenances should stay legible.
