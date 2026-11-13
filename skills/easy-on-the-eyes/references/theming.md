# Theming

Rules for light and dark schemes, the theme toggle, focus styles and user-preference media queries. Grades are explained in `SKILL.md`.

## Contents

- `theme-both-schemes`
- `lum-white-flash`
- Theme toggle
- `theme-preferences`
- `theme-focus`
- Browser support
- Tailwind v4, shadcn/ui and next-themes

## theme-both-schemes

**Grade:** research. **Severity:** note when only one scheme ships.

Ship a light and a dark scheme, follow the reader's system setting, and let them override it.

The evidence does not pick a winner. Dark text on light is more legible for people with typical vision, most of all at small sizes. Studies find no reliable difference in fatigue between the two. And some people need one or the other: light backgrounds are painful for some readers with light sensitivity or cloudy ocular media, while readers with astigmatism or low vision often do better with dark text on light. People also split roughly in thirds between dark, light and mixed use, and they expect a site to follow their system.

So do not present dark mode as better for the eyes, and do not default everyone to it.

```css
:root {
  color-scheme: light dark;
  --bg:   light-dark(oklch(0.985 0.002 90), oklch(0.18 0.01 255));
  --text: light-dark(oklch(0.24 0.01 255),  oklch(0.93 0.005 255));
}
```

`light-dark()` only works when a `color-scheme` is in effect. A manual toggle then needs to do just one thing: set `color-scheme` on the root.

```css
:root[data-theme="light"] { color-scheme: light; }
:root[data-theme="dark"]  { color-scheme: dark; }
```

Sources: [Piepenbrock et al. 2013](https://doi.org/10.1080/00140139.2013.790485), [W3C low vision needs](https://www.w3.org/TR/low-vision-needs/), [NN/g dark mode](https://www.nngroup.com/articles/dark-mode/), [web.dev light-dark()](https://web.dev/articles/light-dark)

## lum-white-flash

**Grade:** convention. **Severity:** warning.

A dark-theme reader should never see a white frame while a page loads. Three things prevent it.

1. A meta tag, so the browser paints the right background before any CSS arrives:

```html
<meta name="color-scheme" content="light dark">
```

2. A themed background on `html`, not only on `body` or a wrapper:

```css
html { background-color: var(--bg); color: var(--text); }
```

3. If there is a manual toggle, a small blocking script in `<head>` that applies the saved choice before first paint. It must not be deferred or a module.

```html
<script>
  (function () {
    try {
      var stored = localStorage.getItem("theme");
      if (stored) document.documentElement.dataset.theme = stored;
    } catch (e) {}
  })();
</script>
```

Sources: [web.dev color-scheme](https://web.dev/articles/color-scheme), [Josh Comeau, dark mode](https://www.joshwcomeau.com/react/dark-mode/), [Tailwind dark mode](https://tailwindcss.com/docs/dark-mode)

## Theme toggle

A manual toggle is optional. Following the system setting with no toggle satisfies `theme-both-schemes`. If you add one, offer three choices and default to the first: system, light, dark. Storing nothing means "follow the system". The blocking script in `lum-white-flash` is only needed when the choice is saved.

A toggle can also be built with no JavaScript, as a radio group that sets `color-scheme` through `:root:has(input[value="dark"]:checked)`. It will not persist across page loads.

```js
const mql = window.matchMedia("(prefers-color-scheme: dark)");

export function setTheme(choice) {            // "system" | "light" | "dark" | "dim"
  const root = document.documentElement;
  try {
    if (choice === "system") localStorage.removeItem("theme");
    else localStorage.setItem("theme", choice);
  } catch {}
  if (choice === "system") delete root.dataset.theme;
  else root.dataset.theme = choice;
}

window.addEventListener("storage", (event) => {
  if (event.key === "theme") setTheme(event.newValue || "system");
});
```

Extra comfort themes such as dim or high contrast are a good addition because sensitive readers pull in opposite directions. Each one must set its own `color-scheme` in CSS so form controls and scrollbars match.

## theme-preferences

**Grade:** convention. **Severity:** note.

The reader's operating system already knows what they need. Honor it.

```css
/* More contrast on request */
@media (prefers-contrast: more) {
  :root { --muted: var(--text); --border: CanvasText; }
}

/* Windows High Contrast and similar: backgrounds are overridden, so borders carry structure */
@media (forced-colors: active) {
  .btn { border: 2px solid ButtonText; }
}

/* Translucent layers get a solid fallback */
@media (prefers-reduced-transparency: reduce) {
  .glass { background-color: Canvas; backdrop-filter: none; }
}
```

Text over a blurred translucent layer changes contrast with whatever scrolls beneath it. Keep the layer opaque enough that the text passes `contrast-floor` over both the lightest and darkest content that can pass under it.

## theme-focus

**Grade:** standard (SC 2.4.7, level AA). **Severity:** error when no replacement exists.

Never remove the focus outline without a visible replacement. Use `outline`, not `box-shadow`: outlines survive forced colors and box shadows do not.

```css
/* Incorrect */
button:focus { outline: none; }

/* Correct */
:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
```

The ring itself needs 3:1 against the surface behind it. Do not rely on the system `Highlight` color for that: in Chrome on Linux it is a translucent blue that measured about 1.9:1 on a dark background. Use the accent token, or `currentColor` when there is no token, and measure it in both themes.

In Tailwind v4, `outline-hidden` keeps an outline in forced colors mode and `outline-none` removes it entirely. Prefer `focus-visible:outline-2 focus-visible:outline-offset-2`.

Sources: [WCAG 2.2](https://www.w3.org/TR/WCAG22/)

## Browser support

Checked on 13 November 2026 against the web-features dataset (3.46.0) and MDN browser-compat-data (8.1.9). Current stable browsers on that date: Chrome 157, Firefox 160, Safari 27.2.

| Status | Features | How to use |
|---|---|---|
| In every browser for 30 months or more | `prefers-color-scheme`, `prefers-reduced-motion`, `prefers-contrast`, `forced-colors`, `color-scheme`, `oklch()`, `color-mix()`, `:focus-visible`, `clamp()`, `hyphens`, `@font-face size-adjust` | Use directly |
| In every current browser, newer | `light-dark()` (May 2024), `text-wrap: balance` (May 2024), relative color syntax and `backdrop-filter` unprefixed (September 2024), `scrollbar-gutter` (December 2024), `content-visibility` (September 2025), same-document view transitions (October 2025), `contrast-color()` (April 2026), scroll-driven animations (October 2026) | Fine for most audiences. Add a fallback or `@supports` if old browsers matter |
| Not in every browser | `text-wrap: pretty` (no Firefox), `dynamic-range-limit` (no Firefox), `prefers-reduced-transparency` (Chrome and Edge only), `ascent-override` and related descriptors (no Safari release), cross-document view transitions (no Firefox), `accent-color` | Enhancement only. The page must work without it |

`contrast-color()` returns only black or white, which works against the comfort goals for body text. Use it for small badges at most.

Support changes every few weeks. If this date is more than a few months old, check the feature on MDN or caniuse before relying on the bottom two rows.

Sources: [web-features data](https://unpkg.com/web-features/data.json), [MDN browser-compat-data](https://unpkg.com/@mdn/browser-compat-data/data.json)

## Tailwind v4, shadcn/ui and next-themes

**Tailwind v4.** Define the comfort tokens in `@theme` so utilities are generated from them, and point the `dark` variant at your attribute.

```css
@import "tailwindcss";
@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *));

@theme {
  --color-background: light-dark(oklch(0.985 0.002 90), oklch(0.18 0.01 255));
  --color-foreground: light-dark(oklch(0.24 0.01 255),  oklch(0.93 0.005 255));
  --color-muted-foreground: light-dark(oklch(0.48 0.01 255), oklch(0.78 0.01 255));
}
```

Then write `bg-background text-foreground` and avoid `bg-white`, `text-black`, `font-light`, `text-xs` for reading text, `leading-none` and `leading-tight` for body text.

**shadcn/ui.** The stock theme pairs pure white with near-black at about 19.8:1 in light and about 19:1 in dark. Override `--background`, `--foreground` and `--muted-foreground` in the project's global CSS with the values above.

**next-themes.** It injects the blocking script for you. Two things to know: it sets `color-scheme` only for themes literally named `light` and `dark`, so a `dim` or `sepia` theme needs its own `color-scheme` rule in CSS, and it has had no release since March 2025.

```jsx
<ThemeProvider attribute="data-theme" defaultTheme="system" enableSystem themes={["light", "dark", "dim"]}>
  {children}
</ThemeProvider>
```

The snippets in this section were compiled or checked against Tailwind CSS 4.3.5, Next.js 16.4.6, React 19.3.1, Motion 14.13.0 and next-themes 0.4.6, the current releases on 13 November 2026. Class names and config change between major versions, so check the project's installed version first.

Sources: [Tailwind theme](https://tailwindcss.com/docs/theme), [shadcn/ui theming](https://ui.shadcn.com/docs/theming), [next-themes](https://github.com/pacocoursey/next-themes)
