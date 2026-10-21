# TRACEWORK D3 — Final Example-Ready Feature Freeze (19 October 2026)

**Status:** Final D3 deployment candidate. All user-accepted D2.15 interactions are unchanged.

- **Optional examples restored:** Home includes two separate actions: **Try Short Brief · 13 nodes** and **Try Long Brief · 42 nodes**. Each is a fully connected test trace, NOT an automatically seeded project. Click to add just that example under **Your traces**; existing projects and edits are never overwritten. The buttons do not change the active project.
- **Clean start retained:** This release carries forward D2.16's one-time TRACEWORK browser-data reset. If the browser has already opened D2.16, its reset marker is preserved and D3 **will not reset new data again**. If this is the first clean-slate release ever opened in a browser, previous TRACEWORK saves there are deleted on first load: **export any project worth keeping to JSON first**. Other websites are unaffected.
- **No other demos:** The legacy one-click prefill fixture and automatic starter pathways remain removed. Framework resources, research references, and empirical context remain available.
- **Feature freeze:** No functional changes to D2.15 maps, framework choices, provenance, reasoning tools, node alignment, resize, image nodes, architectural studies, exports or D1.9 accepted interactions.
- **Backend limitation:** Original model-generated imagery still needs a separately hosted secured service; local vector diagrams remain procedural.

## D3 short final acceptance
1. **Clean and examples:** Home begins without seeded traces; add each example independently and confirm exactly 13/42 nodes; refresh and confirm they persist without duplicates.
2. **Maps and reasoning:** Open an example; check Focus/Aggregate, Original/Arrange, framework modes, source/rejected highlighting, and preserved D1.9 interactions.
3. **Visuals and storage:** Paste or drop a reference, edit/resize/align it, save/reopen and check SVG/PNG/PDF/JSON exports.

## Previous release notes

D2.16 established the clean-slate policy; D3 supersedes its example-removal decision. Other prior improvements are recorded in CHANGELOG.md.

## D2.15 validation

Focused follow-up to D2.14: check half-screen Image/Reference command positioning and dotted drag-to-align guides for image/form cards. No change to generation, reasoning or project data.

## D2.14 deployment candidate

Test Focus/ Aggregate selection halo parity, command-line/right-panel image insertion, image node editing and existing framework/image persistence. The external model-backed generation endpoint is optional and remains unconfigured on a static GitHub Pages deployment. Final D2 acceptance requires live testing.

## D2.13 — Direct image paste/drop and image export repair (test candidate)

- Ctrl/Cmd+V with an image on the workspace opens a confirmation dialog to create a reference node, or replace a selected reference image. Text-field paste is left alone.
- Drag a PNG/JPEG/WebP onto a reasoning node to propose a linked reference node; drop onto an image-reference node to replace its image while preserving connections; drop onto the board to make an independent reference.
- Verify attribution and title before insertion. Existing modal upload/paste/drop remains.
- Correct map SVG/PNG/PDF export to embed JPEG/WebP image nodes as well as PNG, including reference nodes.
- Neither installed AI image generation nor full D2 acceptance is claimed: a secured backend and comprehensive browser regression remain outstanding.

# TRACEWORK D2.12 — D2 Visual and model connection (testing candidate)

## How to test

1. Add Image / Reference using the new workspace toolbar control. Upload, paste or drop an image; provide provenance and a citation; insert it, resize it from the lower-right grip, save and reopen it.
2. Resize an ordinary reasoning card and an architectural proposition card. Verify wires follow as the size changes, Original/Arrange dimensions remain independent, and PNG/SVG/PDF exports have correct image and node sizes.
3. Compare Start Me Off and What Next across framework modes; check that different method-specific questions appear. The authored trace itself must not change.
4. Select architectural Design Studies, inspect a study and use Copy full-trace image prompt. The prompt should mention *your exact project*, not boilerplate pavilion answers.
5. OPTIONAL: To obtain genuinely new AI architectural renders, deploy `optional-model-backend/worker.js` as a separate secured Cloudflare Worker (instructions included), then use Connect image model and Generate with image model. Until configured, the site provides offline *procedural* diagrams, not model-generated pictures. Model usage incurs costs; do not put your API key on GitHub Pages.

This release is a candidate for testing, not a D2 freeze; model-backed generation requires separate configuration and live confirmation.

## D2.11

Final D2 deployment candidate for visual parity, source-highlighting consistency and framework-wide tool availability.

## D2.11 — Legibility-only corrective release

This is a narrowly scoped architectural presentation adjustment to the D2.9 release. It improves labels and evidence relationship readability on Aggregate sheets. Architecture geometry, provenance, framework logic, workspace arrangement and node interaction remain unchanged. Tested offline, pending deployment verification.

## D2.9 testing candidate

Deployment fixes form-node visibility, framework-aware arrangements, Aggregate rejected traces, and rich source-led architectural analysis. The on-device procedural drawing system **does not call an AI image service**; every interpretation must be checked.

## D2.7 — Workflow clarity and aggregate reasoning diagrams (test deployment)

- Architectural Propositions opens immediately on a readable **Reasoning Summary**; **Design Studies** is the second tab. No blank intermediate selection modal.
- All generic controls use building-type-neutral language; project-specific typology remains visible only in outputs derived from a relevant brief.
- Aggregate proposals now show distinct programme relationship plans and separate recorded reasoning from system-proposed formal possibilities. Focus example geometry is preserved.
- Selecting a saved design study highlights its contributing source thoughts and existing connecting wires without creating extra edges.
- Dialog width and study-grid columns adapt to half-screen and smaller windows.
- Regression testing and visual acceptance are still required before freezing.

# TRACEWORK — Give reasoning traction

**Latest deployed release:** D2.3. **Next deployment candidate:** D2.4 — complete Focus pavilion configurations, Aggregate architectural form research, board comparison, and revised architectural translation (19 October 2026). **Accepted interaction baseline:** D1.9. D2.4 requires live-browser testing before acceptance.

TRACEWORK is a browser-based research prototype for making architectural design reasoning explicit and inspectable. It helps designers trace language, interpretation, supporting grounds, spatial propositions, evaluation and design goals. It **does not** certify design decisions, infer a person's historical thoughts, or automatically produce verified architecture.

**Live website:** https://aliuuah23.github.io/reasonwithtracework/

## Start here

1. Open the website; choose **Quick brief** or **Long Brief or Document** and start a trace. Use the optional Short and Long example buttons to restore the 13-node or 42-node test trace; they are never seeded automatically.
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

**D2.3 Architectural Propositions (test build):** Focus Path selects one documented chain; Focus Map shows the pathways attached to the selected hotspot; Aggregate Map compares the top three branches by a **documentary-support score**, and allows viewing all paths when rankings are tied. Side-by-side, one-at-a-time, back-to-comparison, annotated SVG, printable comparison and rationale sheets, scoped Markdown and workspace image-node insertion are available. Different **spatial consequences** lead to different procedural concept studies (circulation, privacy, capacity, climate, occupation duration, individual/group coexistence, distributed pause, courtyard, tiers, reconfiguration). Documented reasoning is never changed.

**Validation and limits:** This release is a static, offline, rule-based *pavilion-oriented architectural concept prototype*; no remote image-generation API is involved. It cannot establish that a design is constructible, sufficiently sheltered, accessible, structurally safe, sized for a specified number of users, or aesthetically ready for an architectural crit. It deliberately withholds a formed scheme where no identifiable spatial move is recorded. The score ranks **completeness of supporting trace**, not design quality. Comparable completeness produces a **tie**, not a claim that one path is strongest. Unsupported building types must be reviewed manually. Designers should compare the schematic outputs to participant drawings without attributing TRACEWORK-generated form to participants.

D2.3 updates the website code and its existing documentation; no new root-level change-note files are created. Historical notes remain preserved under `docs/archive/`.

## Current limitations and planned work

- Projects remain in browser-local storage without cross-device sync. Back up JSON projects regularly.
- Recognition percentages are heuristic wording fits, not probabilities or correctness scores. Framework comparisons are analytical readings, **not** historical evidence that a designer or pilot participant employed those structures.
- Context-sensitive prompts are deterministic starting points to edit, not automatic architecture. Digests reflect only recorded nodes, links, status and attribution.
- Image or Reference nodes, resizing, large-asset persistence and visual-node exports remain planned for the D2 Visual release.
- D3 will verify complete journeys, map exports, framework comparisons, responsive layouts, tutorials and recovery before final freeze.

For historic details see [archived deployment notes](docs/archive/INDEX.md).

D2.1: Find Reasoning Tools beside the trace title. In a literature framework, the inspector and Edit Node lead with its active reading; the underlying TRACEWORK classification remains retained, separately accessible.


### D2.2 Reasoning Tools

With no thought selected, **Start Me Off** suggests complete editable sentences from the source language. Select a thought to enable **What Next** for direct development of that thought. **Compare Structure** shows analytical readings without altering historical roles; **Reasoning Summary** provides a print-ready summary for review. Suggestions are not validated claims and are not saved without an explicit user action. Unclassified Freeform notes can receive optional inferred labels in a literature framework while remaining stored as notes.

### D2.2 Architectural Propositions — formed design outputs

From **Focus Path**, **Focus Map**, or **Aggregate Map**, open **Architectural Propositions** beside Reasoning Tools. Two parallel outputs are available: (a) a scope-specific, editable and downloadable **Markdown Digest**, which can be inserted into the canvas as a digest node; (b) a **formed architectural axonometric proposition** with canopy, columns, circulation, programme/occupation and screens where the recorded reasoning supports them. Aggregate mode compares up to three documented branches, ranked by trace completeness, not supposed architectural quality. The system does not invent missing participant branches.

A visual proposition can be previewed, exported as SVG, printed as an **Architectural Proposition Sheet**, downloaded as a Markdown rationale and returned to the workspace as a dark, source-linked **Architectural Proposition Node**. These embedded assets are included in project JSON backups and map image/vector exports where supported. Browser-local storage is limited: the system checks a conservative budget, and users should export a JSON backup before storing many image nodes. User upload/paste and drag-resizing follow in D2 Visual.

**Interpretive boundary:** This is local deterministic procedural axonometry, not AI image generation, full building design or BIM. Forms are diagrammatic architectural schemes, not dimensionally verified proposals, and structural, accessibility, climate and seat-count claims must be independently tested. The system explicitly differentiates linked recorded thoughts from inferred forms and visual assumptions.


### D2.4 — Focus as complete pavilion / Aggregate as architectural form research

**Focus Path / Focus Map:** Each documented pathway can be selected individually, developed as a whole-pavilion diagram (roof, circulation, occupation, seating, privacy/climate where spatially stated), and compared with the other complete alternatives. Secondary recorded spatial ideas within the same route are represented together instead of disappearing behind the primary typology. Drawings include a small plan diagram and a disclosure of authored vs system-inferred features. No performance claim is made for fitting, dimensions, seats, access or structure.

**Aggregate Map:** Presents up to five abstract architectural form studies. It prioritises distinct recorded spatial intentions (not simply highest completeness score), using circular forums, roof petals, ribbons, radial terraces, and folded structures. When fewer than three documented distinct routes exist, additional form studies are explicit speculative translations of an existing recorded route — not new evidence. They must be assessed by the designer.

**Both modes:** Compare side by side, inspect individually, print comparison, export each SVG and source-linked Markdown, insert one proposition node, or **Place images on map** to save an ordered, source-linked group of image nodes beside the reasoning network. Browser-local budget is checked before insertion. Existing D1.9 node/wire/text/tutorial behaviours are untouched.

**IMPORTANT:** Procedural diagrams and inferred occupancy configurations are illustrative only; they do not deliver full architectural design verification or guarantee presentation quality. Review source links, linework and omissions before using them in critique.

#### D2.4 candidate refinement — architectural translation consistency

Focus schemes use a strategy-linked programme-plan inset and identify pilot brief checks (additional seats, route, sheltered footprint and individual/group use where present in the brief). Twenty seats are indicated as potential seat loci when the brief requests them; this is **not** evidence of dimensional clearance, occupancy or access compliance. Source-led secondary spatial ideas are shown alongside the primary form. Aggregate adopts five differentiated form-making morphologies (archipelago, annulus, radial canopy, directional ribbons and an oblique accordion-fold canopy), with distinct source assignments and no false attribution to participants. The original D1.9 interaction implementations have not been refactored. All visual and saving interactions require live browser PASS/FAIL checks.


## D2.7 update
Each map remembers its own Original/Arrange mode and canvas position when switching. Aggregate studies now include plan, sectional intent and axonometric morphology, with explicit speculative qualifications. Focus schemes remain unchanged.

## Current deployment (D3.1)

Deploy the full repository without deleting local projects. Check **Aggregate map → Architectural Propositions → Design Studies** for 3–5 system-proposed studies. Focus Map can switch directly to Aggregate comparison. The entire drawing fits inside the scrollable popup. Historic release files remain in `docs/archive/`; the only current root documentation is this README and `CHANGELOG.md`. Export saved projects as JSON before deployment as a backup. Secure AI image generation remains optional and is not active until a backend is configured.
