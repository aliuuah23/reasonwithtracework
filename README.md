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
