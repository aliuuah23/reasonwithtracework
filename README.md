# TRACEWORK — Give reasoning traction

**Current development release:** D2.2 Architectural Propositions (19 October 2026). **Accepted usability baseline:** D1.9; D2.2 live-browser verification pending.

TRACEWORK is a browser-based research prototype for making architectural design reasoning explicit and inspectable. It helps designers trace language, interpretation, supporting grounds, spatial propositions, evaluation and design goals. It **does not** certify design decisions, infer a person's historical thoughts, or automatically produce verified architecture.

**Live website:** https://aliuuah23.github.io/reasonwithtracework/

## Start here

1. Open the website; choose **Quick brief** or **Long Brief or Document** and start a trace. Alternatively, use the optional **Try long + short examples** control. A first-time browser is not seeded with examples automatically.
2. Select a phrase or interpretive hotspot in your source. Develop connected reasoning nodes; use the right-hand guidance and optional links, alternatives and evaluations.
3. Switch between **Focus Map** and **Aggregate Map**; choose **Original Map** or **Arrange Map** when appropriate. Framework views are analytic lenses and should not be mistaken for participants' recorded reasoning.
4. Use **My Trace** to inspect saved projects, run a project check and export a JSON backup. Use **Export map** and its preview for SVG, PNG or vector PDF (Chrome print-to-PDF).

Projects are currently stored **in this browser on this device**. Before clearing browser data or changing computers, **export a JSON backup**. Opening the site on another device does not transfer projects automatically.

## Capabilities in the D1.9 codebase

- Editable brief hotspots; linked thought nodes; optional branches, rejections, connections and undo.
- TRACEWORK Grammar, Freeform (Low Structure) and six adapted research-framework lenses.
- Original/Arrange map views including focus and focused pathways; arrangement coordinates are separate from authored originals; alignment, fit/zoom and guided connection explanations.
- **Gap in Reasoning** and **Provenance Gap** advisories; consistent Attribution, Generation Activity and Supporting Record fields in command input, node editor and inspector (conceptually informed by PROV-O).
- Independently retractable Brief and Guidance edge tabs, a full-width bottom command dock, a shorter toolbar, and per-project saved map viewport.
- Spatial Reading Studio, curated feature examples, built-project references and linked reading/search resources.
- Project export/import, combined-project copies, project checks and map export previews.

**D1.9 usability baseline (accepted in the live browser):** Metadata click-outside dismissal, safe text selection, tutorial transitions and node-link interaction are green-lit. Subsequent builds must preserve their behaviour.

**D2.0 additions (pending deployed-browser testing):** A single optional Reasoning Tools dialog provides context-sensitive **Start Me Off**, **What Next**, non-destructive **Compare Structure** and a Markdown **Decision Digest** based on recorded statements. In Freeform, creating a new thought defaults to an unclassified note; assigning a role is deliberate. Thought recognition has stronger spatial-action and spatial-effect cues. These are rule-based guidance features, not verified interpretations or generated architecture.

## Guides and research

- [User guide](docs/user-guide.md) — core workflow, maps, provenance, exports and safe recovery.
- [Research foundations](docs/research-foundations.md) — research positioning and interpretive limits.
- [Developer notes](docs/developer-notes.md) — architecture, deployment and regression tests.
- [Changelog](CHANGELOG.md) — concise release progression.
- [Historical notes](docs/archive/INDEX.md) — complete original release TXT files and the original README, preserved rather than deleted.

## Deployment from a repository copy

This is a static GitHub Pages website. Keep `index.html`, `about.html`, `css/`, `js/` and `data/` at the repository root. Upload the **contents** of the deployment ZIP with these directory paths intact; do not flatten them into a single folder. Running from `file://` can block browser module and JSON fetching; GitHub Pages or a local HTTP server is required.

D2.2 updates the website code and its existing documentation; no new root-level change-note files are created. Historical notes remain preserved under `docs/archive/`.

## Current limitations and planned work

- Projects remain in browser-local storage without cross-device sync. Back up JSON projects regularly.
- Recognition percentages are heuristic wording fits, not probabilities or correctness scores. Framework comparisons are analytical readings, **not** historical evidence that a designer or pilot participant employed those structures.
- Context-sensitive prompts are deterministic starting points to edit, not automatic architecture. Digests reflect only recorded nodes, links, status and attribution.
- Image or Reference nodes, resizing, large-asset persistence and visual-node exports remain planned for the D2 Visual release.
- D3 will verify complete journeys, map exports, framework comparisons, responsive layouts, tutorials and recovery before final freeze.

For historic details see [archived deployment notes](docs/archive/INDEX.md).

D2.1: Find Reasoning Tools beside the trace title. In a literature framework, the inspector and Edit Node lead with its active reading; the underlying TRACEWORK classification remains retained, separately accessible.


### D2.2 Reasoning Tools

With no thought selected, **Start Me Off** suggests complete editable sentences from the source language. Select a thought to enable **What Next** for direct development of that thought. **Compare Structure** shows analytical readings without altering historical roles; **Decision Brief** provides a print-ready summary for review. Suggestions are not validated claims and are not saved without an explicit user action. Unclassified Freeform notes can receive optional inferred labels in a literature framework while remaining stored as notes.

### D2.2 Architectural Propositions — formed design outputs

From **Focus Path**, **Focus Map**, or **Aggregate Map**, open **Architectural Propositions** beside Reasoning Tools. Two parallel outputs are available: (a) a scope-specific, editable and downloadable **Markdown Digest**, which can be inserted into the canvas as a digest node; (b) a **formed architectural axonometric proposition** with canopy, columns, circulation, programme/occupation and screens where the recorded reasoning supports them. Aggregate mode compares up to three documented branches, ranked by trace completeness, not supposed architectural quality. The system does not invent missing participant branches.

A visual proposition can be previewed, exported as SVG, printed as an **Architectural Proposition Sheet**, downloaded as a Markdown rationale and returned to the workspace as a dark, source-linked **Architectural Proposition Node**. These embedded assets are included in project JSON backups and map image/vector exports where supported. Browser-local storage is limited: the system checks a conservative budget, and users should export a JSON backup before storing many image nodes. User upload/paste and drag-resizing follow in D2 Visual.

**Interpretive boundary:** This is local deterministic procedural axonometry, not AI image generation, full building design or BIM. Forms are diagrammatic architectural schemes, not dimensionally verified proposals, and structural, accessibility, climate and seat-count claims must be independently tested. The system explicitly differentiates linked recorded thoughts from inferred forms and visual assumptions.
