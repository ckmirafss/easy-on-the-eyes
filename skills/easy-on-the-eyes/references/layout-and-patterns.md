# Layout and patterns

Rules for stripes, tables, density, section backgrounds, images and layout stability. Grades are explained in `SKILL.md`.

## Contents

- `pattern-stripes`
- `pattern-clutter`
- `lum-section-steps`
- Images and video
- `layout-shift`
- `layout-targets`

## pattern-stripes

**Grade:** inference. The stimulus is well researched. The pixel mapping is geometry and has not been tested on web components. **Severity:** warning for large areas, note otherwise.

Avoid high-contrast repeating stripes, grids and hatching with a period between about 7 and 27 CSS px over large areas.

Stripes are the best-studied static source of visual discomfort. The effect peaks for high-contrast bars of equal width and spacing at about 3 cycles per degree of visual angle, grows with contrast and area, and is stronger in people with migraine. At a typical desktop distance of 60 cm, one degree is about 40 CSS px, so the peak is a light-plus-dark period of about 13 px and the surrounding band runs from roughly 7 to 27 px.

That band covers pinstripe backgrounds, hatched fills, tight grid overlays, stacked hairline borders and dense tables with strong row rules.

```css
/* Incorrect: 12 px period at near-maximum contrast */
.banner { background: repeating-linear-gradient(90deg, #111 0 6px, #eee 6px 12px); }

/* Correct: wide period and low contrast */
.banner { background: repeating-linear-gradient(90deg, oklch(0.96 0 0) 0 40px, oklch(0.93 0 0) 40px 80px); }
```

For tables:

- Use a faint row tint or a hairline rule, and only one of them.
- Keep the tint within a few lightness points of the surface.
- Zebra striping has no measured speed or accuracy benefit, though many people prefer it. A hairline between rows does the same job with less stripe energy.

```css
/* Incorrect */
tr:nth-child(even) { background: #d9d9d9; }
td { border: 1px solid #000; }

/* Correct */
tr + tr td { border-block-start: 1px solid var(--border); }
```

Body text is itself a striped pattern, which is the comfort argument for generous line height. See `type-leading` in `typography.md`.

Sources: [Monger, Wilkins & Allen 2015](https://www.frontiersin.org/articles/10.3389/fpsyg.2015.01651/full), [Fernandez & Wilkins 2008](https://repository.essex.ac.uk/1515/), [Zebra striping: does it help?](https://alistapart.com/article/zebrastripingdoesithelp/)

## pattern-clutter

**Grade:** research. The measured outcomes are search time and judged clutter, not eye strain. **Severity:** note.

Clutter comes from variety and disorder more than from the amount of content. Keep the number of accent colors, type sizes, weights and border styles small. Group related items by spacing before reaching for boxes. Give each view one primary emphasis.

Dense screens are legitimate. Professional data tables ship with rows as small as 24 px and 14 px text, and nothing in the research says density is harmful by itself. What matters is structure: consistent alignment, clear grouping and a restrained palette.

The claim that whitespace improves comprehension by 20% is a misattributed citation. Do not repeat it. The supported statement is modest: margins affected reading speed, comprehension and satisfaction in one web study.

Sources: [Rosenholtz, Li & Nakano 2007](https://jov.arvojournals.org/article.aspx?articleid=2122001), [NN/g proximity](https://www.nngroup.com/articles/gestalt-proximity/), [Chaparro et al. 2004](https://portfolio.erau.edu/en/publications/reading-online-text-a-comparison-of-four-white-space-layouts/)

## lum-section-steps

**Grade:** inference, from glare research and cinema studies. **Severity:** warning.

Avoid large, sudden changes in how much light the screen gives off. In cinema experiments, viewers reported discomfort when the total light on screen changed sharply, while peak brightness mattered little. The numbers from those studies do not transfer to a monitor, but the direction does.

On the web that means:

- No alternating full-bleed black and white sections down a page. Step between neighboring surface tones.
- No white embeds, iframes, maps or modals inside a dark theme. Theme them, or frame them on a dark surface.
- No white flash when navigating in dark mode. See `lum-white-flash` in `theming.md`.

```css
/* Incorrect */
.section:nth-child(odd)  { background: #fff; color: #000; }
.section:nth-child(even) { background: #000; color: #fff; }

/* Correct */
.section:nth-child(even) { background: var(--surface-2); }
```

A full-white page in a dark room acts like a glare source. The site cannot see the room, but it does decide how much of the viewport is near-white, and it can ship a dark scheme. Do not overcorrect: bright, dark-on-light displays sharpen the image on the retina, so "dimmer is always better" is wrong.

Sources: [Ploumis et al. 2021](https://journal.smpte.org/periodicals/SMPTE%20Motion%20Imaging%20Journal/130/2/14/), [TFOS Lifestyle 2023](https://openaccess.city.ac.uk/31838/1/1-s2.0-S1542012423000307-main.pdf)

## Images and video

**Grade:** convention.

Large bright photos glare inside a dark theme. Dim them slightly, and keep high-dynamic-range media from exceeding the page's brightness. `dynamic-range-limit` works in Chrome and Safari and is ignored elsewhere, which is safe.

```css
img, video { dynamic-range-limit: standard; }

@media (prefers-color-scheme: dark) {
  img:not([src$=".svg"]) { filter: brightness(0.85) contrast(1.05); }   /* illustrative values, adjust by eye */
}
```

Use `currentColor` in inline SVG icons so they follow the theme. For images that need a different version per theme, use `<picture>` with `media="(prefers-color-scheme: dark)"`.

## layout-shift

**Grade:** research for the effect, platform metric for the number. **Severity:** warning.

Content that moves while someone is reading makes them lose their place. Keep Cumulative Layout Shift at or under 0.1.

```html
<!-- Incorrect -->
<img src="chart.png" alt="Sales by month">

<!-- Correct: the browser reserves the space before the image loads -->
<img src="chart.png" alt="Sales by month" width="1200" height="675">
```

```css
.embed { aspect-ratio: 16 / 9; }
html { scrollbar-gutter: stable; scroll-padding-block-start: 5rem; }   /* room for a sticky header */
```

Also: match fallback font metrics so the font swap does not reflow text (see Fonts in `typography.md`), reserve space for ads and late-loading banners, and give sticky headers an opaque background so text does not scroll underneath them at changing contrast.

Sources: [web.dev CLS](https://web.dev/articles/cls)

## layout-targets

**Grade:** standard (SC 2.5.8, level AA, and SC 2.5.5, level AAA). **Severity:** warning.

Pointer targets are at least 24 by 24 CSS px. Primary actions and anything used on touch screens are better at 44 by 44. Links inside a sentence are exempt, since their height follows the line of text. Small targets force slow, careful aiming, which adds effort on every interaction.

```css
.icon-button { min-inline-size: 44px; min-block-size: 44px; }
```

Sources: [Understanding SC 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)
