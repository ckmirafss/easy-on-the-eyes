# Changelog

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
