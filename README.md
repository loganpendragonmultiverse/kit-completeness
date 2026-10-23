# Kit completeness

Keep reusable reference lists for board games, camping gear, craft supplies or camera kits. Compare required quantities with the items you actually counted, using notes and reference photos.

Version 1.0.0 candidate. This directory contains implementation and verification work; publication and Gold assessment require the independent review and exact-release gates.

## Start here

Use the extracted release’s `index.html` in a current desktop or mobile browser. For source development, serve the repository root, or the release ZIP’s `source/` directory, locally so its JavaScript modules can load.

1. Choose **New kit**, give it a name and optional storage notes.
2. Add each item, its required quantity, the present quantity and an optional reference photo.
3. Save the kit and review the missing counts. Extra parts do not cover a different missing item.
4. Print the saved checklist. For a fresh count, use **Reset all present counts to zero**, review the confirmation, then save your new count as you work.

## What it does

- Multiple named kits with reusable reference quantities and item notes.
- Required/present counts from 0 to 9999, with a minimum required count of 1.
- Per-item and total missing quantities; optional local reference photos.
- Search kits by name, notes and contents.
- Confirmed count reset, guarded undo, printable checklist and JSON backups.

## Limits and assumptions

- You supply item identities and quantities. No image recognition, automatic counting, shopping or external inventory integration.
- A complete count does not assess equipment condition or suitability.
- Up to 100 kits and 300 item types in one kit. Count values must be whole numbers. Extra present quantities remain recorded but are capped at the required quantity in the “accounted for” total.
- Photo picker accepts PNG/JPEG/WebP under 1.4 MB and prepares a white-background JPEG at up to 1200 pixels per side. Transparency is flattened. Imported supported raster photos are limited to 1.4 MB and 1600 pixels per side.

## Local storage and backups

Changes stay in an editor until you choose Save. Browser local storage is best-effort, not a backup: quotas differ, private browsing can discard data, and clearing site data or changing the app’s origin/browser can make records unavailable. File URLs have browser-specific storage behavior. Extract the release and open `index.html`; if file-origin storage is blocked, serve the folder locally with `python -m http.server 8000` and open `http://localhost:8000/`. This works without Internet access.

Use **Download backup** regularly. It exports saved records only, with any photos and private notes. Keep a copy outside this browser. **Import backup** validates the app identity, format version, field types, identifiers, quantities/dates and size, then opens a replacement preview. Nothing changes until you check the replacement confirmation and apply it. Import replaces the whole saved library; it does not merge. Cancel preserves the existing copy. Backups are limited to 12 MB, but browser storage may fill earlier.

Unreadable stored bytes are never silently reset. Normal saves and normal backup exports are blocked; **Download original recovery bytes** preserves the original string in a text file. A valid backup can replace it only through the explicit import confirmation. If storage is unavailable altogether, saves are blocked. A rejected save leaves the prior saved data and the editor intact.

A save checks the stored baseline before writing. A detected change in another tab blocks stale writes. Copy unsaved form text and keep original selected photos before reloading; a normal backup contains saved records only. This is not a multi-tab transactional database: use one editing tab at a time.

Deletion/reset undo is bound to the exact saved state immediately after the operation. A newer save or restore invalidates that undo, so it cannot overwrite newer work. It does not survive a reload. Cancel/discard confirmations protect unsaved editor work when switching records.

## Privacy and maintenance

The application makes no runtime network requests, has no analytics and has no account. Opening the optional source link leaves the app for GitHub. Browser storage and backup files are not encrypted; use a device/profile you trust. Do not attach real personal backups to public bug reports.

Fixes and useful ideas are welcome. There is no promised update schedule or support response time. See [CONTRIBUTING.md](CONTRIBUTING.md), [SECURITY.md](SECURITY.md), and [SUPPORT.md](SUPPORT.md). MIT licensed; copyright Logan Pendragon Multiverse.

## Development

Requires Node.js 22 or newer and Python 3 for ZIP packaging. No runtime dependency is installed. Run:

```sh
npm ci
npm test
npm run check
npm run build
```

The build creates `dist/site/index.html`, an offline ZIP and `dist/SHA256SUMS`. Source modules are readable in `src/`. The ZIP includes a complete rebuildable `source/` subtree with the original module-based `index.html`, scripts, tests and package files. Its separate root entry point inlines the app so it opens directly from the extracted ZIP. See [TESTING.md](TESTING.md) for browser acceptance. Do not claim a release or Gold assessment from a passing build alone.

## Development checks

Use Node.js 22 or newer and Python 3. Install development-only dependencies with `npm ci`, then run `npm test`, `npm run check` and `npm run build`. For browser acceptance, install the pinned test browsers with `npx playwright install chromium firefox webkit`, then run `npm run test:browser`. CI repeats source checks on Linux, Windows and macOS, and browser acceptance uses Chromium, Firefox and WebKit. These checks do not establish testing on physical phones or every supported OS/browser combination.

`npm run format` applies the repository formatter. The formatter and browser harness are development tools; the distributed application runs without them, accounts or an Internet connection.
