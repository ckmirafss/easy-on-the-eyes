# Typography

Rules for type size, line length, spacing, weight and fonts. Grades are explained in `SKILL.md`.

One caution covers this whole file. Almost no typography study measures eye strain. They measure reading speed, comprehension and preference. "Less tiring" is an inference from "less effortful to read".

## Contents

- `type-rem-zoom`
- `type-body-size`
- `type-measure`
- `type-leading`
- `type-weight`
- `type-align`
- Fonts
- Dark themes
- Non-Latin scripts

## type-rem-zoom

**Grade:** standard (WCAG 2.2 SC 1.4.4 and 1.4.10, level AA). **Severity:** error.

Set font sizes in `rem` so they follow the reader's browser setting. Text must survive 200% zoom, and the layout must reflow at 320 CSS px wide. A font size made only of viewport units does not respond to zoom and is a listed WCAG failure (F94). Never disable pinch zoom.

```html
<!-- Incorrect -->
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">

<!-- Correct -->
<meta name="viewport" content="width=device-width, initial-scale=1">
```

```css
/* Incorrect */
h1 { font-size: 6vw; }

/* Correct: a rem term keeps zoom working. Keep the maximum at or under 2.5 times the minimum. */
h1 { font-size: clamp(2rem, 1.5rem + 2.5vw, 3.5rem); }
```

In Next.js, do not set `userScalable: false` or a `maximumScale` under 5 in the `viewport` export.

Sources: [Understanding SC 1.4.4](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html), [Understanding SC 1.4.10](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html), [Fluid type and accessibility](https://www.smashingmagazine.com/2023/11/addressing-accessibility-concerns-fluid-type/)

## type-body-size

**Grade:** research. **Severity:** warning.

Body text is `1rem` at minimum. Use `1.125rem` to `1.25rem` for long reading on laptops and desktops. Nothing people are meant to read goes under `0.875rem`.

This is the best-supported lever in the skill. Reading speed stays flat over a wide range of sizes and then falls off sharply below a critical size, with an x-height of about 0.2 degrees of visual angle as the edge. Reading for an hour at the acuity limit is slower and produces more symptoms than reading text two to four times larger. By geometry, 16px text on a laptop or desktop lands almost exactly on that edge, which leaves no margin for a reader with slightly under-corrected vision. So 16px is a floor, not a target. Phones are held closer and already gain visual angle.

```css
/* Incorrect */
body { font-size: 14px; }

/* Correct */
body { font-size: clamp(1rem, 0.95rem + 0.25vw, 1.125rem); }
.article { font-size: 1.125rem; }
```

Small sizes are fine for short labels, captions and table metadata. Say so when you report a finding, and ask whether the text is meant to be read at length.

A common citation to correct: the "18px is optimal" claim comes from a study that recommended 18 points, which its authors equated to 24 pixels on a low-density screen. The direction transfers. The pixel number does not.

Sources: [Legge & Bigelow 2011](https://jov.arvojournals.org/article.aspx?articleid=2191906), [Kochurova et al. 2015](https://researchconnect.suny.edu/en/publications/is-the-3-reading-rule-appropriate-for-computer-users/), [TFOS Lifestyle 2023](https://openaccess.city.ac.uk/31838/1/1-s2.0-S1542012423000307-main.pdf)

## type-measure

**Grade:** convention, with moderate research support. **Severity:** note.

Cap reading text at `50ch` to `60ch`, with `55ch` as the default. The classic 45 to 75 characters is a print convention. Screen studies find no single best length: lines of about 55 characters are rated easiest, and very long lines are read faster but understood less and disliked. WCAG 1.4.8 (AAA) caps lines at 80 characters.

One `ch` is the width of a zero, which is wider than an average letter, so a line holds more characters than its `ch` value. In one test of a 20px article across four font stacks (Chrome on Linux), `60ch` gave lines averaging 73 to 79 characters and `65ch` gave 80 to 86, which is past the WCAG cap. `55ch` lands near 70. Fonts differ, so count a few lines in the real layout.

```css
p, li, blockquote { max-inline-size: 55ch; }
```

Apply it to reading text, not to the page container. Tables, code and dashboards can run wider.

Sources: [Dyson 2004](https://stu.westga.edu/~ssynan1/literacy/Dyson.pdf), [Understanding SC 1.4.8](https://www.w3.org/WAI/WCAG22/Understanding/visual-presentation.html)

## type-leading

**Grade:** convention. Tight leading being harmful is research. **Severity:** warning under 1.1, note from 1.1 to 1.39.

Use a unitless `line-height` of 1.5 for body text, anywhere from 1.4 to 1.6. Headings take 1.1 to 1.3.

Only tight leading is clearly harmful to reading. The comfort argument is separate: text is a striped pattern, and the ratio of x-height to line spacing explains most of how far a page departs from the visual statistics the eye handles easily. More space between lines weakens the stripes. See `pattern-stripes` in `layout-and-patterns.md`.

WCAG 1.4.12 is often misread. It does not require a line height of 1.5. It requires that nothing breaks when a reader sets line height to 1.5, paragraph spacing to 2em, letter spacing to 0.12em and word spacing to 0.16em.

```css
/* Incorrect: clips when a reader raises spacing */
.card-title { height: 48px; overflow: hidden; line-height: 1; }

/* Correct */
.card-title { min-height: 3rem; line-height: 1.2; }
body { line-height: 1.6; }
```

Leave `letter-spacing` at normal for body text. Add 0.05 to 0.12em only to all-caps labels.

Sources: [Understanding SC 1.4.12](https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html), [Wilkins, Smith & Penacchio 2020](https://repository.essex.ac.uk/30127/1/The%20Influence%20of%20Typography%20on%20Algorithms%20that%20Predict%20the%20Speed%20and%20Comfort%20of%20Reading.pdf), [Yu et al. 2007](https://experts.umn.edu/en/publications/effect-of-letter-spacing-on-visual-span-and-reading-speed/)

## type-weight

**Grade:** convention. **Severity:** warning.

Body text is weight 400 or more. Use 500 for small text. Keep weights 100 to 300 for large display type only.

Regular and bold read at the same speed, so this is not about speed. Thin strokes render fainter than their nominal color, which lowers real contrast, and the effect is worst for light text on dark.

```css
/* Incorrect */
body { font-weight: 300; -webkit-font-smoothing: antialiased; }

/* Correct */
body { font-weight: 400; }
```

Do not set `-webkit-font-smoothing: antialiased` globally. It thins text on macOS.

Sources: [APCA in a Nutshell](https://git.apcacontrast.com/documentation/APCA_in_a_Nutshell.html), [MDN font-smooth](https://developer.mozilla.org/en-US/docs/Web/CSS/font-smooth)

## type-align

**Grade:** standard (SC 1.4.8, level AAA) plus older research. **Severity:** warning.

Use `text-align: start`. Do not justify body text: the uneven word gaps hurt weaker readers. Keep all caps to short labels, and italics to short emphasis.

All caps reads 5 to 14% slower. The cause is that people have less practice with it. The old "word shape" explanation is not supported.

Sources: [Understanding SC 1.4.8](https://www.w3.org/WAI/WCAG22/Understanding/visual-presentation.html), [The science of word recognition](https://learn.microsoft.com/en-us/typography/develop/word-recognition)

## Fonts

**Grade:** research.

There is no best font. In a study of 352 readers and 16 fonts, people read 35% faster in their fastest font than their slowest, and their preferred font was their fastest only one time in five. Serif and sans-serif show no reliable difference on modern screens. Fonts designed for dyslexia show no benefit once spacing is matched.

What follows from that:

- Pick a mainstream, familiar font with a generous x-height, open shapes and distinct `I`, `l` and `1`. A system font stack is the lowest-risk choice.
- Never block the reader's own font or size overrides.
- Do not make a dyslexia font the default. Offering spacing options helps more.
- Keep text from jumping while fonts load: `font-display: swap` or `optional`, a fallback matched with `size-adjust`, WOFF2, and preload for critical files.

```css
body { font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", "Noto Sans", sans-serif; }

@font-face {
  font-family: "Body Fallback";
  src: local("Arial");
  size-adjust: 105%;          /* tune until the swap causes no reflow */
}
```

Sources: [Wallace et al. 2022](https://jeffhuang.com/papers/Readability_TOCHI22.pdf), [Arditi & Cho 2005](https://pubmed.ncbi.nlm.nih.gov/16099015), [Wery & Diliberto 2017](https://link.springer.com/article/10.1007/s11881-016-0127-1), [web.dev font best practices](https://web.dev/articles/font-best-practices)

## Dark themes

**Grade:** convention.

Light text on dark looks heavier than the same weight in dark on light, and it is less legible at small sizes. In dark themes, never go below the body minimum, avoid thin weights entirely, and use off-white instead of pure white for large or bold type.

If the font has a grade axis, lower it in dark mode. It changes apparent weight without moving the layout. The specific value is a matter of eye, since the one controlled study did not settle it.

```css
@media (prefers-color-scheme: dark) {
  body { font-variation-settings: "GRAD" -50; }   /* only for fonts with a GRAD axis */
}
```

Sources: [Piepenbrock et al. 2014](https://doi.org/10.1177/0018720813515509), [Adjusting perceived weight in dark mode](https://nerdy.dev/adjust-perceived-typepace-weight-for-dark-mode-without-layout-shift)

## Non-Latin scripts

These defaults are tuned for Latin text. WCAG halves the line-length cap to 40 glyphs for Chinese, Japanese and Korean, and exempts scripts from spacing properties they do not use. Scope Latin rules with `:lang()` on multilingual sites, and say that the non-Latin text was not checked.
