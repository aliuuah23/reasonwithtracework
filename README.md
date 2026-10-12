# TRACEWORK — Round B1.6 · Stage B hotspot stability

## Fixes
- Fixed the B1.5 hotspot overlap bug: selecting an overlapping word no longer removes the rest of its longer phrase highlight. All intervals are preserved and selected words receive their own active tint.
- Hotspots whose wording does not exist in the current visible brief section no longer paint unrelated text at stale numeric offsets.
- Long-brief reading style now uses consistent, left-aligned 13px typography, without padding between adjacent hotspot fragments or font-size changes on selection.
- Two canonical sample projects are explicitly labelled **Long brief — Flexible Pavilion** and **Short brief — Flexible Pavilion**. Previously saved versions with canonical IDs are kept (not overwritten).
- If other test-named traces exist in local storage, a **Keep 2 test briefs** button appears on the home page. On confirmation it downloads a JSON backup, then removes only the additional test-named traces. Ordinary projects are untouched. It never automatically erases local data on deployment.
- Combine, split and extract brief files are **future Stage C / later backlog**; not introduced into this stability build.

## Deployment
Unzip and upload the root contents to the existing GitHub Pages repository; hard-refresh Chrome after deployment. The ZIP is the complete website. No localStorage clearing is required or recommended.

## Testing
Open the Long brief sample, navigate to Privacy, select `Different degrees of privacy`. Then select a second overlapping hotspot such as `privacy` (from a chip or after adding it). The **full phrase should remain highlighted** with only the selected shorter term tinted more strongly. Repeat in Users for `individuals and small groups`. Resize Chrome narrow to ensure highlights wrap and the source remains left-aligned. Verify Short brief unaffected. Use the optional home page cleanup button only if you wish to retire older test-labelled traces.


## Round B1.7
See ROUND-B1.7-CHANGES.txt for current release notes.
