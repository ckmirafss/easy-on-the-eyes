# Evidence

What the research supports, what is habit, and what is myth. Read this when someone asks why, challenges a rule, or wants to make a claim in their copy.

## What a website can and cannot do

Digital eye strain is a cluster of symptoms: dry or burning eyes, blur and slow refocusing, and neck and shoulder pain. The two main causes are outside a website's reach.

- **Blinking.** People blink less completely at a screen, and concentration lowers blink rate further. The tear film dries.
- **Focus demand.** Near work for long periods, small text, and uncorrected or under-corrected vision.

| Who controls it | Factors |
|---|---|
| The designer | Text size, contrast and polarity, how much of the viewport is near-white, flashing and stripe patterns, motion and autoplay, density and line length, whether the page honors system settings |
| Shared | Session length and breaks, glare from the page in a dark room |
| The reader and their setup | Viewing distance, blinking, room lighting, display hardware and brightness, eyesight and glasses, total screen time |

No study has measured how much of the problem comes from on-screen content. So a site cannot say how much it helps, and the only defensible claim is that it does not add avoidable strain.

Source: [TFOS Lifestyle report, 2023](https://openaccess.city.ac.uk/31838/1/1-s2.0-S1542012423000307-main.pdf)

## The ledger

| Well supported | Convention: reasonable, unproven | Myth, or unsupported as stated |
|---|---|---|
| Text near the acuity limit slows reading and raises symptoms | Off-white backgrounds and near-black text | Blue light from screens causes eye strain or damage |
| Dark text on light is more legible, most of all at small sizes | Dark gray such as `#121212` instead of true black | Dark mode reduces eye strain |
| Blue-light filtering does not relieve eye strain | 45 to 75 characters per line | Dark mode prevents myopia |
| Flashing above three per second is a seizure hazard | Line height of exactly 1.5 | Pure black on white causes eye strain |
| High-contrast stripes near 3 cycles per degree cause discomfort | Animation durations of 100 to 500 ms | WCAG requires a line height of 1.5 |
| Small uncorrected astigmatism multiplies symptoms | Specific chroma values for dark-theme accents | Sans-serif is more readable on screens |
| The fastest font differs for each reader | Lower font weight or grade in dark mode | Dyslexia fonts improve reading |
| Layout movement makes readers lose their place | The exact 20-20-20 numbers | Whitespace improves comprehension by 20% |
| Large-area and parallax motion trigger symptoms in sensitive people | Halation of white text on black in astigmatism | APCA is the WCAG 3 contrast method |

## Answers to common questions

**Does blue light from screens hurt the eyes?** No evidence says so. A 2023 Cochrane review of 17 randomized trials found blue-light filtering lenses probably make little or no difference to eye strain. Screen filters that block blue did no better than a neutral filter of the same darkness, which means the benefit comes from less light, not a different color. A warm palette is a taste decision. Never sell it as eye protection.
Sources: [Cochrane summary](https://www.eurekalert.org/news-releases/998545), [American Academy of Ophthalmology](https://www.aao.org/eye-health/tips-prevention/should-you-be-worried-about-blue-light)

**Is dark mode easier on the eyes?** Not as a general rule. Dark text on light is more legible for typical vision. Studies find no reliable fatigue difference between the modes. Dark mode does help specific people (light sensitivity, some low-vision conditions) and specific situations (a dark room). The right answer is to ship both and follow the reader's setting.
Sources: [Piepenbrock et al. 2014](https://doi.org/10.1177/0018720813515509), [Buchner & Baumgartner 2007](https://doi.org/10.1080/00140130701306413), [Sengsoon & Intaruk 2025](https://doi.org/10.3390/ijerph22040609)

**Does dark mode prevent myopia?** The claim rests on one study of seven people that measured a small change in a layer of the eye after an hour of reading. Nobody has shown an effect on actual myopia.
Source: [Aleman, Wang & Schaeffel 2018](https://doi.org/10.1038/s41598-018-28904-x)

**Is white text on black bad for astigmatism?** Probably, but nobody has tested it directly. The optics make sense: dark screens widen the pupil, which increases blur, and about 40% of adults have some astigmatism. No published study compares light-on-dark reading in people with and without it. Say "plausible, untested".
Sources: [Piepenbrock, Mayr & Buchner 2014](https://doi.org/10.1080/00140139.2014.948496), [Hashemi et al. 2018](https://pubmed.ncbi.nlm.nih.gov/29564404/)

**Should we use a dyslexia font?** Not as a default. Controlled studies find no benefit from the letterforms once spacing is matched. Offer spacing and size controls instead, and never block the reader's own font settings.
Sources: [Wery & Diliberto 2017](https://link.springer.com/article/10.1007/s11881-016-0127-1), [Galliussi et al. 2020](https://link.springer.com/10.1007/s11881-020-00194-x)

**Should we add a 20-20-20 break reminder?** Only as an optional rest prompt on surfaces where people stay for hours. In the best test, enforced breaks lowered symptom scores modestly and the benefit faded within a week of stopping. A site sees only its own tab, so its timer is wrong for anyone arriving from other screen work. Natural pause points help more: chapter ends, no infinite scroll, no autoplay to the next item.
Source: [Talens-Estarelles et al.](https://publications.aston.ac.uk/id/eprint/44152/1/1_s2.0_S1367048422001990_main.pdf)

**Should we use APCA instead of WCAG contrast?** Use both, with WCAG as the pass or fail gate. WCAG 2 is what the law references. APCA is a useful second opinion on dark themes, where the WCAG formula overstates contrast. APCA was removed from the WCAG 3 draft in 2023, the draft says its contrast method is undecided, and APCA's reference code carries a restrictive license.
Sources: [WCAG 3.0 Working Draft](https://www.w3.org/TR/wcag-3.0/), [Adrian Roselli](https://adrianroselli.com/2026/04/wcag3-contrast-as-of-april-2026.html)

**Can display flicker be fixed in CSS?** No. Many OLED screens dim by switching on and off quickly, which is hardware. The one indirect link is that this flicker is strongest at low brightness, which is where people end up when they dim the screen to cope with a bright page at night. A good dark scheme reduces the need.

## Who is more sensitive

- **Astigmatism.** Adding a small amount in a lab raised symptom scores from 2 to 6.5, and a larger amount raised them to 40, with no change in reading speed. Speed and conversion metrics cannot see discomfort.
- **Migraine.** More than 80% of people with migraine are light sensitive during attacks and have lower light tolerance between them. They are also more sensitive to stripes and flicker.
- **Older readers and low vision.** They need more size and more contrast in reserve.

These groups pull in opposite directions. Some need darker, lower-brightness surfaces. Others need larger, high-contrast dark text on light. That is why the skill favors adaptability over one "eye-friendly" theme.

Sources: [Rosenfield et al. 2012](https://researchconnect.suny.edu/en/publications/the-effects-of-induced-oblique-astigmatism-on-symptoms-and-readin/), [Villar-Martinez & Goadsby 2022](https://touchneurology.com/headache-disorders/journal-articles/dim-the-lights-a-narrative-review-of-photophobia-in-migraine/)

## Open questions

Label these as open when they come up.

- No trial has compared off-white with white pages on symptoms.
- No study has tested halation in readers with astigmatism.
- No work separates how much strain comes from content and how much from the reader's setup.
- No study links clutter, layout shift or target size to eye strain directly. The measured outcomes are search time, workload and preference.

## Copy rules

Do not write:

- "Reduces eye strain", "prevents eye fatigue", "protects your eyes"
- "Blue-light safe", "eye-safe colors"
- "Dark mode is better for your eyes"
- "Clinically proven", "scientifically optimized"

Write instead:

- "Designed for long reading sessions"
- "Follows your system's light or dark setting"
- "Readable text sizes and calm motion by default"
- "Does not add avoidable visual strain"
