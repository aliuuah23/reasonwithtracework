# TRACEWORK — Round B1.5 (deployment candidate)

B1.4 foundation plus targeted corrections for the failed Round B tests.

Changes in B1.5:
- Privacy seeded aggregate demo now stores the complete "Different degrees of privacy" phrase. Existing local saved copies of the `agg-hot-5` suggested hotspot are repaired on opening; designer-selected phrases are not rewritten.
- Phrase detection now includes "Different degrees of privacy" and "individuals and small groups" for newly entered briefs, rather than relying on separate word matches.
- Corrected malformed escaped CSS lines in `css/layout.css` affecting the classifier explanation block.
- Cache-busting updated to B1.5 for the changed source/highlighter modules and layout/styles, avoiding stale GitHub Pages/browser assets.
- Preserves B1.4 span-based line-wrapping highlights, graph drag undo snapshots, native text editing protection, nonclipped tooltips, compact command input, and all Stage A framework features.

Important limitations:
- Static/syntax and data checks were performed. Full live browser interactions still need a hard-refresh smoke test on the deployed GitHub Pages site.
- Local browser traces are saved in localStorage, not in this ZIP. Export important traces before switching builds or clearing site data. Uploading these files alone does not clear saved traces.

After deployment, hard-refresh Ctrl+Shift+R, open the saved/seeded pavilion trace, check Privacy and Users phrase highlighting, drag single and multiple nodes and Ctrl+Z, type/backspace in the command line, inspect a narrow-screen tooltip, and check explanation wrapping and text size.

Deploy: upload the CONTENTS of this ZIP to the root of your existing GitHub Pages repository (index.html, js/, css/, data/, etc.). Do NOT upload the ZIP as a single file.
