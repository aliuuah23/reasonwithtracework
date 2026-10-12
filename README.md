# TRACEWORK — B1.3 root fixes

This build is based on the B1.2 full checkpoint and preserves the existing framework, provenance, aggregate-map, source filing, tutorial, classifier and network systems.

B1.3 fixes four recurring issues at their root:

1. **Multi-line hotspot rendering** — source hotspots are now rendered with a true inline text element rather than a `<button>`. Browser buttons remain inline-block/flow-root controls and cannot fragment correctly across wrapped lines; this was why only the last line of phrases such as “Different degrees of privacy” received the highlight. Wrapped phrases now highlight every text fragment end-to-end.
2. **Canvas movement undo** — a drag creates its undo checkpoint only when movement actually begins, and any previously focused text field is blurred when the canvas drag starts. Ctrl/Cmd+Z therefore applies to the canvas move instead of silently undoing command-line text.
3. **Viewport-safe help tooltips** — classifier, legend, node-role and status help now use one body-level black tooltip that is clamped to the browser viewport. It cannot be clipped by the command dock or half-screen panels.
4. **No classifier ellipsis** — classifier reasoning now has a dedicated full-width block outside the compact selector row. It wraps naturally at every width and is never text-overflow truncated.

The root HTML also cache-busts the changed CSS/app entry points (`?v=b1.3`) so GitHub Pages/browser cache cannot mask the fixes after deployment.
