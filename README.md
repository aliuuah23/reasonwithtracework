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
