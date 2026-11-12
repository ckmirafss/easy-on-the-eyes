# Craft

How to keep a comfortable page from looking generic. Read this when designing a new page or section, when the user says the result looks templated or "AI-made", or when a design reference tool is available.

Every rule in this file is graded `convention`. It comes from looking at shipped products, not from studies. Say so when you cite one. When a craft rule and a comfort rule disagree, the comfort rule wins.

## Contents

- `craft-reference`
- `craft-one-idea`
- `craft-palette`
- `craft-show-product`
- `craft-layout`
- `craft-copy`
- `craft-restraint`
- Take the craft, leave the strain
- The generic checklist

## craft-reference

**Severity:** note. Do this before designing, not after.

Look at real products before you draw one. Models produce the average of everything they have seen, and the average is what people recognize as generated. A reference gives you specific decisions to react to.

1. Find three to five shipped products in the same category as the thing you are building. A settings page for a finance tool is compared with other finance tools, not with landing pages.
2. Use whatever reference source is connected to the session: a UI pattern library, a gallery of awarded sites, a screenshot or page-capture tool. If none is connected, use web search and open the real pages. If you cannot look at anything, say so and continue from the rules below.
3. For each reference, write one line on each of these: layout and alignment, type scale and weights, how many colors and what the accent is used for, density, and the one thing that makes it recognizable.
4. Decide what to borrow. Borrow structure and decisions: a column width, a way of grouping, how status is shown. Never copy a brand's name, logo, colors, wording, illustrations or exact layout.
5. Tell the user which references you looked at and what you took from each.

What reviewed products have in common, so you know what to look for:

- Reading pages are one quiet column with underlined links and no cards around the text.
- Dashboards use neutral surfaces, hairlines between rows, and a single accent that appears only on the primary action and the active item.
- Marketing pages each have one memorable move: a custom illustration, a real screenshot of the product, or a typographic decision. The rest of the page is plain.

## craft-one-idea

**Severity:** note.

Give each view one distinctive idea and keep everything else quiet. Pick from: a typographic move (an unusual face, a very large or very condensed headline), the real product shown large, a custom illustration or photo, or an unexpected layout. Two ideas compete. Zero ideas is a template.

This is the same instruction as `pattern-clutter` seen from the other side: one primary emphasis per view.

## craft-palette

**Severity:** note.

Choose a palette on purpose.

- Tint the neutrals toward one hue instead of using pure gray. The tokens in `assets/tokens.css` lean slightly cool. Change the hue for the brand, and keep the lightness values so the contrast figures hold.
- Use one accent, and spend it only on actions and the current item.
- Do not reach for the indigo-to-purple or purple-to-pink gradient. It is the most recognizable generated look there is.
- Do not use gradient text. It reads as a template, and its contrast cannot be measured because it changes along the word.

```css
/* Incorrect */
.title { background: linear-gradient(90deg, #6366f1, #ec4899); -webkit-background-clip: text; color: transparent; }

/* Correct: one ink color, emphasis from size and weight */
.title { color: var(--text); font-size: var(--text-2xl); font-weight: 680; letter-spacing: -0.015em; }
```

Check any new palette with the `contrast` command. A color that looks right can still fail `contrast-floor`.

## craft-show-product

**Severity:** note.

Show the real thing. A feature section that shows the actual interface, a real table of data, a working code sample or a photograph is more convincing than an icon over a title over two lines of praise.

Avoid the row of three identical cards, each with an icon, a short title and a sentence. If the content is a list of features, consider a plain list, numbered steps, or a list beside one large example that changes as the reader moves through it.

Do not use emoji as icons. Use one icon set at one stroke weight, or no icons.

## craft-layout

**Severity:** note.

- Do not center everything. Left-aligned headlines with supporting content beside them are common in shipped work and are easier to read. Centering suits short headlines only.
- Put everything on one grid and let some elements span more columns than others. Uneven splits such as 5 and 7 columns read as designed. Equal thirds read as a template.
- Vary section structure. If every section is a centered heading, a subheading and a grid of cards, the page has one layout repeated.
- Use spacing to group. Related things sit close and unrelated things sit far apart. The same gap everywhere removes the hierarchy.

## craft-copy

**Severity:** warning for invented facts, note otherwise.

- Write specific copy. "Send invoices in two clicks" says something. "Supercharge your workflow" does not.
- Never invent statistics, customer counts, testimonials, ratings, awards or client logos. If you do not have a real figure, leave the element out or mark it as a placeholder the user must fill. This is an honesty rule, not a taste rule.
- Skip filler words such as "seamless", "effortless", "powerful", "next-generation" and "revolutionary".
- Use sentence case for headings and buttons. Name a button for what it does: "Download report", not "Submit".
- Use real, plausible content in mockups: real-looking names, dates and amounts. Lorem ipsum hides layout problems.

## craft-restraint

**Severity:** note.

Pick a small set of surface effects and stay inside it.

- Flat surfaces with hairlines do most of the work in shipped products. Shadows are rare and soft.
- Choose one corner radius scale. Large rounding on every box, with a shadow on each, is a recognizable default look.
- Avoid stacked effects: blur behind a card, a glow around it, a gradient border and a floating colored blob behind that.
- A translucent blurred panel is also a comfort problem. See `theme-preferences`.

## Take the craft, leave the strain

Award-winning sites are good references for composition, type and art direction. Many of them also break comfort rules. Take the first and leave the second.

| Worth borrowing | Leave behind | Rule it breaks |
|---|---|---|
| Confident, oversized headlines | Tiny, thin body text beside them | `type-body-size`, `type-weight` |
| A strong, specific color palette | Low-contrast gray text on dark or on color | `contrast-floor`, `contrast-dark-secondary` |
| A sense of movement and pacing | Scroll hijacking, parallax, large-area zoom | `motion-triggers` |
| Entrance animation that draws attention once | Looping, replaying or scroll-reversing animation | `motion-autoplay`, `motion-reduced` |
| Full-bleed photography and video | Autoplay video with no controls, bright media in dark themes | `motion-autoplay`, `lum-section-steps` |
| Dramatic dark and light sections | Hard black-to-white jumps between sections | `lum-section-steps` |
| Texture and pattern | High-contrast fine stripes and grids | `pattern-stripes` |
| Custom cursors and hover play | Effects that follow the pointer across the page | `motion-triggers` |

A composition that only works with motion is not finished. Design the static version first, then add movement inside the reduced-motion guard.

## The generic checklist

Run through this before you call a design done. Each item is a common sign of generated work. Fixing one usually means making a specific choice in its place.

- Indigo, purple or pink gradients on backgrounds, buttons or text
- Gradient text
- Translucent blurred cards over colored blobs
- Three identical feature cards with an icon, a title and a sentence
- Emoji used as icons
- Every section centered, with the same structure
- The same large corner radius and shadow on every box
- A headline that could describe any product
- Invented numbers, testimonials or logos
- A badge above the headline that says something is new
- One font at two weights with no clear scale
- Equal spacing between everything

The script reports gradient text and stock purple gradients as `craft-palette` notes. The rest need your eye.
