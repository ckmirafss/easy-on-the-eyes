#!/usr/bin/env node
// Easy on the Eyes: look at a rendered page. Works on any URL or local HTML file.
// easy-on-the-eyes-ignore-file
//
//   node inspect.mjs <url-or-file> [--out <dir>] [--json] [--width 1440]
//
// It opens the page in a real browser and reports two things:
//   1. A design brief: fonts, type scale, palette, layout, surface effects and motion.
//      Use it to study a reference before designing.
//   2. A rendered comfort check under the same rule IDs as audit.mjs: real contrast of real
//      text, real line length, dark scheme support and reduced-motion behavior.
//      Use it on your own page to cover what the static audit cannot see.
//
// Needs Playwright (npm i -D playwright && npx playwright install chromium).
// Exit codes: 0 no errors, 1 comfort errors found, 2 usage or setup problem.

import { createRequire } from "node:module";
import { existsSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const VERSION = "1.1.0";

// ---------- color maths (same as audit.mjs) ----------
const toLinear = (v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
const toEncoded = (v) => (v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055);
const clamp01 = (v) => Math.min(1, Math.max(0, v));

function parseColor(input) {
  const s = String(input).trim().toLowerCase();
  let m = s.match(/^rgba?\(([^)]+)\)$/);
  if (m) {
    const p = m[1].split(/[\s,/]+/).filter(Boolean);
    const rgb = p.slice(0, 3).map((x) => clamp01(parseFloat(x) / 255));
    const alpha = p[3] === undefined ? 1 : p[3].endsWith("%") ? parseFloat(p[3]) / 100 : parseFloat(p[3]);
    return rgb.some(Number.isNaN) ? null : { rgb, alpha };
  }
  m = s.match(/^color\(srgb\s+([^)]+)\)$/);
  if (m) {
    const p = m[1].split(/[\s/]+/).filter(Boolean);
    return { rgb: p.slice(0, 3).map((x) => clamp01(parseFloat(x))), alpha: p[3] === undefined ? 1 : parseFloat(p[3]) };
  }
  m = s.match(/^oklch\(([^)]+)\)$/);
  if (m) {
    const p = m[1].split(/[\s/]+/).filter(Boolean);
    const L = p[0].endsWith("%") ? parseFloat(p[0]) / 100 : parseFloat(p[0]);
    const C = p[1].endsWith("%") ? (parseFloat(p[1]) / 100) * 0.4 : parseFloat(p[1]);
    const h = (parseFloat(p[2]) || 0) * (Math.PI / 180);
    const a = C * Math.cos(h), b = C * Math.sin(h);
    const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
    const mm = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
    const ss = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
    const lin = [
      4.0767416621 * l - 3.3077115913 * mm + 0.2309699292 * ss,
      -1.2684380046 * l + 2.6097574011 * mm - 0.3413193965 * ss,
      -0.0041960863 * l - 0.7034186147 * mm + 1.707614701 * ss,
    ];
    const alpha = p[3] === undefined ? 1 : p[3].endsWith("%") ? parseFloat(p[3]) / 100 : parseFloat(p[3]);
    return { rgb: lin.map((v) => toEncoded(clamp01(v))), alpha };
  }
  return null;
}
const luminance = (rgb) => { const [r, g, b] = rgb.map(toLinear); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const toHex = (rgb) => "#" + rgb.map((v) => Math.round(clamp01(v) * 255).toString(16).padStart(2, "0")).join("");
const chroma = (rgb) => Math.max(...rgb) - Math.min(...rgb);

// Composite a stack of backgrounds (top first) onto white, in encoded sRGB like a browser.
function flatten(stack) {
  let out = [1, 1, 1];
  for (const layer of [...stack].reverse()) {
    const c = parseColor(layer);
    if (!c) continue;
    out = out.map((v, i) => c.rgb[i] * c.alpha + v * (1 - c.alpha));
  }
  return out;
}
function ratio(fgRgb, bgRgb) {
  const a = luminance(fgRgb), b = luminance(bgRgb);
  return Math.floor(((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)) * 100) / 100;
}

// ---------- in-page collection (runs in the browser) ----------
function collect() {
  const vis = (el) => {
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return false;
    const cs = getComputedStyle(el);
    return cs.visibility !== "hidden" && cs.display !== "none" && parseFloat(cs.opacity) > 0.05;
  };
  const bgStack = (el) => {
    const stack = [];
    let image = false;
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
      const cs = getComputedStyle(n);
      if (cs.backgroundImage && cs.backgroundImage !== "none") image = true;
      const bg = cs.backgroundColor;
      if (bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") {
        stack.push(bg);
        if (!/rgba\(|\/\s*0?\.\d/.test(bg)) break; // opaque: stop
      }
    }
    return { stack, image };
  };

  const texts = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const seen = new Map();
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.nodeValue.replace(/\s+/g, " ").trim();
    if (text.length < 2) continue;
    const el = node.parentElement;
    if (!el || ["SCRIPT", "STYLE", "NOSCRIPT", "TEMPLATE"].includes(el.tagName) || !vis(el)) continue;
    let rec = seen.get(el);
    if (!rec) {
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      const { stack, image } = bgStack(el);
      const size = parseFloat(cs.fontSize);
      const lh = cs.lineHeight === "normal" ? size * 1.2 : parseFloat(cs.lineHeight);
      rec = {
        tag: el.tagName.toLowerCase(), chars: 0, sample: text.slice(0, 60),
        family: cs.fontFamily.split(",")[0].replace(/["']/g, "").trim(),
        size, weight: parseInt(cs.fontWeight, 10) || 400, lineHeight: lh / size,
        normalLeading: cs.lineHeight === "normal",
        color: cs.color, bgStack: stack, overImage: image,
        gradientText: cs.webkitBackgroundClip === "text" || cs.backgroundClip === "text",
        align: cs.textAlign, width: r.width, height: r.height,
        heading: /^h[1-6]$/i.test(el.tagName) || !!el.closest("h1,h2,h3,h4,h5,h6"),
        block: !!el.closest("p,li,blockquote,dd"),
        interactive: !!el.closest("a,button,[role=button],input,select,textarea,label,summary"),
      };
      seen.set(el, rec);
      texts.push(rec);
    }
    rec.chars += text.length;
  }

  // Line length of real paragraphs.
  const measures = [];
  for (const p of document.querySelectorAll("p, li, blockquote")) {
    if (!vis(p)) continue;
    const len = p.innerText.replace(/\s+/g, " ").trim().length;
    if (len < 160) continue;
    const cs = getComputedStyle(p);
    const size = parseFloat(cs.fontSize);
    const lh = cs.lineHeight === "normal" ? size * 1.2 : parseFloat(cs.lineHeight);
    const lines = Math.max(1, Math.round(p.getBoundingClientRect().height / lh));
    if (lines >= 2) measures.push(Math.round(len / (lines - 0.5)));
  }

  // Page bands: big direct blocks, top to bottom.
  const bands = [];
  const root = document.querySelector("main") || document.body;
  const kids = [...(root.children.length >= 2 ? root.children : document.body.children)];
  for (const el of kids) {
    if (!vis(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.height < 160 || r.width < innerWidth * 0.6) continue;
    const { stack, image } = bgStack(el);
    bands.push({ tag: el.tagName.toLowerCase(), height: Math.round(r.height), bgStack: stack, image });
  }

  // Surfaces and effects.
  let boxes = 0, shadows = 0, blurs = 0, gradients = 0, purpleGradients = 0;
  const radii = {};
  const controls = [];
  for (const el of document.querySelectorAll("body *")) {
    if (!vis(el)) continue;
    const cs = getComputedStyle(el);
    const hasBox = (cs.backgroundColor !== "rgba(0, 0, 0, 0)" || cs.borderTopWidth !== "0px" || cs.boxShadow !== "none");
    if (hasBox) {
      boxes++;
      if (cs.boxShadow !== "none") shadows++;
      const rad = parseFloat(cs.borderTopLeftRadius);
      if (rad > 0) radii[Math.round(rad)] = (radii[Math.round(rad)] || 0) + 1;
    }
    if (cs.backdropFilter && cs.backdropFilter !== "none") blurs++;
    if (/gradient\(/.test(cs.backgroundImage)) {
      gradients++;
      if (/rgb\((?:9\d|1[0-6]\d), (?:[0-9]\d|1[0-2]\d), (?:2[0-5]\d)\)/.test(cs.backgroundImage)) purpleGradients++;
    }
    if (el.matches("button, a[href], [role=button], input:not([type=hidden]), select, textarea")) {
      const r = el.getBoundingClientRect();
      const inline = el.tagName === "A" && cs.display.startsWith("inline") && el.closest("p,li,td,blockquote");
      controls.push({ w: r.width, h: r.height, inline: !!inline, bg: cs.backgroundColor, color: cs.color, tag: el.tagName.toLowerCase() });
    }
  }

  // Stylesheet scan (same-origin sheets only).
  let reducedMotionRule = false, darkRule = false, unreadableSheets = 0, fixedAttachment = false;
  const scan = (rules) => {
    for (const rule of rules) {
      const cond = rule.conditionText || (rule.media && rule.media.mediaText) || "";
      if (/prefers-reduced-motion/.test(cond)) reducedMotionRule = true;
      if (/prefers-color-scheme/.test(cond)) darkRule = true;
      if (rule.style && rule.style.backgroundAttachment === "fixed") fixedAttachment = true;
      if (rule.cssRules) scan(rule.cssRules);
    }
  };
  for (const sheet of document.styleSheets) {
    try { scan(sheet.cssRules); } catch { unreadableSheets++; }
  }

  const anims = document.getAnimations ? document.getAnimations() : [];
  const meta = (n) => document.querySelector(`meta[name="${n}"]`)?.getAttribute("content") || "";
  const scripts = [...document.scripts].map((s) => s.src).join(" ");
  const libs = [];
  if (window.gsap || /gsap/i.test(scripts)) libs.push("gsap");
  if (window.ScrollTrigger || /scrolltrigger/i.test(scripts)) libs.push("scroll-trigger");
  if (window.Lenis || /lenis/i.test(scripts) || document.documentElement.classList.contains("lenis")) libs.push("smooth-scroll");
  if (/locomotive/i.test(scripts) || document.querySelector("[data-scroll-container]")) libs.push("smooth-scroll");
  if (window.THREE || /three(\.module)?(\.min)?\.js/i.test(scripts)) libs.push("webgl");

  return {
    title: document.title, lang: document.documentElement.lang,
    viewport: meta("viewport"), colorSchemeMeta: meta("color-scheme"),
    rootColorScheme: getComputedStyle(document.documentElement).colorScheme,
    bodyBg: bgStack(document.body).stack, pageHeight: document.documentElement.scrollHeight,
    texts, measures, bands, boxes, shadows, blurs, gradients, purpleGradients, radii, controls,
    reducedMotionRule, darkRule, unreadableSheets, fixedAttachment,
    animations: anims.length,
    infiniteAnimations: anims.filter((a) => a.effect && a.effect.getTiming().iterations === Infinity).length,
    autoplayVideos: [...document.querySelectorAll("video[autoplay]")].filter((v) => !v.controls).length,
    marquee: document.querySelectorAll("marquee, blink").length,
    imagesWithoutSize: [...document.images].filter((i) => !i.getAttribute("width") && !i.style.aspectRatio && getComputedStyle(i).aspectRatio === "auto").length,
    libs: [...new Set(libs)],
  };
}

// ---------- analysis ----------
const share = (map, total) => Object.entries(map).sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ value: k, share: Math.round((v / total) * 100) }));
const median = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : null; };

function analyse(light, dark, reduced, target) {
  const total = light.texts.reduce((n, t) => n + t.chars, 0) || 1;
  const families = {}, sizes = {}, weights = {};
  const pairs = new Map();
  for (const t of light.texts) {
    families[t.family] = (families[t.family] || 0) + t.chars;
    sizes[Math.round(t.size * 10) / 10] = (sizes[Math.round(t.size * 10) / 10] || 0) + t.chars;
    weights[t.weight] = (weights[t.weight] || 0) + t.chars;
    const fg = parseColor(t.color);
    if (!fg || t.gradientText) continue;
    const bg = flatten(t.bgStack);
    const painted = fg.rgb.map((c, i) => c * fg.alpha + bg[i] * (1 - fg.alpha));
    const key = `${toHex(painted)} on ${toHex(bg)}`;
    const p = pairs.get(key) || { text: toHex(painted), background: toHex(bg), ratio: ratio(painted, bg), chars: 0, minSize: Infinity, sample: t.sample, overImage: false, lightOnDark: luminance(painted) > luminance(bg), darkSurface: luminance(bg) < 0.05 };
    p.chars += t.chars; p.minSize = Math.min(p.minSize, t.size); p.overImage ||= t.overImage;
    if (t.size < 24 && !(t.size >= 18.66 && t.weight >= 700)) p.hasNormalText = true;
    pairs.set(key, p);
  }
  const pairList = [...pairs.values()].sort((a, b) => b.chars - a.chars);
  const bodyBlocks = light.texts.filter((t) => t.block && !t.heading && t.chars > 60);
  const bodyPool = bodyBlocks.length ? bodyBlocks : light.texts.filter((t) => !t.heading);
  const by = (key) => { const m = {}; for (const t of bodyPool) m[t[key]] = (m[t[key]] || 0) + t.chars; return Object.entries(m).sort((a, b) => b[1] - a[1])[0]?.[0]; };
  const bodySize = parseFloat(by("size")) || null;
  const bodyWeight = parseInt(by("weight"), 10) || null;
  const bodyLeading = (() => { const b = bodyPool.filter((t) => Math.abs(t.size - bodySize) < 0.6); const c = b.reduce((n, t) => n + t.chars, 0) || 1; return Math.round((b.reduce((n, t) => n + t.lineHeight * t.chars, 0) / c) * 100) / 100; })();
  const under14 = Math.round((light.texts.filter((t) => t.size < 14).reduce((n, t) => n + t.chars, 0) / total) * 100);
  const headings = light.texts.filter((t) => t.heading);
  const centered = headings.length ? Math.round((headings.filter((t) => t.align === "center").length / headings.length) * 100) : 0;

  const accents = {};
  for (const c of light.controls) {
    for (const v of [c.bg, c.color]) {
      const col = parseColor(v);
      if (col && col.alpha > 0.5 && chroma(col.rgb) > 0.25) accents[toHex(col.rgb)] = (accents[toHex(col.rgb)] || 0) + 1;
    }
  }
  const bandLum = light.bands.map((b) => ({ ...b, background: toHex(flatten(b.bgStack)), lum: luminance(flatten(b.bgStack)) }));
  const darkBg = toHex(flatten(dark.bodyBg)), lightBg = toHex(flatten(light.bodyBg));
  const hasDark = darkBg !== lightBg || luminance(flatten(dark.bodyBg)) < 0.2 && light.darkRule;
  const smallTargets = light.controls.filter((c) => !c.inline && c.w >= 6 && c.h >= 6 && (c.w < 24 || c.h < 24)).length; // under 6px is visually hidden

  const design = {
    typography: {
      families: share(families, total).slice(0, 4),
      bodySizePx: bodySize, bodyWeight, bodyLineHeight: bodyLeading,
      scalePx: share(sizes, total).slice(0, 8).map((s) => ({ px: parseFloat(s.value), share: s.share })).sort((a, b) => b.px - a.px),
      weights: share(weights, total).slice(0, 5),
      charsPerLine: { median: median(light.measures), max: light.measures.length ? Math.max(...light.measures) : null, paragraphsMeasured: light.measures.length },
      headingsCenteredPercent: centered,
    },
    color: {
      pageBackground: lightBg, darkSchemeBackground: hasDark ? darkBg : null,
      textPairs: pairList.slice(0, 8).map((p) => ({ text: p.text, background: p.background, ratio: p.ratio, share: Math.round((p.chars / total) * 100), sample: p.sample })),
      accents: Object.entries(accents).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([hex, uses]) => ({ hex, uses })),
    },
    layout: {
      pageHeightPx: light.pageHeight,
      bands: bandLum.slice(0, 14).map((b) => ({ tag: b.tag, heightPx: b.height, background: b.image ? `${b.background} + image` : b.background })),
    },
    surfaces: {
      boxes: light.boxes, withShadowPercent: light.boxes ? Math.round((light.shadows / light.boxes) * 100) : 0,
      cornerRadiiPx: share(light.radii, Object.values(light.radii).reduce((a, b) => a + b, 0) || 1).slice(0, 4).map((r) => ({ px: parseInt(r.value, 10), share: r.share })),
      backdropBlurs: light.blurs, gradients: light.gradients, gradientText: light.texts.filter((t) => t.gradientText).length,
    },
    motion: {
      runningAnimations: light.animations, infiniteAnimations: light.infiniteAnimations,
      runningAnimationsWithReducedMotion: reduced.animations,
      libraries: light.libs, autoplayVideosWithoutControls: light.autoplayVideos,
      respectsReducedMotion: light.reducedMotionRule || reduced.animations < light.animations ? true : light.animations === 0 ? null : false,
    },
  };

  // ---------- rendered comfort check ----------
  const findings = [];
  const add = (rule, severity, grade, detail, fix) => findings.push({ rule, severity, grade, detail, fix });
  const significant = pairList.filter((p) => p.chars >= 12);
  for (const p of significant.filter((p) => !p.overImage && p.ratio < (p.hasNormalText ? 4.5 : 3)).slice(0, 6))
    add("contrast-floor", "error", "standard", `${p.text} on ${p.background} is ${p.ratio}:1 ("${p.sample}").`, `Raise it to at least ${p.hasNormalText ? "4.5" : "3"}:1.`);
  for (const p of significant.filter((p) => p.lightOnDark && p.darkSurface && !p.overImage && p.hasNormalText && p.ratio >= 4.5 && p.ratio < 8.5).slice(0, 4))
    add("contrast-dark-secondary", "warning", "inference", `${p.text} on ${p.background} is ${p.ratio}:1 ("${p.sample}"). It passes AA and reads weak on a dark surface.`, "Aim for 8.5:1 or more.");
  const overImage = significant.filter((p) => p.overImage).length;
  const main = pairList[0];
  if (main && main.ratio > 18 && main.chars / total > 0.3)
    add("contrast-pure-extremes", "warning", "convention", `Most text is ${main.text} on ${main.background} at ${main.ratio}:1.`, "Soften to near-black on near-white, or off-white on dark gray.");
  if (bodySize && bodySize < 16) add("type-body-size", "warning", "research", `Body text renders at ${bodySize}px.`, "Use 1rem or more, and 1.125rem to 1.25rem for long reading.");
  if (under14 > 25) add("type-body-size", "warning", "research", `${under14}% of the text on the page is under 14px.`, "Keep small sizes for short labels.");
  if (bodyLeading && bodyLeading < 1.4) add("type-leading", "warning", "convention", `Body line height is ${bodyLeading}.`, "Use 1.4 to 1.6.");
  if (bodyWeight && bodyWeight < 400) add("type-weight", "warning", "convention", `Body text is weight ${bodyWeight}.`, "Use 400 or more.");
  const med = design.typography.charsPerLine.median;
  if (med && med > 80) add("type-measure", "warning", "convention", `Paragraph lines run about ${med} characters (longest about ${design.typography.charsPerLine.max}).`, "Cap reading text near 55ch.");
  else if (med && med > 75) add("type-measure", "note", "convention", `Paragraph lines run about ${med} characters.`, "55ch keeps lines near 70 characters.");
  if (/user-scalable\s*=\s*(no|0)|maximum-scale\s*=\s*[1-4](\.\d+)?\b/i.test(light.viewport)) add("type-rem-zoom", "error", "standard", `The viewport meta tag blocks zoom: ${light.viewport}`, "Remove user-scalable=no and any maximum-scale below 5.");
  if (light.autoplayVideos) add("motion-autoplay", "error", "standard", `${light.autoplayVideos} video(s) autoplay with no controls.`, "Add controls or a visible pause button.");
  if (light.marquee) add("motion-autoplay", "error", "standard", "The page uses <marquee> or <blink>.", "Replace with static text.");
  if (light.infiniteAnimations) add("motion-autoplay", "warning", "convention", `${light.infiniteAnimations} animation(s) loop forever.`, "Limit the iteration count unless the element leaves the page.");
  if (light.animations > 0 && reduced.animations >= light.animations && !light.reducedMotionRule)
    add("motion-reduced", light.unreadableSheets ? "warning" : "error", "standard", `${light.animations} animation(s) keep running when reduced motion is requested.${light.unreadableSheets ? " Some stylesheets could not be read." : ""}`, "Put movement inside @media (prefers-reduced-motion: no-preference).");
  if (light.libs.includes("smooth-scroll") || light.fixedAttachment) add("motion-triggers", "warning", "research", light.fixedAttachment ? "A fixed background creates parallax." : "A smooth-scroll library replaces native scrolling.", "Remove it, or disable it under prefers-reduced-motion.");
  for (let i = 1; i < bandLum.length; i++) {
    const a = bandLum[i - 1], b = bandLum[i];
    if (!a.image && !b.image && Math.abs(a.lum - b.lum) > 0.7) { add("lum-section-steps", "warning", "inference", `A ${a.background} section sits directly against a ${b.background} section.`, "Step between neighboring surface tones."); break; }
  }
  if (!hasDark) add("theme-both-schemes", "note", "research", "The page looks the same when a dark scheme is requested.", "Ship both schemes and follow prefers-color-scheme.");
  if (!light.colorSchemeMeta && (!light.rootColorScheme || light.rootColorScheme === "normal")) add("lum-white-flash", "note", "convention", "No color-scheme declaration or meta tag was found.", "Add color-scheme to :root and a color-scheme meta tag.");
  if (smallTargets) add("layout-targets", "warning", "standard", `${smallTargets} control(s) are smaller than 24 by 24 CSS px.`, "Give controls at least 24 by 24, and 44 by 44 for primary actions.");
  if (light.imagesWithoutSize) add("layout-shift", "note", "research", `${light.imagesWithoutSize} image(s) have no width, height or aspect ratio.`, "Reserve their space so the page does not jump while loading.");
  if (design.surfaces.gradientText) add("craft-palette", "note", "convention", `${design.surfaces.gradientText} piece(s) of gradient text. Their contrast cannot be measured.`, "Use one ink color.");
  if (light.purpleGradients) add("craft-palette", "note", "convention", "The page uses an indigo or purple gradient.", "Use a flat surface or the project's own palette.");
  if (light.blurs > 3 || design.surfaces.withShadowPercent > 40) add("craft-restraint", "note", "convention", `${light.blurs} blurred layer(s), and ${design.surfaces.withShadowPercent}% of boxes carry a shadow.`, "Use flat surfaces and hairlines for most of the page.");
  if (headings.length >= 4 && centered === 100) add("craft-layout", "note", "convention", "Every heading is centered.", "Left-align most headings and vary section structure.");

  const order = { error: 0, warning: 1, note: 2 };
  findings.sort((a, b) => order[a.severity] - order[b.severity]);
  const count = (s) => findings.filter((f) => f.severity === s).length;
  const notVerified = ["Flash rate of animations and video", "Whether state is carried by color alone", "Hover, focus and scrolled states", "Pages behind a sign-in"];
  if (overImage) notVerified.unshift(`Contrast of ${overImage} text style(s) that sit over an image or gradient`);
  if (light.unreadableSheets) notVerified.push(`${light.unreadableSheets} cross-origin stylesheet(s) could not be read`);
  return { tool: "easy-on-the-eyes", version: VERSION, target, title: light.title, design, summary: { errors: count("error"), warnings: count("warning"), notes: count("note") }, findings, notVerified };
}

// ---------- output ----------
function printText(r, shots) {
  const d = r.design, o = [];
  const list = (a, f) => (a.length ? a.map(f).join(", ") : "none found");
  o.push(`Easy on the Eyes inspect: ${r.target}`, r.title ? `"${r.title}"` : "", "");
  o.push("Design brief");
  o.push(`  Fonts:        ${list(d.typography.families, (f) => `${f.value} ${f.share}%`)}`);
  o.push(`  Body text:    ${d.typography.bodySizePx}px, weight ${d.typography.bodyWeight}, line height ${d.typography.bodyLineHeight}`);
  o.push(`  Type scale:   ${list(d.typography.scalePx, (s) => `${s.px}px`)}`);
  o.push(`  Line length:  ${d.typography.charsPerLine.median ? `about ${d.typography.charsPerLine.median} characters (longest ${d.typography.charsPerLine.max}, ${d.typography.charsPerLine.paragraphsMeasured} paragraphs)` : "no long paragraphs to measure"}`);
  o.push(`  Headings:     ${d.typography.headingsCenteredPercent}% centered`);
  o.push(`  Background:   ${d.color.pageBackground}${d.color.darkSchemeBackground ? `, dark scheme ${d.color.darkSchemeBackground}` : ", no dark scheme"}`);
  o.push(`  Accents:      ${list(d.color.accents, (a) => `${a.hex} (${a.uses} uses)`)}`);
  o.push("  Text pairs:");
  for (const p of d.color.textPairs) o.push(`    ${p.text} on ${p.background}  ${p.ratio}:1  ${p.share}%  "${p.sample}"`);
  o.push(`  Sections:     ${list(d.layout.bands, (b) => `${b.tag} ${b.heightPx}px ${b.background}`)}`);
  o.push(`  Surfaces:     ${d.surfaces.boxes} boxes, ${d.surfaces.withShadowPercent}% with shadow, radii ${list(d.surfaces.cornerRadiiPx, (x) => `${x.px}px`)}, ${d.surfaces.backdropBlurs} blurs, ${d.surfaces.gradients} gradients`);
  o.push(`  Motion:       ${d.motion.runningAnimations} running (${d.motion.infiniteAnimations} endless), ${d.motion.runningAnimationsWithReducedMotion} with reduced motion, libraries: ${list(d.motion.libraries, (x) => x)}`);
  o.push("", `Rendered comfort check: ${r.summary.errors} errors, ${r.summary.warnings} warnings, ${r.summary.notes} notes`);
  for (const f of r.findings) o.push(`  ${f.severity.padEnd(7)} ${f.rule}  [${f.grade}]`, `    ${f.detail}`, `    Fix: ${f.fix}`);
  o.push("", "Not verified");
  for (const n of r.notVerified) o.push(`  - ${n}`);
  if (shots.length) o.push("", "Screenshots", ...shots.map((s) => `  ${s}`));
  console.log(o.filter((l, i) => l !== "" || o[i - 1] !== "").join("\n"));
}

async function main() {
  const argv = process.argv.slice(2);
  const opt = { out: null, json: false, width: 1440 };
  const args = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--out") opt.out = argv[++i];
    else if (argv[i] === "--width") opt.width = parseInt(argv[++i], 10) || 1440;
    else if (argv[i] === "--json") opt.json = true;
    else if (argv[i] === "--help") args.length = 0, argv.length = 0;
    else args.push(argv[i]);
  }
  if (args.length !== 1) {
    console.error("Usage: node inspect.mjs <url-or-file> [--out <dir>] [--json] [--width 1440]\n\nOpens the page in a browser and prints a design brief plus a rendered comfort check.\n--out saves light and dark screenshots to that folder.");
    process.exit(2);
  }
  let target = args[0];
  const url = /^https?:\/\//i.test(target) ? target : existsSync(target) ? pathToFileURL(resolve(target)).href : null;
  if (!url) { console.error(`Not a URL or an existing file: ${target}`); process.exit(2); }

  let chromium;
  for (const base of [join(process.cwd(), "noop.js"), import.meta.url]) {
    try { ({ chromium } = createRequire(base)("playwright")); break; } catch {}
  }
  if (!chromium) {
    console.error("This command needs Playwright. Install it in the project and try again:\n  npm i -D playwright && npx playwright install chromium");
    process.exit(2);
  }

  const proxy = process.env.HTTPS_PROXY || process.env.https_proxy || process.env.HTTP_PROXY || process.env.http_proxy;
  const browser = await chromium.launch(proxy && /^https?:/i.test(url) ? { proxy: { server: proxy } } : {});
  const shots = [];
  try {
    const snap = async (settings, name) => {
      const context = await browser.newContext({ viewport: { width: opt.width, height: 900 }, ...settings });
      const page = await context.newPage();
      await page.goto(url, { waitUntil: "load", timeout: 45000 });
      await page.waitForTimeout(1200);
      const data = await page.evaluate(collect);
      if (opt.out && name) {
        mkdirSync(opt.out, { recursive: true });
        const file = join(opt.out, `${name}.png`);
        await page.screenshot({ path: file, fullPage: true });
        shots.push(file);
      }
      await context.close();
      return data;
    };
    const light = await snap({ colorScheme: "light" }, "light");
    const dark = await snap({ colorScheme: "dark" }, "dark");
    const reduced = await snap({ colorScheme: "light", reducedMotion: "reduce" }, null);
    const result = analyse(light, dark, reduced, target);
    result.screenshots = shots;
    if (opt.json) console.log(JSON.stringify(result, null, 2));
    else printText(result, shots);
    process.exitCode = result.summary.errors > 0 ? 1 : 0;
  } catch (e) {
    console.error(`Could not inspect ${target}: ${e.message.split("\n")[0]}`);
    process.exitCode = 2;
  } finally {
    await browser.close();
  }
}

main();
