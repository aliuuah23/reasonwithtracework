## D1.3 — Interface + Evidence Clarification (14 October 2026)

This release amends D1.2 without changing existing graph layout, saved traces, or map exports.

- A reasoning connection may have *both* a Gap in Reasoning and a Provenance Gap. Two independent, stackable bottom-right advisories appear; each has its own **Keep open** action. Neither warning alone blocks an otherwise allowed connection.
- **Participant Statement** belongs under Origin / Provenance and is no longer a selectable Evidence Basis. Evidence options include **Transcript / Recorded Interview**, observations, drawings/models and documented precedents. Older stored `evidenceKind: participant` metadata is displayed as requiring review, and existing project files are not automatically rewritten.
- Reasoning node edit forms now have consistent Inter typography, readable 12–14px labels/inputs, title-cased field labels and clearer origin-versus-evidence guidance. Designer/participant text is never automatically recased.
- The navigation header is compact (76px total) at browser widths up to 1200px, including half-screen and mobile, and remains horizontally scrollable.
- Existing validated connection selection, undo, maps, tutorials, wire signals and export functions are preserved.

**QA:** Browser-check simultaneous advisories, their separate Keep open buttons, node editing, ribbon compactness, and existing-project access after deployment.

# D1.1 — Provenance Gap Extension (14 October 2026)

**This build supersedes the previously prepared D1.1 ZIP and retains its entire feature set.**

## Why two separate diagnostics?
- **Gap in Reasoning:** Is the reasoning relation logically or structurally unclear?
- **Provenance Gap:** Does the origin or declared evidence risk misattributing an idea to a participant, brief, researcher or system?

A designer may connect different sources intentionally. Mixed provenance is **not automatically an error**, and the warning does **not block the connection**. The system never infers historical provenance for missing optional fields.

## How to test
1. Connect a system-suggestion node to a participant-attributed node with no independently cited participant source. Preview shows an amber provenance warning and a follow-up question. The connection remains allowed if the reasoning relation itself is valid.
2. Select its wire. The right inspector shows a collapsible or expanded **Provenance Gap** section separate from **Gap in Reasoning**. There is no interrupting wire modal.
3. Make a normal brief → designer interpretation link. No false provenance warning should appear.
4. Edit the target source reference or evidence origin. The inspection result updates from current metadata on reopening the wire.
5. Confirm the original D1.1 ribbon, wire legend, node editing, maps, export and test projects remain functional.

# D1 — Reasoning Transparency (14 October 2026)

**Baseline:** GitHub repository ZIP `reasonwithtracework-main(1).zip` (locked C2.5).

This release preserves the existing source highlights, maps, framework arrangement, onboarding, spatial reading, project data and map export.

### What changed

- **Explain this:** each node inspector includes an openable explanation of what the role means, when to use it, a pavilion-relevant example, and distinctions from adjacent roles. The active framework lens is labelled as analysis, not historical evidence.
- **Explain connections:** click any existing wire to see its two endpoints, reasoning plausibility, optional pilot category transition context and the question that may reveal a gap. Delete wire remains available from the explanation.
- **Gap in Reasoning:** replaces the older “Connection paused” message when a link fails and offers a targeted bridge prompt. This does *not* force intermediate nodes to be fabricated.
- **Origin vs evidence basis:** node Edit now keeps the provenance selector and adds an independent evidence category and optional source citation. Saved as `node.meta.evidenceKind` and `node.meta.sourceReference` in the existing project JSON. Existing nodes are left unmodified unless edited.
- **PROV-O grounding:** About page explains how TRACEWORK's trace metadata relates conceptually to provenance, and links the W3C recommendation. The site does not assert formal PROV-O/RDF compliance.
- **Undo:** node edits now record a checkpoint before changing labels, roles or provenance fields.

### D1 focussed regression checks

1. Open a saved project. Select an Interpretation and Goal: both Explain this panels should show different roles, examples and evidence states.
2. Edit an existing node, set *Evidence basis* to Participant statement and enter an event/reference. Save and reopen the project. Both fields should persist in Trace context.
3. Click an existing wire: confirm from/to wording, contextual explanation, and Keep/Delete controls. Retain the wire, then test Undo after an independent node edit.
4. Try a prohibited/misaligned connection: message title should read **Gap in Reasoning** with a bridging question. Existing valid links should still work.
5. Switch framework and open the node explanation; the framework interpretation must be identified as a lens, not attributed to the participant.
6. About → Provenance & evidence: verify the W3C source link and distinctions between provenance and evidence.
7. Regression: Edit hotspot, move node and Ctrl+Z, Aggregate Original/Arrange, Restore test examples, Spatial Read, export preview.

**Safety:** Do not clear browser storage; projects are browser-local. The new metadata fields are additive and optional. New devices retain the C2.5 first-use behaviour.

---


## C2.5 locked studio — Export preview addition

From **Workspace → Export map** (or **My Trace → Export map**):

1. **Hide rejected pathways** is enabled by default. This removes rejected nodes and their incident/rejected wires **from the exported diagram only**, not from saved reasoning. Disable it to include all visible reasoning.
2. **Automatically arrange export** is enabled by default. It uses the surviving nodes and connection directions to produce a left-to-right presentation layout without changing any saved Original, Focus or Arrange Map positions. Disable it to export the current arrangement.
3. Click **Preview map** to see exactly the diagram that SVG, PNG and vector print-to-PDF will use. Adjusting either option refreshes the preview. Export buttons stay disabled until a preview succeeds.
4. Choose **SVG (editable vector)**, **PNG (raster image)** or **PDF (vector print via Chrome Save as PDF)**. The export is independent of the viewport zoom and saves no edits to the project.

The export always honours the *current displayed map scope*: for a project-wide export, switch to **Aggregate Map → Show all** first. The auto-layout is intended for presentation legibility; complex cyclic traces may still need refinement in an illustration editor.

# TRACEWORK C2.5 — Locked Studio Baseline

**12 October 2026 · minimal onboarding and examples change from the stable C2.4 release.**

- **Existing browser projects remain untouched.** No traces are migrated, deleted, renamed or overwritten on deployment. The current author's restored short and long examples remain saved.
- **Fresh browsers start with zero projects.** Automatic seeding of example traces has been disabled. First-time tutorials start normally on a browser with no tutorial completion marker.
- **Try long + short examples** adds the canonical sample projects *only after a click*. Repeated clicks do not overwrite edits or create duplicate sample IDs.
- **Previously used other devices:** local storage cannot be remotely cleared or reliably identified as belonging to a different person. To clear one, open a project and use **My Trace → Reset local data**, then explicitly confirm. This now also resets tutorials on that browser. Do not do this on a device whose existing work should be retained.
- **Stable release lock:** the reasoning engine, existing frameworks, map rendering, spatial literacy, linked reading guides, export tools and responsive styles remain identical to C2.4.

## Verification for C2.5

1. Open the site on the main browser and confirm previously saved traces remain.
2. Open in a new private browsing session: no existing traces should appear, and the first-time tour should open.
3. Click **Try long + short examples** once: both sample traces should appear; clicking again should not duplicate them.
4. On any *other* browser with existing local data, use the confirmed **Reset local data** only if the owner chooses to erase that browser's traces and replay tutorials.

---

# TRACEWORK C2.4 — Final Usability Pass

**12 October 2026 · built on C2.3 critical recovery.**

## What's new

- **Clear homepage:** the confusing *Restore exported JSON* and *Keep 2 test briefs* actions have been removed from the project shelf. Projects themselves are unchanged.
- **Safe recovery remains:** choose **My Trace → Import saved JSON** at any time, including before opening a project. The **Restore long + short test projects** button remains under the main brief field; it recreates only missing built-in examples and does not replace work.
- **Responsive ribbon navigation:** at half-screen widths, a compact horizontal ribbon is accessible rather than hidden.
- **Meaningful navigation with no project:** Pathway Bank, My Trace and Discussion open readable empty states with an action to return to Workspace, rather than disabled controls that look broken. My Trace shows any saved projects, even without an active project.
- **Contextual tools:** when no project is open, My Trace hides project-only export/audit/reset controls but continues to offer JSON recovery. Project discussion and its node-anchored form return when a project is opened.
- **No migrations or resets:** current local projects, frameworks, graphs, spatial reads, exports, undo and discussions remain saved in the browser.

## Quick start

1. On **Workspace**, paste a brief, load an example, restore the long/short samples, or open an existing trace under **Your traces**.
2. On **Pathway Bank**, explore prompts informed by the active design trace. Without a project, the empty page explains how to start.
3. On **My Trace**, inspect history, alternatives and sources. Import a previous JSON backup from this tab whenever needed; once a project is open, SVG/PNG/PDF map and JSON project exports are available.
4. On **Discussion**, attach a local question, critique or design rationale to a project or node. The page remains visible without an active project, but does not falsely suggest global/community posting is available.
5. On **About**, access the clickable framework walkthroughs and linked reading library.

## Project safety and known limits

- Projects are saved to **this browser**, not synced to an account. Back up meaningful work as JSON periodically.
- Combining projects copies reasoning and keeps originals, while restoring examples only recreates missing sample IDs.
- Spatial reads are schematic, curated aids to design reasoning, not precise automatic design drawings for arbitrary phrases. If a term is unfamiliar, TRACEWORK offers research/reading directions instead of fabricating a model.
- Discussion is local to an open project; it is not a public or shared forum.
- User-journey and map-export behaviour still need end-to-end testing with a complete studio trace, beyond the targeted interface tests for this release.

## Deployment

Extract this ZIP, then upload the **contents of the extraction** to the GitHub repository root, keeping `css/`, `data/` and `js/` nested. Wait for GitHub Pages to deploy and refresh once using Ctrl+Shift+R. Never clear site data to install an update.

## Release lineage

- **B1.5–B2.3:** hotspot highlighting, editing, responsive UI, undo, framework selection and map layouts.
- **C1.0–C1.5:** map organisation, classifier, spatial-reading studio, feature examples and built precedent organisation.
- **C2.0–C2.2:** audits, exports, JSON restore, linked readings and framework walkthroughs.
- **C2.3:** repaired a module parse error that had disabled site navigation and sample restoration.
- **C2.4:** simplified homepage and safe project-less ribbon navigation.

See `ROUND-C2.4-FINAL-USABILITY.txt` and earlier `ROUND-*` files for detailed history.

---

# TRACEWORK C2.3 — Critical Site Recovery

**12 October 2026 · recovery release built from C2.2.**

## What broke and why

`js/reasoning/spatial-literacy.js` had an unterminated HTML template string in `spatialMiniMarkup`. The browser failed to parse that imported module, stopping the entire main-app module graph before it could bind clicks. As a result, Workspace, Pathway Bank, My Trace, Discussion, Restore Examples and project opening appeared but were inert; the About page continued to work because it uses an independent module.

## This repair

- Closed the broken template literal without changing spatial-reading content.
- Versioned the app entry point and both spatial module imports, so GitHub Pages and Chrome do not reuse cached broken code.
- Retained both bundled test projects and the **Restore long + short test projects** control.
- Preserved C2.2's framework guide slideshow, reading links, map export, project features and documentation.
- Did **not** clear localStorage, delete, migrate, overwrite, or reset any existing user project.

## Acceptance tested in Chromium (full application scripts using isolated local fixtures)

1. All application ES modules imported; no page errors.
2. The landing page displayed Short Brief (13 nodes) and Long Brief (42 nodes).
3. Pathway Bank, My Trace and Discussion opened without requiring an active project; Workspace returned to the landing screen.
4. After simulation of deletion and dismissal markers, Restore recreated both test projects in the saved project bank.
5. A restored example opened; all four main ribbon tabs worked with an active project.
6. Original saved projects were not cleared by the repair.

**Please verify once on real GitHub Pages after deployment.** Browser fixture tests do not prove CDN propagation or validate other features exhaustively.

## Deploy

Extract All, upload **contents preserving css/, data/, js/** to the root of `aliuuah23/reasonwithtracework` and commit as **TRACEWORK C2.3 — Restore main navigation and test projects**. Wait for Pages and use Ctrl+Shift+R. On the homepage click **Restore long + short test projects**, then open a restored example and check the ribbon. Do not clear site data or use Reset local data.

---

# TRACEWORK Stage C2.1 — Recover Long and Short Test Examples

**Targeted stability fix:** The two canonical example projects are bundled in `data/test-project.json` (short, 13 nodes) and `data/aggregate-test-project.json` (long, 42 nodes). If either sample was previously deleted, a browser-local dismissal flag prevented it from reappearing on reload. The examples were not removed from the website.

**How to restore:** Homepage → **Restore long + short test projects** → scroll to **Your traces** → open **Short brief — Flexible Pavilion** or **Long brief — Flexible Pavilion**. This control stays available even if no projects are currently saved, and works after examples have been deleted.

**Safety:** Restoration loads both bundled fixture JSON files, validates their structure and creates *only missing* sample projects. It never overwrites an existing sample, other saved work, project JSON or source provenance. It clears the dismissal flags only once both sample IDs are saved. No browser reset, localStorage clearing, or project cleanup is required. If restoration fails, existing projects remain intact.

**C2.0 retained:** All Stage C maps, spatial reads, classifier improvements, full reasoning checks, exports (SVG/PNG/vector PDF), import and merge behaviour are carried forward unchanged. This is a targeted patch to unblock final acceptance.

---

# TRACEWORK — Stage C2.0: Integrated Project Release (12 October 2026)

**Purpose:** Freeze a coherent Stage C integration candidate for Pieter's studio demonstration: cross-hotspot reasoning maps, framework interpretations, spatial-reading support, export/recovery and project quality checks. The full application still needs live-site acceptance testing before a final release freeze. There is no claim of automatic architectural correctness.

## C2.0 changes

1. **Operational Design → Operational Grammar:** the right inspector shows spatial operational questions, overall/detail suggestions, and then the active grammar. Spatial Feature Examples and Built-Project Precedents remain separate.
2. **Learning even when Spatial Read has no precise match:** nodes and hotspots receive **Architectural Keywords & Suggested Readings** with topical links to Google Scholar, Google Books and built-project searches. These are **unverified external search prompts** rather than fabricated article citations; verified built examples remain a separate curated section.
3. **Export map in three clear formats:** **SVG vector** (individually editable paths/text for Illustrator/Inkscape), **PNG raster** (2× PNG, reduced for unusually large maps), **PDF vector** (Chrome print dialog, select **Save as PDF**, A3 landscape default). All three include the complete **currently displayed/filtered map** independent of viewport scrolling and zoom; choose **Aggregate Map** and **Show all** before exporting the entire project.
4. **JSON import without overwriting:** My Trace and the home project shelf now provide Restore/Import saved JSON. Valid projects are added as *new local copies* if a project ID already exists; original local data stays. Invalid JSON, structural errors or excessive files are rejected.
5. **Project check:** My Trace → **Project check** audits duplicate IDs, broken edges, missing wording, hotspot ranges, brief-source links, disconnected reasoning, and open goal/evaluation/alternative opportunities. Warnings are diagnostic, not architectural judgements, and Freeform need not follow one fixed grammar.
6. **Combining projects:** combined traces retain the original source project IDs/names and provenance on the copied nodes, while keeping original source briefs, hotspots, branches, connections and status separate.
7. **Tutorials & documentation:** updated for project recovery, map exports, Original/Arrange layout independence and contextually labelled reading searches.

### How to export a complete vector / raster map

Workspace → **Aggregate Map → Show all** → choose Original or Arrange → **Export map**. Choose SVG, PNG or PDF. The PDF option opens a separate Chrome print tab; in the print destination choose **Save as PDF**. A3 landscape is recommended, but large dense reasoning graphs will be smaller on one page. SVG is preferable for close editing or enlarging a very dense map on A1 critique boards. Focus Map export intentionally exports only the current focus field.

### How to recover work

Export **project JSON** from My Trace before moving between browsers. On the home page choose **Restore exported JSON** or in My Trace choose **Import saved JSON**. Confirm after the project structure is checked. It is stored as a separate local trace so previous work cannot be silently overwritten. Do not use Reset local data without exporting backups.

### Verification and limitations

- **Validated locally:** JavaScript syntax, pilot-example classifier availability, representative project audit, architectural keyword search generation, full-bounds SVG and PNG download, Chrome vector-PDF print output (A3), PDF text extraction, ZIP structure.
- **Needs deployed acceptance:** all real application UI flows, true Aggregate Map across complex saved traces, no-regression checks for undo, spatial reads, hotspots, and reimporting real user exports on GitHub Pages.
- **Architectural claims:** Spatial Reading Studio is curated finite vocabulary with schematic diagrammatic studies, not a universal geometry generator or code-compliance engine. Fallback links are **research searches**, not verified sources.
- **Storage:** Local browser prototype. JSON is the recommended backup; no account/server persistence is implied.

### Install/deploy

1. Extract this ZIP fully, preserve `css/`, `js/`, `data/` directories.
2. Upload contents into the repository root and replace matching nested paths; avoid flattening files.
3. Commit as **TRACEWORK C2.0 — Complete Stage C integration, recovery and map export**.
4. Wait for GitHub Pages, then one Chrome hard refresh (`Ctrl + Shift + R`).
5. First verify **My Trace → Project check** and **Export map → SVG, PNG, PDF** before a final sign-off.

---

# TRACEWORK Stage C1.5 — Final Spatial Reading & Inspector Tightening

**Purpose:** Keep the C1.4 spatial diagrams, user-driven term investigation and supported-vocabulary limits intact while making automatic term recognition more reliable and the right inspector easier to understand.

## C1.5 changes

1. **Term resolution:** Spatial Reading opens from the current selected inspector sentence or active graph node. Older cached data attributes and legacy source labels no longer automatically override a detected architectural term. The pop-up displays a small C1.5 version marker for deployment checks.
2. **Right panel:** Feature studies and built-project precedents are visibly separate. Spatial Feature Examples shows up to three specific variants of the recognised element; Built-Project Precedents shows named documented buildings (or explicitly says there is no relevant built match). No unexplained A/B numbering.
3. **Studio categories:** Spatial Feature Examples, Built Projects Using This Feature, and Readings/Guidance/Drawings use self-contained titles without A/B/C labels.
4. **Accuracy:** Curated offline vocabulary only. Unsupported wording does not produce an unrelated diagram; users can select and investigate any phrase manually.
5. **Existing functionality:** map arrangements, alignment, zoom, classifier, editable hotspots, node linking, case-reference links, Ctrl+Z and tutorials are otherwise unchanged.

## Quick acceptance

- Select the Goal node **I want a vestibule** and click Spatial Read directly. Verify Vestibule plan and section open *without* typing it into the search.
- Read the right inspector: **Spatial Feature Examples** and **Built-Project Precedents** should be distinct blocks, with no orphan **B.** heading.
- Search for an unsupported phrase in Spatial Reading Studio; confirm there is no fabricated diagram.
- Inspect the Spatial Reading Studio's **C1.5** version label to rule out stale JS imports.

## Known limitations and release status

This is a curated spatial reading resource, not a general AI model generating verified architecture for arbitrary text. Project precedents exist only where sufficiently documented. A final end-to-end project trace, project merge/reopen, and release regression still warrant acceptance testing before declaring full freeze.

---

# TRACEWORK Stage C1.4 — Spatial Reading / Tutorial Repair

**Main fix:** Spatial Reading Studio now passes actual selected node text from both the inspector and map, and allows searching or highlighting an architectural phrase from the node quote. The result gives precise diagrams when terms are supported, and does not invent one for unknown wording.

**Controls:** Select text in the studio quote → Investigate Selection, or enter any phrase → Investigate. Detected terms have separate tabs. Results separate plan/section, architectural mechanisms, feature examples, projects and readings. The source text remains preserved during searches.

**Vocabulary:** The original 13 concepts plus 15 additional architectural mechanisms (bridge, balcony, terrace, colonnade, ventilation, mezzanine, door, column, wall, orientation, accessibility, acoustics, landscape, water/drainage, programme). Every supported concept has a non-empty, concept-specific plan and section; 16 also include an axonometric mechanism sketch. Newly added diagrams remain schematic, not scaled construction details. No claim of supporting arbitrary words.

**Tutorial:** Filing is optional and appears only in Long Brief mode. When Quick Brief is active the tour anchors to the mode selector instead of spotlighting a hidden filing panel.

**Reference handling:** Verified readings and existing built-project examples are separated from feature configurations. Every term also provides clearly labelled external literature/project *searches*; these are not claimed as verified precedent matches.

**Important caution:** These are conceptual architectural explanations, not design output, engineering proof, code compliance or verified precedent for every term. Sources appear only when linked documentation is known.

## Stage C — Remaining Acceptance Requirements

- Cross-branch Aggregate Map: test complex interwoven traces across all framework arrangements; protect independent Original positions and reversible Arrange reflow.
- First-use journey: demonstrate brief → hotspot → interpretation/goal → spatial consequence → evaluation/trade-off → alternative → trace.
- Project import/combine: preserve source provenance, merged node IDs, decision status and browser-local persistence; avoid silent overwrites.
- Spatial knowledge library: add verified sourced project precedents, additional specific details and differentiated sketch models over time. Offline matching is intentionally finite and cannot reliably draw every arbitrary word.
- Release acceptance: half-screen layouts, keyboard actions, tutorials, undo, local save/export, reopen, broken links and page load.

## Stage C1.1 — Aggregate visibility, refined alignment and pilot-informed role suggestions (12 October 2026)

### New in C1.1

- **Alignment:** light grey dotted, local guides, a 6-world-pixel snap threshold (instead of 9), centre/edge matching only against nearby nodes; hold Shift while dragging to temporarily bypass snapping.
- **Selected-node zoom:** select a graph node and use Ctrl + mouse wheel on the canvas to zoom onto that node. Without a selected node, zoom remains centred on the viewport.
- **Thought suggestions:** enriched by 230 non-duplicate ontology labels coded across P01–P10 in the corrected Pilot 01 workbook; structural goal/interpretation/action cues are given greater importance. These are *heuristic match strengths*, never calibrated probabilities or claims about future designers. Source: `data/pilot-role-examples.json`. Users retain manual category control.
- **Fit Map:** uses the actual visible content bounds and supports smaller zoom factors so large Aggregate/Arrange maps can fit in narrow Chrome windows.
- **Original vs Arrange:** an unstructured, naturally interwoven Original network rather than an automatic TRACEWORK-role grid. Arrange Map applies the chosen literature/framework structure, maintaining independent presentation layouts. Previously user-positioned Original nodes are never reset.
- **Reflow Arrange:** preserved without modification.

### Quick acceptance

1. Aggregate → Original should show the unsorted network; Arrange should group according to the selected framework.
2. With a large aggregate, press Fit at half-screen; all nodes should fit within the viewport.
3. Drag nodes near one another: observe subtle dotted guides and Shift-to-bypass.
4. Select a node; hold Ctrl and roll the mouse wheel over the map.
5. Compare `The goal is to support private study` with `I read privacy as screening`: the first should recommend Goal; the second Interpretation.

---

## Historical notes: C1.0 — Layout independence and drag alignment (12 October 2026)

TRACEWORK's Stage C integration begins with separate semantic-layout views and clear presentation controls. This is a complete website deployment package; extract all folders before uploading.

### Changes in C1.0

1. **Wires are darker neutral grey**, preserving the existing active/selected and evidence-specific distinctions.
2. **Original Map is the editable source layout**. Moving nodes in Original or Focus also shifts saved Arrange positions, so deliberate source corrections carry forward.
3. **Arrange Map is independent**. Changing a node's position in Arrange stays in the active framework's presentation layout and **does not move it in Original or Focus**. The layout is saved per framework in project data.
4. **Smart alignment guides** appear when a dragged node's left/centre/right or top/middle/bottom aligns with another node. The movement snaps when within 9 unscaled pixels. It works on selected groups and does not change reasoning data.
5. Added **Reflow Arrange** to regenerate only the active framework arrangement, with Ctrl+Z and no effect on Original/Focus.
6. Added a short explanation of the two layouts to the Aggregate toolbar. Kept filtering, framework selector, full hotspot highlighting/editing, undo and project combining untouched.

### Acceptance checks

- Open Aggregate Map → Original: move a node → switch to Arrange and verify the independent framework arrangement remains available.
- Move a node in Arrange → switch to Original and Focus. Original/Focus should not move because of the Arrange edit; return to Arrange to confirm it kept its own location.
- Drag one node close to the left/centre/right or vertical level of another: thin lavender guides appear and the node snaps into alignment; releasing hides them.
- Ctrl+Z after each type of movement restores the correct map state.
- Wires stay visible at normal and aggregate zoom without obscuring selected connections.

### Deployment

1. **Extract All** from the ZIP.
2. Upload the root files **together with the intact css/, js/, data/ folders** to the GitHub repository root. No duplicate flat files.
3. Commit and wait for GitHub Pages. In Chrome, perform one hard refresh.

### Stage C remaining

Full start-to-finish trace acceptance testing, project-level aggregation and documentation refinement, then a stable release freeze. Framework-aware Arrange modes and project-wide filters are already present; this version stabilises map independence rather than inventing new reasoning steps.

---

## Round B2.3 — Shared map positions and layout toggle (12 Oct 2026)

- The read-only brief now darkens and underlines a hotspot phrase on pointer hover without altering text or selection.
- Aggregate Map now offers **Original map** and **Arrange map** buttons instead of a slider. Original retains its existing layout; Arrange applies the active framework.
- Dragging a node in Focus Map, Original Aggregate Map, or Arrange Map propagates the same displacement to that node in the other views. Each view can retain its distinct overall spatial organisation.
- Manually adjusted Arrange positions are stored per framework on the node; the project remains stored locally in the browser.
- The framework dropdown lists **TRACEWORK Grammar**, then **Freeform / Low-Structure**, followed by the literature frameworks.
- Existing highlighting, hotspot edits, node-movement Ctrl+Z, and other Stage B interaction fixes are preserved.

**Quick check:** Open a project with nodes → Aggregate map → click Arrange map → drag a node → switch Original map → Focus map and check its corresponding movement; Ctrl+Z should undo the move. Hover a hotspot phrase to see darker highlighting.

---

# TRACEWORK — Give reasoning traction

**Round B2.2 · Hotspot Edit Reliability + Stage B completion testing**  
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

**Deploy on GitHub website:** Extract ALL contents of `TRACEWORK_Round_B2.2_DEPLOY.zip`; drag the entire folder contents (especially the nested `css/`, `js/`, `data/` directories) into the repository upload page. Ensure paths remain nested; do not upload the ZIP itself or flatten individual folders. Commit normally. GitHub Desktop is an optional alternative.

Important: TRACEWORK saves locally in the browser via `localStorage` (`tracework.projects.v3`). Deploying code does not reset stored traces. **Do not clear site data** to fix a visual bug. Export a JSON backup before any intentional cleanup. Combining projects makes copies and preserves originals.

## B2.2 latest changes

- Read-only brief now uses a pointer consistently across the full paragraph (including ordinary words), while retaining native drag-to-select.
- Editing source-bound hotspots accepts case-insensitive text and flexible whitespace, including phrases split across multiple lines; the modal gives a clear reason when Save is unavailable.
- Creating a manual hotspot now adds an undo checkpoint. Existing hotspot edit/delete and node movement undo are preserved.
- Workspace tutorial explains edit, delete, read-only source and the distinction between project undo and native text field undo.
- Project/brief combining and independent Aggregate Map refinement are still separate work; this release does not claim to implement site-wide undo for every click.

## B2.2 acceptance tests

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


## Stage C1.2 (previous release) — Operational spatial reading on every framework and node

- **Every role, including Input, Interpretation, Grounding, Spatial Consequence, Evaluation, Goal and Freeform Note**, can expand a **Spatial read** on the node: intentionally simple plan and 3D/axonometric *schematics* suggested by terms in its wording. When words lack spatial cues, drawings remain generic and are expressly **not evidence or finished designs**.
- The inspector shows distinct **Overall suggestion** (system-level design question), **Detail suggestion** (specific plan, section, 3D, measurement or operation to test), and a reasoning probe. These work within TRACEWORK, Freeform and all literature frameworks. They operationalise the user's reasoning without claiming any source author prescribed the prompts.
- **Architectural feature-based case studies:** precedents are matched against the *current hotspot or node words*, not the general pavilion project. Role-based pavilion defaults are removed. Added cross-program references include EPFL Rolex Learning Center (topography/movement), Sendai Mediatheque (structure/programme) and Quinta Monroy (incremental adaptation). Project sources are linked. No match is shown as such rather than inventing a relevant precedent.
- **Direct node bubble actions:** `↗ Link nodes` opens a target/direction chooser (with the existing connection rules and undo). `⌕ Case study` selects the node and opens/scrolls to its feature-matched references in the inspector. Existing drag-to-connect ports remain.
- Only ten+ curated cases are stored locally, so the suggestions are illustrative and cannot claim exhaustive case-based retrieval, generated 3D geometry or independently verified site-specific performance.

**Release note:** This is a replacement for the previous C1.1 package, not an additional ZIP to merge into GitHub. Extract the complete C1.2 ZIP before uploading; preserve `css/`, `js/`, and `data/` directories.


## Stage C1.3 — Spatial Literacy Studio (term-grounded architectural learning)

- **Spatial read** on any node or right-hand inspector now opens a large accessible pop-up with labelled, term-specific *plan* and *section* diagrams, definitions, mechanisms, spatial tests, and linked references. No previous one-size-fits-all miniature drawings.
- **Matching rules:** offline explicit architectural vocabulary with whole-term matching; displays up to four independently matched architectural terms. The examples and diagrams are educational typologies, not generated models, scales or compliance drawings.
- **Two different reference families:** **A. Feature examples** (vestibule as entry airlock, foyer, offset doors, etc.) and **B. Named built projects** (e.g., Studio Wills + Architects apartment renovation demonstrating an entry foyer). **C. Readings** link to specific supporting sources. No parent-pavilion bias.
- **Unsupported language:** never a blank visual and never a fabricated architectural layout. Displays the reason for insufficient match, three steps to develop spatial evidence, and example architectural terms to explore. More terms can be added via `js/reasoning/spatial-literacy.js`.
- **Node linking:** replaced ambiguous 'selected node' wording with a source/target preview, explicit arrow direction, relationship validation and a disabled invalid Connect action.
- **Source references:** ArchDaily (Studio Wills + Architects, 2018): https://www.archdaily.com/954840/apartment-renovation-in-singapore-studio-wills-plus-architects ; US Access Board entrances/doors and vestibules: https://www.access-board.gov/ada/guides/chapter-4-entrances-doors-and-gates/ ; Designing Buildings entrance lobbies: https://www.designingbuildings.co.uk/wiki/Lobby ; ArchDaily entry thresholds: https://www.archdaily.com/1181422/before-the-living-room-entry-thresholds-in-compact-urban-homes .

### Verification examples
1. Node text 'I want a vestibule': term detected; meaningful two-door transition in plan and section; three distinct vestibule types; Studio Wills project separately; sourced reading.
2. Node text 'A pavilion with a vestibule': vestibule term read as a distinct architectural feature, without substituting a generic pavilion.
3. Node text 'introduce a ramp and screens': both terms detected and switchable, with different diagrams and requirements.
4. Node text with no known spatial term: candid no-match guide, never blank/mislabeled geometry.
5. Link node: source and destination clearly shown, direction preview changes before connecting.

**Limit:** This offline dictionary does not understand arbitrary design statements the way a generative architectural model could; its matches and diagrams cover only the curated terms. Add new terms and verified examples before claiming broader coverage.


## Stage C2.2 — Framework walkthroughs and source-linked research (12 October 2026)

The **About** page now provides interactive, keyboard-accessible framework cards for TRACEWORK Grammar, Freeform / Low-Structure, and the six published lenses. Each opens a four-step slideshow: **Overview, Architectural Example, Roles and Method, Source Readings**. Navigation: click Previous/Next or dots, use left/right arrow keys, press Escape to close. Framework descriptions remain authored as *TRACEWORK adaptations* where they are not verbatim roles defined by the scholars. Freeform is explicitly an interface mode, not an academic framework.

The **Research Foundations** section now contains the project's 12 core and associated readings with author, year, publication type, relevance, and sourced publisher/DOI/book links. The C2.2 reading library (`data/references.json`) includes the earlier eight and adds Serrat (Five Whys), Reynolds and Gutman (laddering), Ralph and Wand (formal design definitions), and Suwa and Tversky (sketch cognition). A linked publisher or DOI page is not a guarantee of free access; use institutional library access when required.

Validation checklist: About page cards open the correct frameworks; slides change and read-out matches each lens; research reading cards have clickable and safely externalised links; close/Escape and narrow-screen presentation behave correctly. The reasoning engine, stored projects, map export and browser-local data remain unchanged.


## D1 · Wire patterns, pilot gradients and user legend (14 October 2026)

The canvas now provides an expandable **Wire legend** beneath the map, and the Workspace tutorial explicitly introduces line semantics.

Two independent dimensions must not be conflated:

| Dimension | Visual | Meaning |
| --- | --- | --- |
| Relationship status | Solid | Designer-recorded active reasoning connection. |
| Relationship status | Dashed | Provisional connection to examine further. |
| Relationship status | Faint dotted | Rejected connection retained for traceability/comparison. |
| Pilot recurrence | Darker/thicker | Category transition observed across many P01–P10 participants. |
| Pilot recurrence | Medium | Transition observed across several participants. |
| Pilot recurrence | Lighter/thinner | Transition observed in fewer participants, or not observed in the mapped sample. |
| Pilot recurrence | Neutral | No comparable pilot signal available (for example a loose note). |

**Frequency does not equal confidence or proof.** The P01–P10 dataset describes how often a type of transition was coded, not the reliability of this designer's specific reasoning, and not a required architectural design sequence. The **Hide wire signals** control removes the frequency grading but continues to display active/provisional/rejected relationship patterns. The selected-wire explanation links back to the legend. Both node and wire data remain unchanged by this presentation update. SVG/PNG/PDF map exports reproduce the wire styling shown in the preview, including dash pattern and graded line weight.


## D1.1 — Contextual Wire Guidance and Responsive Layout (14 October 2026)
- **Wire click**: selects a connection; does not open an interrupting modal. A concise inspector now shows endpoints and an optional expandable **Explain This · Is there a reasoning gap?** section with contextual questions.
- **Grasshopper-style link cues**: drag a node connection handle and compatible/incompatible destination handles visually respond. Hover a destination handle for a short, contextual explanation. This is advisory, not a prohibition of unconventional reasoning.
- **Pilot signals OFF**: uniform neutral **solid** edges. The relationship's saved active/provisional/rejected status is preserved in the data; turn signals back on to see their patterns and empirical category-transition grading.
- **Wire legend**: displayed only while a wire is selected. This avoids a permanent legend competing with the reasoning map.
- **Evidence / provenance**: both remain optional. Origin identifies who or what introduced a statement; evidence type identifies what supports it. PROV-O is conceptual grounding, not a claim of formal RDF compliance.
- **UI**: centered responsive primary ribbon; title-cased About section labels; provenance explanations wrap instead of overflowing narrow windows.
- **Regression priorities**: existing project restore, node role inspector, Ctrl+Z and exports remain unchanged.


## D1.2 — Contextual connection guidance (14 October)
- Restored the plain control labels **Show wire signals / Hide wire signals**. Empirical transition patterns are explained separately in the optional legend and never used to claim a particular connection is logically correct.
- Connection handles show a consistent black tooltip. A proposed nonstandard reasoning jump is allowed and marked **Gap in Reasoning** before/during linking; if saved, a bottom-right advisory explains what remains unstated.
- An already accepted wire no longer shows the contradictory standing label “Gap in Reasoning.” Its inspector instead offers an optional, pair-sensitive explanation and a test to consider.
- Examples draw on the text of the two actual nodes, including spatial concerns such as seating, circulation, privacy and daylight. Explanations are conditional, not automatic evidence of causation.
- **Provenance Gap** remains separate, flags possible misattribution and does not silently block cross-origin design reasoning.
- Existing projects, undo, map arrangements and exports remain unchanged.
