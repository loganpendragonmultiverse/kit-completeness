# Development and completion acceptance

Keep reusable reference lists for board games, camping gear, craft supplies or camera kits. Compare required quantities with the items you actually counted, using notes and reference photos.

## Bounded version 1 scope

Create/edit kits and item quantities; keep reference notes/photos; retain extra quantities while reporting missing items independently; reset with confirmation and undo without replacing newer saves; print a readable checklist.

- You supply item identities and quantities. No image recognition, automatic counting, shopping or external inventory integration.
- A complete count does not assess equipment condition or suitability.
- Up to 100 kits and 300 item types in one kit. Count values must be whole numbers. Extra present quantities remain recorded but are capped at the required quantity in the “accounted for” total.
- Photo picker accepts PNG/JPEG/WebP under 1.4 MB and prepares a white-background JPEG at up to 1200 pixels per side. Transparency is flattened. Imported supported raster photos are limited to 1.4 MB and 1600 pixels per side.

## Architecture

Dependency-free ES modules separate pure input/domain logic (`core.js`), guarded persistence and versioned backups (`vault.js`), DOM helpers (`ui.js`) and the project-specific interface (`app.js`). User text reaches text nodes. The pet/kit raster validator checks allowed signatures, lengths and dimensions before an imported backup can replace data; the photo picker decodes/resizes/re-encodes locally. Print output is generated from saved records.

## Required completion evidence

Meaningful domain and persistence tests, syntax/network checks, all three browser engines at desktop/narrow widths, keyboard-accessible controls, source and directly opened exact ZIP entry point, actual print output, import cancel/confirm, corrupt storage recovery, stale writes, quota failures, deletion/reset undo and async input races must be reviewed. Independent review must leave no identified meaningful remaining contribution inside the intended scope. Publication still requires repository/CI/CodeQL settings, immutable tag, exact tag-built artifact digests and the coordinated Forge/catalog/owner reconciliation. No Gold status is assigned in this candidate.
