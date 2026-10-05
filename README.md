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
