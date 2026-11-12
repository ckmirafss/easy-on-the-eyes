# Easy on the Eyes

[![skills.sh](https://skills.sh/b/ckmirafss/easy-on-the-eyes)](https://skills.sh/ckmirafss/easy-on-the-eyes)

Easy on the Eyes is a free, open-source agent skill that makes websites comfortable to look at for hours and keeps them from looking AI-generated. It works with Claude Code, Codex, Cursor, Gemini CLI and any agent that reads the Agent Skills format.

```bash
npx skills add ckmirafss/easy-on-the-eyes
```

![The same report page before and after: thin 13px white text on pure black with a striped table, next to readable off-white text on dark gray](docs/demo-report.png)

## What it does

Design skills make an interface look good, and accessibility audits check the legal minimum. This one checks whether the page is tiring to read, and whether it looks like every other generated page.

It gives your coding agent three things:

1. 32 rules, each graded by evidence. They cover text size, contrast, light and dark themes, motion, stripe patterns, layout stability and craft. Each rule is marked `research`, `standard`, `convention` or `inference`, so you can tell a measured effect from a design habit.
2. A static audit. `audit.mjs` reads your source and catches what linters miss: pure black on pure white, tiny body text, animation with no reduced-motion handling, disabled zoom, autoplay video, gradient text.
3. A browser inspector. `inspect.mjs` opens any URL or local page in a real browser and reports its fonts, type scale, palette, line length, layout and motion, plus a comfort check on what actually rendered. Point it at your own page to verify it, or at sites you admire to study them before you design.

## Use it

Once installed, the skill applies itself when you build or style UI. You can also call it directly.

| Command | What happens |
|---|---|
| `/easy-on-the-eyes` | Studies references, then applies the rules to the UI you are working on |
| `/easy-on-the-eyes audit` | Reports problems by severity and changes nothing |
| `/easy-on-the-eyes fix` | Fixes errors first, then warnings, and reports what changed |
| `/easy-on-the-eyes study <url>` | Reports a site's design brief and which comfort rules it breaks |

Both scripts also run on their own. They need Node 18 or later. The inspector also needs Playwright.

```bash
node skills/easy-on-the-eyes/scripts/audit.mjs ./src
node skills/easy-on-the-eyes/scripts/audit.mjs contrast "#a0a0a0" "#121212"
node skills/easy-on-the-eyes/scripts/audit.mjs contrast "#8a8f98" "#ffffff" --min 3
node skills/easy-on-the-eyes/scripts/inspect.mjs https://example.com --out shots
```

```
Easy on the Eyes inspect: https://example.com

Design brief
  Fonts:        Mona Sans VF 79%, ui-monospace 20%
  Body text:    16px, weight 400, line height 1.5
  Type scale:   32px, 24px, 20px, 16px, 14px, 12px
  Line length:  about 123 characters (longest 147, 12 paragraphs)
  Background:   #ffffff, dark scheme #0d1117
  Accents:      #0969da (17 uses)
  Text pairs:
    #1f2328 on #ffffff  15.79:1  64%
    #59636e on #ffffff  6.11:1  10%

Rendered comfort check: 0 errors, 2 warnings, 1 notes
  warning type-measure  [convention]
    Paragraph lines run about 123 characters (longest about 147).
    Fix: Cap reading text near 55ch.
```

## How it compares

| | Design and taste skills | WCAG audit skills | Easy on the Eyes |
|---|---|---|---|
| Main question | Does it look good? | Does it meet the standard? | Is it tiring to read, and does it look generated? |
| Contrast | Rarely covered | Minimum of 4.5:1 | Minimum, plus dark-theme and harshness checks |
| Motion | Encouraged | Reduced-motion compliance | Trigger list, autoplay, endless loops |
| Evidence grade on each rule | No | No | Yes |
| Measures the rendered page | No | Some do | Yes, including line length and real contrast |
| Studies reference sites | Some do | No | Yes, with a comfort check on each reference |

It works alongside a WCAG audit and does not replace one.

## What the research says

Most eye strain at a screen comes from things a website cannot touch: how often you blink, how close the screen is, whether your glasses are right, how the room is lit. A website controls one thing, which is how much extra visual work it asks for.

So this skill does not promise to prevent eye strain, and it stops your agent from writing copy that does. The honest claim is that the design does not add avoidable strain.

Some of the findings go against common advice:

- Text size matters more than anything else on the list. Reading speed drops sharply below an x-height of about 0.2 degrees of visual angle, and 16px text on a laptop sits right at that edge ([Legge & Bigelow, 2011](https://jov.arvojournals.org/article.aspx?articleid=2191906)). Treat 16px as the minimum.
- Blue-light filtering makes little or no difference to eye strain, according to a 2023 Cochrane review of 17 randomized trials ([summary](https://www.eurekalert.org/news-releases/998545)). What matters is how bright the screen is.
- Dark mode is not easier on the eyes. Dark text on light is more legible for most people ([Piepenbrock et al., 2014](https://doi.org/10.1177/0018720813515509)), and studies find no fatigue difference between the two. Some people need one and some need the other, so ship both.
- There is no best font. In a study of 352 readers, people read 35% faster in their fastest font than their slowest, and it was rarely the font they preferred ([Wallace et al., 2022](https://jeffhuang.com/papers/Readability_TOCHI22.pdf)).
- No study shows that pure black on pure white causes strain. The skill still recommends softer values, and it labels that rule as convention.
- Gray text that passes the 4.5:1 contrast check can still read weak on a dark background.

The full ledger of what is supported, what is habit and what is myth is in [`references/evidence.md`](skills/easy-on-the-eyes/references/evidence.md), with links to every source.

## Before and after

Each pair is the same content. The left side breaks rules the skill checks, and the right side is what it steers toward. The figures are WCAG contrast ratios measured with the skill's own script.

**Long-form article.** 12px justified text running the full width, a 2.32:1 byline and a red-on-yellow callout, against 19px text at about 70 characters per line.

![An article about steeping green tea, before and after](docs/demo-article.png)

**Data table.** Black grid lines on heavy zebra rows, with status shown by color alone (the green is 1.21:1 on its gray row and the yellow is 1.07:1 on white), against hairlines and status labels that pair a shape with text.

![An orders table, before and after](docs/demo-table.png)

**Form in dark mode.** Field borders at 1.46:1, an error that only says "invalid" in pure red, and no visible focus, against 3.87:1 borders, a clear error message and an 8.14:1 focus ring.

![An account settings form in dark mode, before and after](docs/demo-form.png)

## Questions

### What is the Easy on the Eyes skill?

It is a set of instructions, reference files and two scripts that a coding agent loads when it builds or reviews a web interface. It applies visual-comfort rules, audits source code and rendered pages, and studies real sites for design reference. It is MIT licensed and free.

### Does dark mode reduce eye strain?

Not as a general rule. Dark text on a light background is more legible for people with typical vision, and controlled studies find no reliable difference in fatigue between the two modes. Dark mode does help some people with light sensitivity and anyone in a dark room, so the skill ships both and follows the system setting.

### Does blue light from screens cause eye strain?

The evidence says no. A 2023 Cochrane review of 17 randomized trials found that blue-light filtering lenses probably make little or no difference to eye strain. Screen filters that block blue did no better than a neutral filter of the same darkness, which points to brightness as the factor that matters.

### What font size is best for reading on a screen?

Use at least 16px for body text, and 18 to 20px for long reading on laptops and desktops. Reading speed falls off sharply once text gets close to the limit of what the eye can resolve, and 16px sits near that limit at a normal viewing distance. Set sizes in `rem` so readers can scale them.

### What contrast ratio should text have?

WCAG requires at least 4.5:1 for body text and 3:1 for large text and interface parts. On dark backgrounds that minimum is not enough: aim for 8.5:1 or more for secondary text and 12:1 to 16:1 for body text. The skill's `contrast` command measures any pair.

### How do I stop an AI-built website from looking generic?

Look at real sites first. The skill's inspector reads the fonts, type scale, palette and layout from any live page, so the agent starts from specific decisions and not from an average. The craft rules then remove the usual tells: purple gradients, gradient text, three identical feature cards, centered everything and invented statistics.

### Which AI coding agents does it work with?

Any agent that reads the [Agent Skills](https://agentskills.io) format, including Claude Code, Codex, Cursor, Gemini CLI and GitHub Copilot. Install it with `npx skills add ckmirafss/easy-on-the-eyes`. It uses only the standard frontmatter fields and makes no network calls of its own.

### Does it replace an accessibility audit?

No. It overlaps with WCAG on contrast, zoom, motion and focus, but it does not cover screen readers, keyboard order, forms, labels or most of the standard. Run a WCAG audit as well.

## What is inside

```
skills/easy-on-the-eyes/
  SKILL.md                         rules, modes and the report format
  references/
    contrast-and-color.md          contrast floors, dark themes, accents
    typography.md                  size, line length, spacing, fonts
    motion.md                      flashing, autoplay, reduced motion
    layout-and-patterns.md         stripes, tables, density, layout shift
    theming.md                     light and dark, toggles, Tailwind and shadcn/ui
    craft.md                       studying references, avoiding the generated look
    evidence.md                    supported, convention, myth
  scripts/audit.mjs                static audit and contrast checker
  scripts/inspect.mjs              browser inspector: design brief and rendered comfort check
  assets/tokens.css                starter tokens for light, dark and dim themes
```

Claude Code users can also install it as a plugin:

```
/plugin marketplace add ckmirafss/easy-on-the-eyes
/plugin install easy-on-the-eyes@easy-on-the-eyes
```

## Limits

- `audit.mjs` reads source files with pattern matching. It misses sizes set in `em` or the `font` shorthand. Every report ends with a list of what it could not verify.
- `inspect.mjs` sees one page at one width, in its resting state. It does not check hover and focus states, flash rate, or pages behind a sign-in.
- The contrast checker uses the WCAG 2 formula. For a second opinion on dark themes, use the APCA readout in Chrome DevTools. APCA code is not bundled because of its license.
- The defaults are tuned for Latin scripts.
- The craft rules are taste. They are graded `convention` and never outrank a comfort rule.
- Pixel figures for stripe patterns come from geometry, not from tests on web pages. The skill labels them as inference.

## Development

```bash
node tests/run.mjs
```

The tests run the audit against a deliberately bad page, a clean page full of near misses and a page that tries to fool the project-level checks. They check the contrast maths against known values, validate the skill's frontmatter, and run the inspector when Playwright is installed.

If a rule is wrong or I missed a study, open an issue with the source and I will update it.

## License

MIT. Built by [Blackbyrds Digital](https://blackbyrds.digital). Last updated November 2026.
