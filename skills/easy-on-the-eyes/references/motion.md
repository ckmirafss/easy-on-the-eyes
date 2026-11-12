# Motion

Rules for animation, transitions, video, scroll effects and loaders. Grades are explained in `SKILL.md`.

## Contents

- `motion-flash`
- `motion-autoplay`
- `motion-reduced`
- `motion-triggers`
- `motion-duration`
- Framework notes

## motion-flash

**Grade:** standard (WCAG 2.2 SC 2.3.1, level A). **Severity:** error.

Nothing may flash more than three times in any one second. This is the only hard numeric limit in the field, and it exists because of seizures. Photosensitive epilepsy affects about 1 in 4,000 people, with 15 to 20 flashes per second the most dangerous range and red flashes worse than other colors.

Below seizure level the cost is attention. Flashing banners beside content raised measured workload and made nearby targets take about 75% longer to find.

```css
/* Incorrect: 5 flashes per second */
.alert { animation: blink 200ms steps(2) infinite; }

/* Correct: draw attention once, with a fade */
@media (prefers-reduced-motion: no-preference) {
  .alert { animation: fade-in 300ms ease-out 1; }
}
```

The script cannot measure flash rate. Check any animation that toggles opacity, visibility or a strong color change, and any embedded video.

Sources: [Understanding SC 2.3.1](https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html), [Fisher et al. 2022](https://repository.essex.ac.uk/34275/1/Epilepsia%20-%202022%20-%20Fisher%20-%20Visually%20sensitive%20seizures%20An%20updated%20review%20by%20the%20Epilepsy%20Foundation.pdf), [Burke et al.](https://thoughtcrumbs.com/publications/ToCHI04.pdf)

## motion-autoplay

**Grade:** standard (SC 2.2.2, level A). **Severity:** error.

Anything that starts moving on its own, lasts more than five seconds and sits beside other content needs a way to pause, stop or hide it. That covers background video, carousels, animated illustrations, tickers and animated GIFs.

```html
<!-- Incorrect -->
<video autoplay loop muted src="hero.mp4"></video>

<!-- Correct -->
<video muted loop playsinline controls src="hero.mp4"></video>
```

If a background video is essential to the design, give it a visible pause button and do not start it when the reader prefers reduced motion:

```js
const video = document.querySelector("video[data-ambient]");
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
if (!reduce.matches) video.play();
```

A looping animation next to text keeps pulling the eye off the text. Limit loops to a few iterations. A spinner that leaves the page when loading ends is fine.

Sources: [Understanding SC 2.2.2](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html)

## motion-reduced

**Grade:** standard (SC 2.3.3, level AAA) plus expert consensus. **Severity:** error when nothing in the project handles it.

Write motion so that it exists only when the reader has not asked to reduce it. `prefers-reduced-motion` has worked in every major browser since January 2020.

```css
/* Incorrect: motion for everyone, removed later if you remember */
.card { transition: transform 300ms; }
.card:hover { transform: translateY(-4px) scale(1.02); }

/* Correct: no motion first */
@media (prefers-reduced-motion: no-preference) {
  .card { transition: transform 200ms ease-out; }
  .card:hover { transform: translateY(-2px); }
}
```

Three points that get missed:

1. Remove the travel and keep the feedback. The state should still change, either instantly or with a fade or color change. Do not strip the hover or open state itself.
2. Cover JavaScript animation, autoplay video and animated images, not only CSS.
3. The setting is opt-in and many people who need it never find it. The default experience has to be calm on its own merits.

Add this safety net for third-party CSS that ignores the preference:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

Sources: [MDN prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion), [web.dev prefers-reduced-motion](https://web.dev/articles/prefers-reduced-motion), [Tatiana Mac, no-motion-first](https://www.tatianamac.com/posts/prefers-reduced-motion)

## motion-triggers

**Grade:** research. The evidence is expert and patient consensus plus one small controlled study, not a dose-response trial. **Severity:** warning.

Avoid the kinds of motion that people with vestibular disorders and migraine report as triggers:

- Parallax and anything that moves layers at different speeds
- Scroll hijacking, where the page moves differently from the reader's scroll input
- Large-area zooming, scaling or spinning
- Simulated depth and 3D flythroughs
- Constant movement beside text

The size of the moving area relative to the screen matters most. Changes in opacity, color and blur are unlikely to cause problems.

In a study of 86 people, a parallax site was rated more fun but no more usable, and two people in the parallax group reported motion sickness. NN/g found most participants at least mildly disoriented by scroll hijacking. Vestibular dysfunction shows up on balance testing in about a third of US adults over 40, and migraine affects about one person in seven.

```css
/* Incorrect */
.hero { background-attachment: fixed; }

/* Correct */
.hero { background-attachment: scroll; }
```

Scroll-driven animations (`animation-timeline`) work in all major browsers as of late 2026, which makes scroll-linked effects cheap to build. Guard them the same way:

```css
@media (prefers-reduced-motion: no-preference) {
  @supports (animation-timeline: view()) {
    .reveal { animation: fade-in linear both; animation-timeline: view(); animation-range: entry 0% entry 40%; }
  }
}
```

Keep that example to opacity. Do not use it to slide or scale large sections.

Sources: [WebKit, Responsive Design for Motion](https://webkit.org/blog/7551/responsive-design-for-motion/), [Val Head, A List Apart](https://alistapart.com/article/designing-safer-web-animation-for-motion-sensitivity/), [Frederick et al. 2015](https://uxpajournal.org/wp-content/uploads/sites/7/pdf/JUS_Frederick_Feb2015.pdf), [NN/g scrolljacking](https://www.nngroup.com/articles/scrolljacking-101/)

## motion-duration

**Grade:** convention. **Severity:** note.

| Use | Duration |
|---|---|
| State feedback (hover, press, toggle) | about 100 ms |
| Typical transitions (menus, modals) | 200 to 300 ms |
| Ceiling for anything in the interface | 500 ms |

Use ease-out for things entering and ease-in for things leaving. These numbers come from design systems that agree with each other. They are not measured comfort thresholds.

Sources: [NN/g animation duration](https://www.nngroup.com/articles/animation-duration/), [IBM Carbon motion](https://carbondesignsystem.com/elements/motion/overview/)

## Framework notes

**Tailwind.** Prefix motion utilities with `motion-safe:`, or cancel them with `motion-reduce:`.

```html
<div class="motion-safe:transition-transform motion-safe:hover:-translate-y-0.5"></div>
<svg class="animate-spin motion-reduce:animate-none"></svg>
```

**Motion (formerly Framer Motion).** Wrap the app once so transform and layout animations are skipped for readers who prefer reduced motion, while opacity still animates.

```jsx
import { MotionConfig } from "motion/react";

export function Providers({ children }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
```

**GSAP.** Put animations inside `gsap.matchMedia()` with a `(prefers-reduced-motion: no-preference)` condition.

**Smooth-scroll libraries.** Libraries that replace native scrolling change how the page moves under the reader's hand. If the project uses one, disable it under reduced motion, and question whether it is needed at all.
