# TRACEWORK

**Give reasoning traction.**

TRACEWORK is an interactive architectural design-reasoning prototype. It helps designers move from ambiguous language to explicit interpretations, grounding, spatial consequences, evaluations and goals while preserving alternatives and rejected paths.

## Run locally

Because TRACEWORK uses ES modules and JSON data, serve the folder over HTTP instead of opening `index.html` directly.

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## GitHub Pages

This build is static and has no package/dependency step. Commit the repository and deploy the root of the `main` branch with GitHub Pages.

## Structure

- `index.html` — landing + application shell
- `about.html` — research/product explanation
- `css/` — base, layout, components, graph and responsive styles
- `js/core/` — state, ontology, trace model and local persistence
- `js/input/` — brief parsing, hotspot detection and elicitation prompts
- `js/reasoning/` — interpretation, grounding, consequence, evaluation and branching logic
- `js/graph/` — graph layout, rendering and interactions
- `js/evidence/` — pathway bank, references and precedent prompts
- `js/compare/` — side-by-side pathway comparison
- `js/ui/` — workspace, inspector, modals, trace dashboard and notifications
- `data/` — ontology, prompts, starter pathways, references and demo brief

## Prototype note

Starter pathways are explicitly marked illustrative. They demonstrate the interface behaviour and should not be presented as empirical P01–P10 findings unless replaced with verified research data.


## Navigation safety

TRACEWORK autosaves active traces locally. Clicking the brand mark now returns to the product home through a confirmation dialog, About confirms before leaving an active trace, and My Trace includes a deliberate local-data reset control.


## Prototype privacy direction
Current projects and discussion notes are browser-local. A future account layer is intended to keep traces private by default, with optional invited studios/classrooms and scoped collaborators rather than one global public feed.

## Round 1 — intelligent workspace

The current workspace adds a designer-led free-input layer without changing the established visual system:

- free thoughts are classified locally into the six ontology roles while the designer types;
- the suggested role is always overridable by the designer;
- neutral loose notes remain outside the ontology until converted;
- word-level and phrase-level hotspots are both retained, with phrase readings preferred inline when ranges overlap;
- each selected node explains its practical role in the reasoning process;
- selected language and reasoning nodes can surface small pavilion-relevant case-study prompts for comparison rather than prescription.

The classifier is currently a transparent local semantic heuristic, not an external AI service. It is designed so a later model-backed classifier can replace the inference layer without changing the interaction pattern.

## Round 1.1 — stabilisation

Following first-use testing, Round 1.1 keeps the established visual system while refining how the intelligent workspace explains itself:

- saved traces can be deleted from the landing project shelf;
- primary navigation is hardened so Pathway Bank, My Trace and Discussion always switch views reliably;
- classification shows several match strengths rather than a single unexplained percentage;
- Input is explicitly described as source/given material, while Note remains deliberately unclassified;
- newly added nodes are focused and briefly haloed so they are easy to locate;
- ontology-role help moves out of the inspector and onto lightweight node hover help;
- suggested hotspots can be hidden, and designers can drag-select any exact word or phrase from the brief;
- Trace check surfaces open ends and floating reasoning as optional prompts rather than errors;
- case-study prompts are feature-led and link to credible project sources/image galleries.

Manual graph wiring, convergence and node locking remain the core of Round 2 rather than being mixed into this stabilisation patch.

## Round 1.2 — Network bridge / stabilisation
- Primary navigation now opens Pathway Bank, My Trace and Discussion from the landing state; project-dependent views explain when a trace is required.
- Trace Check temporarily halos open/unlinked nodes on the canvas.
- Added Grasshopper-style input/output ports and manual wire creation with connection validation.
- Click a connection and press Delete/Backspace to disconnect it; select a non-Input node and press Delete/Backspace to remove only that node while leaving downstream reasoning available for reconnection.
- New-node halo is stronger but temporary; ordinary selection is quieter.
- Added Hide types / Show types to reduce category-label clutter while keeping reasoning content visible.

### Round 1.3 interaction controls
- Free reasoning nodes are placed unconnected; wire them manually from the right output shoulder to a left input shoulder.
- Right-click a node to lock/unlock its position, disconnect its wires, or delete it.
- Select a wire and press Delete/Backspace, or Shift-click the wire, to disconnect it.
- Ctrl/Cmd+Z restores recent canvas mutations such as node deletion, disconnection, locking, or manual additions.
- Trace Check uses non-blocking on-canvas halos and a compact issue panel.

## Round 2A — Canvas control and signal
- Shift-click multi-select and multi-node dragging.
- Group/ungroup selected nodes; grouped nodes move together.
- Middle-click quick lock/unlock; Shift + middle-click groups/ungroups a current multi-selection.
- Individually selectable wires, per-wire disconnect actions, and Ctrl+Z restoration.
- More explicit connection refusal explanations.
- Neutral category-hidden mode, exact ontology names in the legend, and status hover help.
- Blank-canvas click clears selection.
- Optional wire signal: solid = direct adjacent reasoning; dashed = exploratory/skipped-stage/provisional. This is structural guidance, not empirical frequency or correctness.

## Round 2B — Session + network intelligence

- Returning Home now closes the active workspace session while keeping the saved trace in the local project shelf.
- Free thoughts and notes are placed inside the current viewport instead of being auto-stacked below existing reasoning.
- Ctrl/Cmd+G groups selected nodes; Ctrl/Cmd+Shift+G ungroups; Ctrl/Cmd+F opens TRACEWORK node search.
- Middle-click canvas actions were removed to avoid browser auto-scroll behaviour; lock/group actions remain in the node context menu.
- Wire hit areas are stable and isolated; either node shoulder can initiate a connection. Pulling from the left shoulder asks TRACEWORK to infer a source for the current node.
- Loose notes are wild-card nodes and can connect in either direction to any node type.
- Active/Provisional status is user-selectable from the status pill on a node.
- Connection refusals use a pinnable explanation card and explain the specific role conflict between the two attempted nodes.
- Wire signals now use empirical P01–P10 transition evidence derived from the corrected ontology workbook rather than creation order. Participant coverage is weighted more heavily than raw edge count; signals remain optional via Hide wire signals.


## Round 2B.1 — Long brief intake + guided prompt repair

- Landing now offers **Quick brief** and **Long brief / document** modes without changing the established TRACEWORK visual language.
- Long brief mode can read TXT/MD directly and PDF/DOCX client-side using on-demand browser modules; no document is uploaded to a TRACEWORK server.
- Long briefs are automatically filed into project sections/chunks. The Source panel lets the designer move between sections while hotspot detection remains tied to exact positions in the complete brief.
- Manual phrase selection works inside the active brief section and stores the correct full-document offsets.
- Guided inspector questions are repaired: category chips remain cues, the designer's written answer becomes the node, empty submissions explain what is missing, and the newly generated node is placed beside its source and focused immediately.
- Case-study prompts remain available beneath guided questions as comparative prompts.
- ArchDaily receives an early browser preconnect hint so direct precedent links can begin resolving sooner; final load time still depends on the external site and network.


## Round 2B.2–2B.4 — source editing + pathway focus

- Long-brief chunks can be created, selected and edited before tracing and again inside the workspace.
- Guided answers stay in one writing field so a suggested cue can be extended before it becomes a reasoning node.
- Reasoning nodes can be retyped after creation; double-clicking a node also opens Edit.
- Wire selection uses geometric nearest-path targeting so selecting a wire does not alter its geometry.
- Spatial Consequence nodes can expand a local schematic preview. The plan/axon diagrams are generated from simple spatial cues in the node text and are explicitly exploratory, not a proposed design.
- `Focus path` isolates the selected node's upstream reasoning and downstream consequences without deleting anything; `Show all` restores the complete hotspot trace. This works for both quick and long briefs.


## Round 3A — Aggregate Project Map

This cumulative patch is built directly on Round 2B.4 and preserves the existing workspace. It adds a Focus map / Aggregate map switch. Aggregate map merges all hotspot-specific reasoning maps in the current project into one large navigable field while keeping individual focus-map positions separate from aggregate-map positions.

Aggregate tools include hotspot, brief-section, node-type and status filters; Focus path works inside the aggregate map; clicking a hotspot returns to its individual Focus map; Arrange map restores a loose hotspot-cluster overview without changing the individual maps.


## Round 3A.1 — aggregate-map testing
- Aggregate toolbar now has an always-visible **Show all** control.
- **Load demo map** temporarily seeds every hotspot with a dense reasoning chain plus cross-hotspot links; **Remove demo** removes only those temporary nodes/edges.
- Arrange map now uses a project-wide, type-column field rather than separated hotspot boxes. Focus-map coordinates remain untouched.
- Split/half-window responsive layout keeps the source panel and canvas usable at narrower desktop widths.
