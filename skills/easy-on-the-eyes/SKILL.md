---
name: easy-on-the-eyes
description: Applies and audits visual-comfort rules for websites and web apps so an interface does not add avoidable eye strain. Covers text size, contrast floors and ceilings, light and dark themes, motion, flashing, stripe patterns and layout stability, with every rule graded as research, standard, convention or inference. Use when building or styling UI meant for long reading or daily use, when setting up color tokens, typography or dark mode, or when the user says a page is hard to read, too bright, harsh, glaring, tiring, "hurts my eyes" or should be "easy on the eyes". Also handles "/easy-on-the-eyes audit" and "/easy-on-the-eyes fix". Not for full WCAG compliance audits, brand palette creation or personal eye-health advice.
license: MIT
metadata:
  author: Blackbyrds Digital
  version: "1.0.0"
---

# Easy on the Eyes

Most eye strain at a screen comes from things a website cannot touch: blinking, focus distance, uncorrected vision, the room. What a site controls is how much extra visual work it asks for. This skill removes that extra work and says how strong the evidence is for each rule.

## The claim you are allowed to make

Say the design "does not add avoidable visual strain". Never write that a design prevents, reduces or cures eye strain, protects the eyes, or is "blue-light safe". Do not describe dark mode, warm tints or special fonts as health features. If the user asks for that kind of copy, explain why and offer the honest wording.

## Modes

Read the arguments the skill was invoked with.

- **No argument, or a build task.** Apply the rules while you write or edit UI. Start from `assets/tokens.css` when the project has no color or type tokens yet. When the UI is written, run the script on it and go through "What the script cannot see" before you say it is done.
- **`audit`** (optionally followed by a path). Run the script, then review what a script cannot see. Report with the template below. Change nothing.
- **`fix`** (optionally followed by a path). Run the audit. Fix errors, then warnings. Leave a note alone unless fixing an error or warning depends on it, or your own review shows it is a real problem. Re-run the script and report.

## Running the script

Run it from the project root and give it the path to check. The script lives in this skill's `scripts/` folder, so use the path this skill was loaded from:

```bash
node <skill-dir>/scripts/audit.mjs src                 # text report, exit 1 if any error
node <skill-dir>/scripts/audit.mjs src --json          # machine-readable
node <skill-dir>/scripts/audit.mjs src --strict        # exit 1 on warnings too
node <skill-dir>/scripts/audit.mjs contrast "#1f2328" "#ffffff"          # one pair
node <skill-dir>/scripts/audit.mjs contrast "#8a8f98" "#ffffff" --min 3  # a border or icon
```

- A path is required. If the user gave none, use the folder that holds the UI source.
- Colors can be hex, `rgb()`, `hsl()`, `oklch()`, `white` or `black`.
- To silence a finding that is intentional, put a comment containing `easy-on-the-eyes-ignore` on that line, or `easy-on-the-eyes-ignore-next-line` on the line before.
- The script needs Node 18 or later and has no dependencies. If Node is missing, apply the rules by hand and say the script was not run.

The script reports under the rule IDs in the table below. Use those same IDs in your report.

## Evidence grades

Every rule carries one grade. Repeat the grade when you explain a finding, so nobody mistakes a habit for a fact.

| Grade | Meaning |
|---|---|
| `research` | Supported by controlled studies or systematic reviews |
| `standard` | Set by a WCAG 2.2 success criterion. The reference file gives the criterion and its level |
| `convention` | Sensible and widely shipped, but no trial behind it |
| `inference` | Derived from research on a related stimulus, not tested on web pages |

## Rules

Severity decides the order: errors first, then warnings, then notes. Inside a severity, work down the table. The severity shown is the usual one. The script lowers it when it cannot tell whether a line is a problem (a small size on what may be a label), and you may raise it when your review shows real harm.

| ID | Rule | Severity | Grade | Reference |
|---|---|---|---|---|
| `type-rem-zoom` | Text must survive zoom. Sizes in `rem`, no viewport-only font sizes, zoom never disabled. | error | standard | typography |
| `contrast-floor` | Every text pair at least 4.5:1. Large text and UI parts at least 3:1. | error | standard | contrast-and-color |
| `contrast-color-alone` | Never signal state with color alone. | error | standard | contrast-and-color |
| `motion-flash` | Nothing flashes more than three times a second. | error | standard | motion |
| `motion-autoplay` | No autoplay video without controls. Anything that moves for over 5 s beside text needs pause. No endless loops beside text. | error | standard | motion |
| `motion-reduced` | Movement exists only inside `prefers-reduced-motion: no-preference`. | error | standard | motion |
| `theme-focus` | Never remove the focus outline without a visible replacement of at least 3:1. | error | standard | theming |
| `type-body-size` | Body text `1rem` minimum, `1.125rem` to `1.25rem` for long reading. Nothing readable under `0.875rem`. | warning | research | typography |
| `motion-triggers` | No parallax, scroll hijacking or large-area zoom. Fades and color changes are fine. | warning | research | motion |
| `contrast-dark-secondary` | Secondary text on dark surfaces at 8.5:1 or better. AA alone reads weak there. | warning | inference | contrast-and-color |
| `contrast-saturated-on-dark` | No saturated red or blue as small text on dark. Lighter, calmer accents in dark themes. | warning | research | contrast-and-color |
| `lum-section-steps` | No alternating full-bleed dark and white sections. No white embeds or modals in a dark theme. | warning | inference | layout-and-patterns |
| `lum-white-flash` | Themed `html` background and a `color-scheme` declaration and meta tag. | warning | convention | theming |
| `layout-shift` | Reserve media dimensions, match fallback font metrics, keep CLS at or under 0.1. | warning | research | layout-and-patterns |
| `contrast-pure-extremes` | Near-black on near-white, off-white on dark gray. Avoid pure black and pure white as page text and background. | warning | convention | contrast-and-color |
| `type-leading` | Body `line-height` 1.5 (1.4 to 1.6). Headings 1.1 to 1.3. | warning | convention | typography |
| `type-weight` | Body weight 400 or more. No 100 to 300 at body sizes. | warning | convention | typography |
| `type-align` | `text-align: start`. No justified body text. Caps for short labels only. | warning | standard | typography |
| `layout-targets` | Pointer targets 24 by 24 CSS px minimum, 44 by 44 for primary actions. Links inside a sentence are exempt. | warning | standard | layout-and-patterns |
| `theme-both-schemes` | Ship light and dark and follow `prefers-color-scheme`. A manual toggle is optional and defaults to system. | note | research | theming |
| `pattern-stripes` | No high-contrast stripes or grids with a 7 to 27 px period over large areas. | note | inference | layout-and-patterns |
| `type-measure` | Reading text capped at `50ch` to `60ch`, which is about 65 to 78 characters. | note | convention | typography |
| `motion-duration` | 100 to 300 ms, 500 ms ceiling, ease-out for entrances. | note | convention | motion |
| `theme-preferences` | Honor `prefers-contrast`, `forced-colors` and `prefers-reduced-transparency`. | note | convention | theming |
| `pattern-clutter` | One primary emphasis per view. Few accent colors, sizes and border styles. | note | research | layout-and-patterns |

Reference files hold the reasoning, sources and before/after code. Read each one that covers a rule you are applying or reporting. A fix across a whole page usually needs three or four of them.

- `references/contrast-and-color.md`: choosing colors, building a palette or a dark theme, explaining a contrast finding.
- `references/typography.md`: type size, line length, spacing, fonts, fluid type.
- `references/motion.md`: animation, transitions, video, scroll effects, loaders.
- `references/layout-and-patterns.md`: tables, grids, stripes, density, section backgrounds, images, layout shift.
- `references/theming.md`: light and dark themes, a theme toggle, focus styles, user-preference media queries, Tailwind and shadcn/ui.
- `references/evidence.md`: when the user asks why, questions a rule, or asks about blue light, dark mode, dyslexia fonts or APCA.

## Defaults to write without being asked

```css
:root {
  color-scheme: light dark;
  --bg:     light-dark(oklch(0.985 0.002 90), oklch(0.18 0.01 255));
  --text:   light-dark(oklch(0.24 0.01 255),  oklch(0.93 0.005 255));
  --muted:  light-dark(oklch(0.48 0.01 255),  oklch(0.78 0.01 255));
  --accent: light-dark(oklch(0.5 0.19 255),   oklch(0.74 0.13 255));
}
html { background-color: var(--bg); color: var(--text); }
body { font-size: clamp(1rem, 0.95rem + 0.25vw, 1.125rem); line-height: 1.6; }
p, li { max-inline-size: 55ch; }
:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
@media (prefers-reduced-motion: no-preference) {
  .card { transition: transform 200ms ease-out; }
}
```

Add `<meta name="color-scheme" content="light dark">` to the page head.

Body text measures 15.75:1 in light and 15.30:1 in dark. Muted text measures 6.25:1 and 9.39:1. The accent measures 5.78:1 and 8.14:1, which is why it is used for the focus ring: the system `Highlight` color can fall under 3:1 on a dark surface. `assets/tokens.css` has the full set, including surfaces, borders for controls, a long-reading size and an opt-in dim theme.

Only add `color-scheme: light dark` once the page really has colors for both schemes. On a page with hard-coded light colors it gives dark scrollbars and form controls on a white page. Fix `theme-both-schemes` in the same change.

Tailwind and shadcn/ui ship pure white with near-black (about 19.8:1) and `bg-white` / `text-black` as pure values. Override `--background` and `--foreground`, and use semantic utilities such as `bg-background` and `text-foreground`.

## What the script cannot see

After running it, check these by reading the code or the rendered page. If you cannot check one, list it under "Not verified" and say why.

- Contrast of each real text and background pair, including text over images and gradients. Measure pairs with the `contrast` command
- Whether small text is body copy or a short label
- Line length in the rendered layout. Count characters in a few full lines
- Flash rate of animations and video
- Brightness jumps between sections and white embeds inside dark themes
- Layout shift during load, including images and video with no `width` and `height`
- Whether state is carried by color alone
- JavaScript-driven animation that ignores reduced motion
- Sizes set in `em`, percentages or the `font` shorthand, and stripes built from `background-size`

## Report template

```
Easy on the Eyes <audit | fix>: <path>

Fixed (N)                      <- fix mode only
  <file>:<line>  <rule-id>  <what changed, one line>

Errors (N)
  <file>:<line>  <rule-id>  [<grade>]
    <offending line, quoted>
    Why: <one sentence>
    Fix: <concrete change>

Warnings (N)
  ...

Notes (N)
  ...

Not verified
  - <check>: <why it could not be checked>

Summary: <the most important thing first. In fix mode, say what is still open and why>
```

In fix mode, the Errors, Warnings and Notes sections list only what is still open after your changes. Keep each finding to the lines shown. Do not list rules that passed. Your counts may differ from the script's when your own review adds or reclassifies findings. Say so in the summary.

## Gotchas

- WCAG 1.4.12 does not require a line height of 1.5. It requires that the layout survives when a user sets it. Do not use fixed heights on text containers.
- Passing 4.5:1 is not the same as comfortable in dark themes. `#a0a0a0` on `#121212` passes at 7.16:1 and still reads weak. Light themes are the opposite: 4.5:1 is the binding limit there.
- `--border` style hairlines sit near 1.3:1 and are decoration. Input and control edges need 3:1, so use a stronger border token for them.
- Do not flag a `forced-colors` or `prefers-contrast: more` block for using pure black or white. Maximum contrast is the point of those blocks.
- Small sizes and tight leading are fine for headings and short labels. The script reports those as notes, or skips them, for that reason.
- A loading spinner that leaves the DOM when loading ends is not an endless-animation problem.
- An animated GIF is a script note because the script cannot tell whether it animates. If it loops beside content for more than 5 seconds, report it as a `motion-autoplay` error.
- APCA is useful as a second opinion on dark themes, but it is not part of WCAG and its reference code has a restrictive license. Use the APCA readout in Chrome DevTools. Do not copy its source into a project.
- This skill works alongside a design skill and a WCAG audit. It does not replace either.
