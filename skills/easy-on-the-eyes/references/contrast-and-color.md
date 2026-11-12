# Contrast and color

Rules for text and background colors, palettes and dark themes. Grades are explained in `SKILL.md`.

## Contents

- `contrast-floor`
- `contrast-pure-extremes`
- `contrast-dark-secondary`
- `contrast-saturated-on-dark`
- `contrast-color-alone`
- Target ranges
- How to measure

## contrast-floor

**Grade:** standard (WCAG 2.2 SC 1.4.3 and 1.4.11, level AA). **Severity:** error.

Every text and background pair needs at least 4.5:1. Large text (24px, or 18.66px bold) and interface parts such as input borders, icons and focus rings need at least 3:1. A ratio is never rounded up to a pass: 4.499:1 fails. On white, `#767676` passes at 4.54:1 and `#777777` fails at 4.47:1. The script truncates the ratios it prints for the same reason.

Focus rings, input borders and icons count as interface parts. A hairline divider is decoration and is exempt, but the edge of a text field is not.

This is the legal floor. The US ADA Title II rule names WCAG 2.1 AA, and the EU standard EN 301 549 follows WCAG 2.2. The contrast criteria are the same in both versions.

```css
/* Incorrect: 3.27:1 on white */
.hint { color: #8e8e8e; }

/* Correct: 6.25:1 on the default light background */
.hint { color: var(--muted); }
```

Light themes are where this rule bites. Mid-gray text that looks fine to a designer often fails.

Sources: [WCAG 2.2](https://www.w3.org/TR/WCAG22/), [Understanding SC 1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)

## contrast-pure-extremes

**Grade:** convention. **Severity:** warning.

Use near-black text on a near-white background in light themes, and off-white text on dark gray in dark themes. Avoid `#000` on `#fff` and `#fff` on `#000` as page defaults.

Be honest about why. No study shows that pure black on pure white causes eye strain. One set of experiments found that reported eyestrain did not change with polarity or contrast at all. The rule is here because nearly every major design system softens the extremes, it costs no legibility, and a full-white page in a dim room is the page-level version of a glare source. Tell the user it is a default, not a finding.

```css
/* Incorrect */
body { background: #fff; color: #000; }            /* 21:1 */

/* Correct */
body {
  background: oklch(0.985 0.002 90);                /* near-white, faintly warm */
  color: oklch(0.24 0.01 255);                      /* near-black, 15.75:1 */
}
```

Do not flag `forced-colors` or `prefers-contrast: more` blocks. People who ask for maximum contrast should get it.

Tailwind and shadcn/ui defaults are pure white with near-black at about 19.8:1. Override `--background` and `--foreground`, and prefer `bg-background` and `text-foreground` over `bg-white` and `text-black`.

Sources: [Buchner & Baumgartner 2007](https://doi.org/10.1080/00140130701306413), [Huang et al. 2021](https://mdpi-res.com/d_attachment/applsci/applsci-11-08679/article_deploy/applsci-11-08679.pdf), [IBM Carbon color](https://carbondesignsystem.com/elements/color/overview/), [Radix Colors](https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale)

## contrast-dark-secondary

**Grade:** inference. **Severity:** warning.

On dark surfaces, secondary text needs 8.5:1 or better. Passing 4.5:1 is not enough there.

The WCAG formula overstates contrast between dark colors. `#777777` on `#000000` passes AA at 4.69:1 and is barely readable. `#a0a0a0` on `#121212` passes at 7.16:1 and still reads weak. APCA, a newer perceptual model, puts its content-text level at about `#b2b2b2` on `#121212`, which is 8.83:1. The 8.5:1 figure is a WCAG-ratio stand-in for that level so the check needs no APCA code. Label it a heuristic.

```css
/* Incorrect: passes AA, reads weak */
.dark .meta { color: #8b949e; }                     /* 6.15:1 on #0d1117 */

/* Correct */
.dark .meta { color: oklch(0.78 0.01 255); }        /* 9.39:1 on the default dark background */
```

Dark themes also need care with font weight. See `typography.md`.

Sources: [Understanding SC 1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html), [APCA in a Nutshell](https://git.apcacontrast.com/documentation/APCA_in_a_Nutshell.html), [analysis by Tobias Bengfort](https://github.com/xi/apca-introduction/blob/main/analysis.md)

## contrast-saturated-on-dark

**Grade:** research for red text on dark, convention for the numeric ranges. **Severity:** warning.

Do not set small text in saturated red or pure blue on a dark background. Pure `#0000ff` on black is 2.44:1. In a study of light-on-dark reading in low light, red text produced the most measured visual fatigue. NN/g saw a blue that passed at 4.59:1 and still blurred into its dark background.

Accents need different values per theme. The ranges below come from the tokens that major design systems ship, not from a study.

| Theme | OKLCH lightness | OKLCH chroma |
|---|---|---|
| Light | 50 to 56% | 0.19 to 0.24 |
| Dark | 65 to 75% | 0.13 to 0.17 |

```css
:root {
  --accent: light-dark(oklch(0.5 0.19 255), oklch(0.74 0.13 255));
}
```

Avoid placing saturated red directly against saturated blue. The eye focuses the two at different depths, which makes the edge shimmer.

Sources: [Fan et al. 2024](https://doi.org/10.3390/s24113516), [NN/g dark mode issues](https://www.nngroup.com/articles/dark-mode-users-issues/), [OKLCH in CSS](https://evilmartians.com/chronicles/oklch-in-css-why-quit-rgb-hsl)

## contrast-color-alone

**Grade:** standard (SC 1.4.1, level A). **Severity:** error.

Never signal state with color alone. Softer accents shrink the difference between hues, and about 8% of men have red-green color vision deficiency. Pair color with text, an icon, a shape or a clear change in lightness.

```html
<!-- Incorrect -->
<span class="text-red">Payment failed</span>

<!-- Correct -->
<span class="status-error"><svg aria-hidden="true">...</svg> Error: payment failed</span>
```

Sources: [WCAG 2.2](https://www.w3.org/TR/WCAG22/), [Birch 2012](https://doi.org/10.1364/josaa.29.000313)

## Target ranges

These are the ranges the major systems land in. They are convention.

| Role | Light theme | Dark theme |
|---|---|---|
| Background, OKLCH lightness | 97 to 100% | 18 to 24% |
| Body text, OKLCH lightness | 20 to 29% | 89 to 95% |
| Body text ratio | 14:1 to 18:1 | 12:1 to 16:1 |
| Secondary text ratio | 4.5:1 or more | 8.5:1 or more |

Elevated surfaces in a dark theme get lighter, never darker. Tinted "paper" backgrounds are a taste choice: a faint warm near-white keeps contrast high, while a strong sepia trades real contrast for a benefit nobody has measured.

## How to measure

```bash
node <skill-dir>/scripts/audit.mjs contrast "oklch(0.78 0.01 255)" "oklch(0.18 0.01 255)"
node <skill-dir>/scripts/audit.mjs contrast "oklch(0.62 0.01 255)" "oklch(0.985 0.002 90)" --min 3
```

The script computes the WCAG 2 ratio and adds comfort notes. It accepts hex, `rgb()`, `hsl()`, `oklch()`, `white` and `black`. A translucent foreground is blended onto the background the way a browser paints it. It exits 0 when the pair meets 4.5:1, or the ratio given with `--min`. Use `--min 3` for large text, borders, icons and focus rings.

For an APCA second opinion on a dark theme, use the APCA readout in Chrome DevTools (Settings, Preferences, Elements). APCA body text level is Lc 75, preferred Lc 90. APCA is not part of WCAG 2 or the current WCAG 3 draft, and its reference package has a license that restricts use and modification. Report its numbers as advisory. Do not copy its source into a project.

Sources: [WCAG 3.0 Working Draft](https://www.w3.org/TR/wcag-3.0/), [Adrian Roselli on WCAG 3 contrast](https://adrianroselli.com/2026/04/wcag3-contrast-as-of-april-2026.html), [apca-w3 license](https://github.com/Myndex/apca-w3/blob/master/LICENSE.md)
