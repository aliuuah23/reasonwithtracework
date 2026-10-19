# TRACEWORK — User Guide (D2.0 development release)

D1.9 interactions were accepted in the live browser. The D2.0 reasoning tools are new and require deployed-browser verification.

## 1. Start and manage a trace

Open the [website](https://aliuuah23.github.io/reasonwithtracework/) and choose **Quick brief** or **Long brief / document**. Paste or upload the design language, optionally name the project, and start tracing. The short and long pavilion examples are optional rather than automatically loaded. Projects appear under **My Trace** and in the homepage project shelf.

**Storage warning:** work is saved on this browser/device, not to a server account. Export a JSON backup before moving computers, changing browsers, resetting site data or undertaking disruptive experiments.

## 2. Inspect language and develop reasoning

Choose a highlighted phrase or an interpretive hotspot. The Focus Map shows connected reasoning around the selection. Add or edit nodes to externalise what the text suggests, what grounds the proposition, what spatial consequences follow and how design choices are assessed. TRACEWORK Grammar distinguishes:

- Input: source language or stated conditions.
- Interpretation: a reading of meaning or implication.
- Grounding: contextual support, association, assumption or evidence.
- Spatial Consequence: a design move or spatial effect.
- Evaluation: criterion, trade-off, comparison or judgement.
- Goal: the aim or value being pursued.

Freeform/Low-Structure is available for thoughts that do not need to be classified through a visible grammar. Framework-specific views are **interpretations of the same trace**; they do not prove what any participant or designer historically thought.

Use a hotspot chip's **Edit** action to change a source-bound selection, rather than reconstructing downstream linked nodes. When editing the underlying source document, inspect consequences for range/ID references and export a backup if the source is substantial.

## 3. Connections, explanations and provenance

Link thoughts to show a meaningful relationship. **Gap in Reasoning** suggests a relationship may need clarification; a skipped intermediate role is not automatically prohibited. **Provenance Gap** is separate: it asks whether a link risks confusing authorship, software output and source attribution. Warnings are advisory and may appear together; an existing accepted wire can be inspected without opening a disruptive modal. Text-sensitive guidance is interpretive, not a verifier of architectural truth.

The edit interface distinguishes a thought (Entity), who or what is attributed responsibility (Agent), how it was produced/revised (Activity), and an optional supporting source/record. These are conceptually based on the [W3C PROV-O model](https://www.w3.org/TR/prov-o/); a JSON trace is **not** a formally valid PROV-O/RDF export. Old attribution labels may remain in saved files for audit rather than being rewritten silently.

## 4. Navigate the maps

- **Focus Map:** reasoning around selected language.
- **Aggregate Map:** project-wide reasoning with current visibility filters.
- **Original Map:** manual map arrangement, preserved independently from automated Arrange layouts.
- **Arrange Map / Reflow:** alternative layout and framework-aware arrangement; verify before relying on large complex maps.
- **Fit Map:** bring the currently visible graph into view; use drag/zoom as needed.

Use the Brief and Guidance panel toggles to make more workspace room. At narrow browser widths, the navigation remains on one row and may scroll horizontally.

## 5. Architectural reference support

Spatial Reading Studio recognises a **curated** group of architectural terms and can show schematic feature studies (such as plans/sections), specific feature variants and selected built-project precedents. It can also suggest reading or project-search queries. Searches are **prompts for research**, not validated literature or automatically verified examples. Unknown terms should not be matched to fabricated diagrams.

## 6. Export, review and restore

For an entire project map, choose **Aggregate Map → Show all**, then **Export map**. Use **Preview map** before choosing SVG, PNG or PDF. Export-time controls can hide rejected pathways and automatically arrange the exported image; these are **snapshot-only** options and should not modify saved project layouts. PDF currently uses the Chrome print dialog and **Save as PDF**.

To back up a trace, use the project JSON export in **My Trace**. **Import saved JSON** restores it, creating a separate copy when an ID collides rather than silently overwriting existing work. Project combining creates new composites rather than synchronising the originals. Use **Project check** to identify structural concerns and incomplete reasoning opportunities; warnings are not design grades.

**Never use Reset local data just to fix a visual display issue.** It intentionally clears browser-local work on that device.

## 7. Reasoning Tools (D2.0 — verify after deployment)

Select **Reasoning Tools** above the canvas to open four optional functions. **Start Me Off** responds to selected brief language with a small set of contextual questions. **What Next** responds to the selected reasoning node and its connections. Choosing a starting phrase puts an editable draft into the existing command line; it does not create a node until you save it yourself.

**Compare Structure** reads the same visible nodes through two chosen frameworks. Saved roles are labelled separately from inferred analytical readings. It does not change the project's active framework or the recorded history of how the design decisions were made. **Decision Digest** summarises recorded spatial propositions, evaluations, goals, rejected options, attribution and review questions. It can be copied or downloaded as Markdown. It is not an automatic architectural assessment.

In **Freeform**, writing a new thought creates an unclassified note unless the user explicitly reveals and selects a role. The six theoretical lenses remain optional.

## 8. Still planned

Image/Reference nodes with paste or upload, resizing, appropriate image storage and image-aware exports are planned for D2 Visual. D3 remains the full-system verification and final website freeze.
