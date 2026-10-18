# TRACEWORK — Give reasoning traction

**Current code baseline:** D1.6 (18 October 2026). **Status:** consolidated UI/provenance development release; deployed-browser acceptance testing required before freeze.

TRACEWORK is a browser-based research prototype for making architectural design reasoning explicit and inspectable. It helps designers trace language, interpretation, supporting grounds, spatial propositions, evaluation and design goals. It **does not** certify design decisions, infer a person's historical thoughts, or automatically produce verified architecture.

**Live website:** https://aliuuah23.github.io/reasonwithtracework/

## Start here

1. Open the website; choose **Quick brief** or **Long Brief or Document** and start a trace. Alternatively, use the optional **Try long + short examples** control. A first-time browser is not seeded with examples automatically.
2. Select a phrase or interpretive hotspot in your source. Develop connected reasoning nodes; use the right-hand guidance and optional links, alternatives and evaluations.
3. Switch between **Focus Map** and **Aggregate Map**; choose **Original Map** or **Arrange Map** when appropriate. Framework views are analytic lenses and should not be mistaken for participants' recorded reasoning.
4. Use **My Trace** to inspect saved projects, run a project check and export a JSON backup. Use **Export map** and its preview for SVG, PNG or vector PDF (Chrome print-to-PDF).

Projects are currently stored **in this browser on this device**. Before clearing browser data or changing computers, **export a JSON backup**. Opening the site on another device does not transfer projects automatically.

## Capabilities in the D1.6 codebase

- Editable brief hotspots; linked thought nodes; optional branches, rejections, connections and undo.
- TRACEWORK Grammar, Freeform (Low Structure) and six adapted research-framework lenses.
- Original/Arrange map views including focus and focused pathways; arrangement coordinates are separate from authored originals; alignment, fit/zoom and guided connection explanations.
- **Gap in Reasoning** and **Provenance Gap** advisories; consistent Attribution, Generation Activity and Supporting Record fields in command input, node editor and inspector (conceptually informed by PROV-O).
- Independently retractable Brief and Guidance edge tabs, a full-width bottom command dock, a shorter toolbar, and per-project saved map viewport.
- Spatial Reading Studio, curated feature examples, built-project references and linked reading/search resources.
- Project export/import, combined-project copies, project checks and map export previews.

**D1.6 refinement:** The dock no longer floats over reasoning nodes; side-panel controls sit away from headings; Edit Node requires explicit dismissal; help buttons open visible explanations; connection release accepts a destination node body; tutorial spotlights follow without constant layout polling; interface labels avoid awkward slash-separated wording.

**Important:** Source-level checks do not establish a green-lit deployed experience. D1.6 browser testing remains necessary, particularly focused arrangements, viewport restore and provenance edits.

## Guides and research

- [User guide](docs/user-guide.md) — core workflow, maps, provenance, exports and safe recovery.
- [Research foundations](docs/research-foundations.md) — research positioning and interpretive limits.
- [Developer notes](docs/developer-notes.md) — architecture, deployment and regression tests.
- [Changelog](CHANGELOG.md) — concise release progression.
- [Historical notes](docs/archive/INDEX.md) — complete original release TXT files and the original README, preserved rather than deleted.

## Deployment from a repository copy

This is a static GitHub Pages website. Keep `index.html`, `about.html`, `css/`, `js/` and `data/` at the repository root. Upload the **contents** of the deployment ZIP with these directory paths intact; do not flatten them into a single folder. Running from `file://` can block browser module and JSON fetching; GitHub Pages or a local HTTP server is required.

D1.6 updates the actual website code and its existing documentation; no new root-level change-note files are created. Historical notes remain preserved under `docs/archive/`.

## Current limitations and planned work

- Browser-local storage, no cloud accounts or cross-device sync; large image uploads are not supported by the current node system.
- Spatial Read is curated and bounded; generic research-search links are not verified source citations.
- Framework comparison, contextual prompts, Decision Digest, image/reference nodes and resizable nodes remain under development or verification.
- Full deployed-browser regression (responsive UI, provenance edits, focus/aggregate arrangements, viewport restoration, map/export recovery) is required before a freeze.

For historic details or older release-specific tests, consult the [archive](docs/archive/INDEX.md); those notes may describe **superseded** controls and must not be used as the current user instructions.
