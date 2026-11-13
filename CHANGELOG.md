# Changelog

## 1.1.1 (2026-11-13)

- Re-checked every date-sensitive fact against live data: browser support (web-features 3.46.0, MDN data 8.1.9), framework versions, Node release status and WCAG status
- Scripts now state Node 22 or later. Node 18 and 20 are past end of life, and current Playwright needs Node 20 or later
- The browser support table is dated and names the stable browser versions it was checked against
- Added a weekly freshness check that flags changes in browser support or major framework versions
- CI runs on Node 22, 24 and 26

## 1.1.0 (2026-11-13)

- `scripts/inspect.mjs`: opens any URL or local page in a browser and reports a design brief (fonts, type scale, palette, line length, layout, surfaces, motion) plus a comfort check on the rendered page
- New `study` mode for learning from reference sites before designing
- Seven craft rules and `references/craft.md` for keeping work from looking generated
- `audit.mjs` now reports gradient text and stock purple gradients

## 1.0.0 (2026-11-13)

First release.

- 25 rules across contrast, luminance, typography, motion, patterns, layout and theming, each with an evidence grade
- Build, audit and fix modes
- `scripts/audit.mjs`: dependency-free static audit with text and JSON output, plus a contrast checker for hex, `rgb()`, `hsl()` and `oklch()`
- `assets/tokens.css`: starter tokens for light, dark and dim themes
- Six reference files with sources and before/after code
