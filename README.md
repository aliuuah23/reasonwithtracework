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
