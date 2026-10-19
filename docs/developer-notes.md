# TRACEWORK — Developer Notes (D2.0 development release)

## Static architecture

This is a browser-only static website hosted on GitHub Pages. Keep the following at the **repository root**:

- `index.html` — main interface.
- `about.html` — research/framework pages.
- `css/` — base, layout, component, graph and responsive styles.
- `js/app.js` — main module entry; `js/core/` state/storage/framework logic, `js/graph/` rendering and connections, `js/input/` brief parsing/classification, `js/evidence/` external/reference handling, `js/ui/` panels and tutorials, `js/reasoning/` reasoning and spatial guidance.
- `data/` — JSON examples, references, case studies and support tables.
- `README.md`, `CHANGELOG.md`, `docs/` — documentation only.

Do not flatten nested directories when uploading through GitHub. A local `file://` page may not load modules or data; use GitHub Pages or an HTTP server for complete testing. Changes to module/style imports may require a hard refresh due to caching.

## Storage and compatibility

The browser store key is `tracework.projects.v3` (active project: `tracework.activeProject.v3`); see `js/core/storage.js`. Existing saved projects are not server-hosted, so deploying files cannot migrate or restore a separate device's `localStorage`.

Preserve node IDs, edge endpoints, hotspot range/source references, recorded provenance and project metadata when refining implementations. Avoid destructive schema migrations or silently interpreting legacy attribution. `ensureProject` avoids replacing an existing example. JSON export/import is the user's recoverable backup mechanism; restored duplicates should not overwrite originals. Project reset requires deliberate user confirmation.

Image/reference node proposals must address browser quota and image asset persistence before deployment. Merely embedding high-resolution image strings into existing `localStorage` could make project saves unreliable.

## Deployment

1. Extract the full deployment ZIP. Preserve the `css/`, `js/`, `data/` and `docs/` folder structure.
2. Commit the **directory changes** into the correct repository root; verify that upload did not produce `css.js`-style flattening or an extra nested top-level folder.
3. After GitHub Pages updates, hard-refresh the live site and check startup, navigation and a saved project. Never reset local data to address cache issues.

**Documentation-only cleanup — important:** Uploading a ZIP through the GitHub website **does not remove old files**. To finish moving the 27 historical root-level TXT files into `docs/archive/`, prefer GitHub Desktop: open the repository working folder, copy the cleaned package contents into it, delete the old root-level `*.txt` release notes (now safely present under `docs/archive/`), review the git changes, and commit. The archived legacy README is also preserved. Do **not** remove JS/CSS/HTML/data files. You may alternatively upload the new docs with GitHub Web and remove old TXT files separately through individual GitHub deletions; they will otherwise remain visible at the root.

## Regression/acceptance checklist

D1.4 must be browser-tested before any freeze: full and half-width navigation; Brief/Guidance panel retraction individually and together; node edit, save/reload and metadata review; independent Gap in Reasoning and Provenance Gap warnings including after editing; connection handling and wire selection; Original/Arrange map movement, undo, Fit Map; framework switching without changing authorship; Spatial Reading distinction between feature examples and built precedents; SVG/PNG/PDF map export preview; project JSON backup/import and duplicate-safe recovery; onboarding and optional examples.

Source syntax/data integrity checks are valuable but cannot certify full-browser interactions. Record Pass / Needs Refinement / Fail against the deployed build and correct regressions before asserting acceptance.

## Documentation maintenance

- Update **README.md** only for the current user-facing baseline and key limitations.
- Add brief version lines to **CHANGELOG.md**; link full technical notes within `docs/` if genuinely required.
- Preserve existing `docs/archive/` contents; do not create another release-note TXT at the repository root.
- Do not present legacy release-specific test instructions as current product documentation.


## D1.5 focused acceptance checks (18 October 2026)

D1.5 adds compact workspace controls, expandable command-line Attribution / Generation Activity / Supporting Record fields, node/editor/inspector metadata consistency, named contributors and sources, and independent focus/path arrangements. It preserves existing `data/` JSON unchanged. No formal PROV-O/RDF compliance is claimed.

After deploying, smoke-test (1) both Brief/Guidance edge tabs at full/half screen, (2) command-line metadata creation → edit → inspector → JSON backup → reopening, (3) per-project canvas scroll and zoom restoration, (4) Original → Arrange in Focus Map, Focus Path and Aggregate Map, with node dragging and undo, (5) export preview with "Automatically arrange export" unchecked to verify the visible arrangement, and (6) tutorial click-outside dismissal, repositioning, and Close-button scale.

Source syntax/JSON/HTML and import checks do not replace real browser interaction. No new root-level deployment-note TXT files are needed; update `CHANGELOG.md` and this guide instead.

## D2.0 modular guidance and regression

The new `js/reasoning/framework-intelligence.js` exposes pure (non-mutating) context-aware start/next suggestions, two-lens comparison and a Markdown Decision Digest. The **Reasoning Tools** modal in `js/app.js` uses these functions without changing node IDs, types, provenance or layout state. It inserts editable draft text into the command input only after an explicit action.

Regression: verify D1.9 metadata dismissal, modal selection-drag safety, tutorial spotlight, wire dragging, local project persistence and export. Verify D2 suggestions for seating/privacy/circulation, compare recorded vs inferred roles without rewriting nodes, Freeform unclassified creation and later deliberate categorisation, and Decision Digest copy/download while preserving rejected alternatives. Classification tests include direct spatial actions and resulting spatial effects; heuristic percentages are not correctness probabilities.
