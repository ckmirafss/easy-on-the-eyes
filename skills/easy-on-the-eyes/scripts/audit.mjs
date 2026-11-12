#!/usr/bin/env node
// Easy on the Eyes: static comfort audit. No dependencies. Node 18+.
// easy-on-the-eyes-ignore-file (this file contains the patterns it searches for)
//
//   node audit.mjs <path> [--json] [--strict]
//   node audit.mjs contrast <foreground> <background> [--min 4.5] [--json]
//
// Exit codes: 0 no errors, 1 errors found (or warnings with --strict), 2 usage error.

import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, relative, extname, resolve } from "node:path";

const VERSION = "1.0.0";
const SKIP_DIRS = new Set([
  "node_modules", "dist", "build", "out", "coverage", "vendor", "target", "__pycache__",
]);
const STYLE_EXT = new Set([".css", ".scss", ".sass", ".less", ".pcss"]);
const MARKUP_EXT = new Set([".html", ".htm", ".jsx", ".tsx", ".vue", ".svelte", ".astro", ".js", ".ts", ".mjs", ".mdx"]);
const EMBEDS_STYLE = new Set([".html", ".htm", ".vue", ".svelte", ".astro"]);
const MAX_BYTES = 1_000_000;
const IGNORE = "easy-on-the-eyes-ignore";

// ---------- color maths (WCAG 2.x) ----------

const toLinear = (v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
const toEncoded = (v) => (v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055);
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const pct = (t, scale = 1) => (t.endsWith("%") ? (parseFloat(t) / 100) * scale : parseFloat(t));
const alphaOf = (t) => (t === undefined ? 1 : clamp01(pct(t)));

// Returns gamma-encoded sRGB channels in 0..1 plus alpha, or null.
function parseColor(input) {
  const s = String(input).trim().toLowerCase();
  if (s === "white") return { rgb: [1, 1, 1], alpha: 1 };
  if (s === "black") return { rgb: [0, 0, 0], alpha: 1 };

  let m = s.match(/^#([0-9a-f]{3,8})$/);
  if (m) {
    let h = m[1];
    if (h.length === 3 || h.length === 4) h = [...h].map((c) => c + c).join("");
    if (h.length !== 6 && h.length !== 8) return null;
    const rgb = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
    return { rgb, alpha: h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1 };
  }

  m = s.match(/^(rgba?|hsla?|oklch)\(([^)]+)\)$/);
  if (!m) return null;
  const parts = m[2].split(/[\s,/]+/).filter(Boolean);
  if (parts.length < 3) return null;

  if (m[1].startsWith("rgb")) {
    const rgb = parts.slice(0, 3).map((p) => clamp01(p.endsWith("%") ? parseFloat(p) / 100 : parseFloat(p) / 255));
    return rgb.some(Number.isNaN) ? null : { rgb, alpha: alphaOf(parts[3]) };
  }

  if (m[1].startsWith("hsl")) {
    const h = ((parseFloat(parts[0]) % 360) + 360) % 360;
    const sat = clamp01(parseFloat(parts[1]) / 100);
    const l = clamp01(parseFloat(parts[2]) / 100);
    if ([h, sat, l].some(Number.isNaN)) return null;
    const a = sat * Math.min(l, 1 - l);
    const f = (n) => { const k = (n + h / 30) % 12; return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); };
    return { rgb: [f(0), f(8), f(4)], alpha: alphaOf(parts[3]) };
  }

  // oklch
  const L = pct(parts[0], 1);
  const C = parts[1].endsWith("%") ? (parseFloat(parts[1]) / 100) * 0.4 : parseFloat(parts[1]);
  const hue = (parseFloat(parts[2]) || 0) * (Math.PI / 180);
  if ([L, C].some(Number.isNaN)) return null;
  const a = C * Math.cos(hue);
  const b = C * Math.sin(hue);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const mm = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const ss = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const linear = [
    4.0767416621 * l - 3.3077115913 * mm + 0.2309699292 * ss,
    -1.2684380046 * l + 2.6097574011 * mm - 0.3413193965 * ss,
    -0.0041960863 * l - 0.7034186147 * mm + 1.707614701 * ss,
  ];
  return { rgb: linear.map((v) => toEncoded(clamp01(v))), alpha: alphaOf(parts[3]) };
}

const luminance = (rgb) => {
  const [r, g, b] = rgb.map(toLinear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

function contrastReport(fgIn, bgIn, min) {
  const fg = parseColor(fgIn);
  const bg = parseColor(bgIn);
  if (!fg || !bg) return null;
  // Browsers composite translucent colors in gamma-encoded sRGB, so blend there.
  const painted = fg.alpha < 1 ? fg.rgb.map((c, i) => c * fg.alpha + bg.rgb[i] * (1 - fg.alpha)) : fg.rgb;
  const lf = luminance(painted);
  const lb = luminance(bg.rgb);
  const ratio = (Math.max(lf, lb) + 0.05) / (Math.min(lf, lb) + 0.05);
  const shown = Math.floor(ratio * 100) / 100; // never round a failing pair up to a pass
  const lightOnDark = lf > lb;
  const darkSurface = lb < 0.05; // roughly #3f3f3f and darker
  const notes = [];
  if (bg.alpha < 1) notes.push("The background is translucent. Its alpha was ignored, so check it against what sits behind it.");
  if (fg.alpha < 1) notes.push("The foreground is translucent and was blended onto the background before measuring.");
  if (ratio < 3) notes.push("Fails every WCAG 2 threshold, including the 3:1 for large text and UI parts [standard].");
  else if (ratio < 4.5) notes.push("Usable only for large text (24px, or 18.66px bold) and UI parts such as borders and icons [standard].");
  if (lightOnDark && darkSurface) {
    if (ratio >= 4.5 && ratio < 8.5)
      notes.push("Passes AA, but light text on a dark surface reads weak at this level. For secondary text aim for 8.5:1 or more, and 12:1 to 16:1 for body text [inference].");
    else if (ratio >= 8.5 && ratio < 12)
      notes.push("Good for secondary text on a dark surface. Body text is more comfortable at 12:1 to 16:1 [convention].");
  } else if (!lightOnDark && lb > 0.8 && ratio >= 4.5 && ratio < 7) {
    notes.push("Good for secondary text on a light surface. Body text is usually set at 14:1 to 18:1 [convention].");
  }
  if (ratio > 18)
    notes.push("At the harsh end for page text. Near-black on near-white is the usual default. This is a house heuristic, not a standard [convention].");
  return {
    foreground: fgIn, background: bgIn, ratio: shown,
    polarity: lightOnDark ? "light on dark" : "dark on light",
    pass: { bodyText: ratio >= 4.5, largeTextAndUi: ratio >= 3, enhancedAAA: ratio >= 7, min, meetsMin: ratio >= min },
    notes,
  };
}

// ---------- file walking ----------

function walk(root) {
  if (statSync(root).isFile()) return [root];
  const files = [];
  const stack = [root];
  while (stack.length) {
    const dir = stack.pop();
    let entries;
    try { entries = readdirSync(dir, { withFileTypes: true }); } catch { continue; }
    for (const e of entries) {
      const full = join(dir, e.name);
      if (e.isDirectory()) {
        if (!SKIP_DIRS.has(e.name) && !e.name.startsWith(".")) stack.push(full);
      } else if (e.isFile()) {
        const ext = extname(e.name).toLowerCase();
        if (!STYLE_EXT.has(ext) && !MARKUP_EXT.has(ext)) continue;
        if (/\.min\.(css|js)$/.test(e.name)) continue;
        try { if (statSync(full).size > MAX_BYTES) continue; } catch { continue; }
        files.push(full);
      }
    }
  }
  return files.sort();
}

// ---------- checks ----------
// Each check reports under a rule ID from SKILL.md. Several checks can share one rule.

const CHECKS = {
  pureExtremes: {
    rule: "contrast-pure-extremes", grade: "convention",
    why: "Pure black or pure white as a page text or background color is the harshest value a screen can show.",
    fix: "Use near-black and near-white (for example oklch(0.24 0.01 255) on oklch(0.985 0.002 90)) or semantic tokens.",
  },
  smallText: {
    rule: "type-body-size", grade: "research",
    why: "Text near the acuity limit slows reading and raises symptoms.",
    fix: "Use 1rem or more for reading text and never less than 0.875rem.",
  },
  tightLeading: {
    rule: "type-leading", grade: "convention",
    why: "Tight line spacing makes text a denser stripe pattern, and it is the one leading choice shown to hurt reading.",
    fix: "Use line-height 1.4 to 1.6 for body text. 1.1 to 1.3 is fine for headings.",
  },
  viewportOnly: {
    rule: "type-rem-zoom", grade: "standard",
    why: "A font size made only of viewport units does not respond to zoom (WCAG 1.4.4, failure F94).",
    fix: "Use clamp() with a rem term, for example clamp(1rem, 0.95rem + 0.25vw, 1.125rem).",
  },
  zoomDisabled: {
    rule: "type-rem-zoom", grade: "standard",
    why: "Blocking pinch zoom removes the reader's main way to enlarge text (WCAG 1.4.4).",
    fix: "Remove user-scalable=no and any maximum-scale below 5.",
  },
  thinWeight: {
    rule: "type-weight", grade: "convention",
    why: "Thin strokes render fainter than their nominal color, worst for light text on dark.",
    fix: "Use weight 400 or more for body text. Keep lighter weights for large display type.",
  },
  justified: {
    rule: "type-align", grade: "standard",
    why: "Justified text creates uneven word gaps that hurt weaker readers (WCAG 1.4.8, AAA).",
    fix: "Use text-align: start.",
  },
  noReducedGuard: {
    rule: "motion-reduced", grade: "standard",
    why: "Motion that ignores prefers-reduced-motion can trigger dizziness and nausea (WCAG 2.3.3, AAA).",
    fix: "Put movement inside @media (prefers-reduced-motion: no-preference), or add a reduce block.",
  },
  autoplayVideo: {
    rule: "motion-autoplay", grade: "standard",
    why: "Auto-starting video with no controls cannot be paused (WCAG 2.2.2).",
    fix: "Add controls and drop autoplay, or add a visible pause button and skip autoplay under prefers-reduced-motion.",
  },
  infinite: {
    rule: "motion-autoplay", grade: "convention",
    why: "Constant movement beside text keeps pulling the eye away from it.",
    fix: "Limit the iteration count, or make sure the element leaves the page when its job is done.",
  },
  legacyTags: {
    rule: "motion-autoplay", grade: "standard",
    why: "<marquee> and <blink> move or flash with no pause control (WCAG 2.2.2).",
    fix: "Replace with static text.",
  },
  animatedImage: {
    rule: "motion-autoplay", grade: "standard",
    why: "An animated GIF loops with no pause control. If it runs longer than 5 seconds beside other content, treat this as an error (WCAG 2.2.2).",
    fix: "Use a video with controls, or a still image under prefers-reduced-motion.",
  },
  parallax: {
    rule: "motion-triggers", grade: "research",
    why: "Parallax and hijacked scrolling are the most reported motion triggers.",
    fix: "Remove it, or turn it off under prefers-reduced-motion and keep native scrolling.",
  },
  focusRemoved: {
    rule: "theme-focus", grade: "standard",
    why: "Removing the focus outline hides where the keyboard is (WCAG 2.4.7).",
    fix: "Keep a visible outline on :focus-visible, for example outline: 2px solid currentColor.",
  },
  noColorScheme: {
    rule: "lum-white-flash", grade: "convention",
    why: "Without color-scheme the browser paints white form controls, scrollbars and a white first frame in dark mode.",
    fix: "Once the page has both light and dark colors, add color-scheme: light dark to :root and <meta name=\"color-scheme\" content=\"light dark\">.",
  },
  noColorSchemeMeta: {
    rule: "lum-white-flash", grade: "convention",
    why: "The color-scheme meta tag lets the browser paint the right background before any CSS loads.",
    fix: "Add <meta name=\"color-scheme\" content=\"light dark\"> to <head>. In a framework, set it where the head is generated.",
  },
  singleScheme: {
    rule: "theme-both-schemes", grade: "research",
    why: "No theme is best for everyone. Some readers need dark surfaces and others need dark text on light.",
    fix: "Ship both schemes and follow prefers-color-scheme.",
  },
  unguardedBlur: {
    rule: "theme-preferences", grade: "convention",
    why: "Text over a blurred, translucent layer changes contrast with whatever scrolls beneath it.",
    fix: "Give the layer a solid fallback under prefers-reduced-transparency: reduce.",
  },
  stripes: {
    rule: "pattern-stripes", grade: "inference",
    why: "High-contrast stripes with a period of about 7 to 27 px are the most uncomfortable static pattern known. Treat this as a warning if the pattern covers a large area at strong contrast.",
    fix: "Lower the contrast of the pattern, widen it, or keep it to small areas.",
  },
  zebra: {
    rule: "pattern-stripes", grade: "inference",
    why: "Zebra rows are a stripe pattern. They are fine when the tint is faint and there are no row borders as well.",
    fix: "Keep the tint within a few lightness points of the surface, or use a hairline between rows instead.",
  },
};

const VIEWPORT_UNIT = /\d(?:vw|vh|vi|vb|vmin|vmax|[sld]v[whib]|cq[whib]|cqmin|cqmax)\b/;
const HEADING_HINT = /\bh[1-6]\b|head|title|display|hero|logo|brand|badge|btn|button|label|chip|tag\b/i;
const PURE_VALUE = String.raw`(?:#(?:000|fff)\b|#(?:000000|ffffff)\b|rgba?\(\s*(?:0[\s,]+0[\s,]+0|255[\s,]+255[\s,]+255)\s*\)|hsla?\(\s*[\d.]+(?:deg)?[\s,]+[\d.]+%[\s,]+(?:0|100)%\s*\)|oklch\(\s*(?:0|1|0%|100%)\s+0\s+[\d.]+\s*\)|\b(?:white|black)\b)`;
const PURE_DECL = new RegExp(
  String.raw`(?:^|[\s;{"'])(?:color|background(?:-color)?|--[\w-]*(?:bg|background|surface|text|foreground|fg)[\w-]*)\s*:\s*(?:light-dark\()?[^;}]*?` + PURE_VALUE, "i");
const PURE_CLASS = /\b(?:bg-(?:white|black)|text-black)\b(?!\/)|\btext-white\b(?!\/)(?=[^"'`]*\bbg-black\b(?!\/))|\bbg-black\b(?!\/)(?=[^"'`]*\btext-white\b(?!\/))/;

function leadingValue(m) {
  // Returns the line height as a unitless number, or null when it cannot be read.
  if (m[1] !== undefined) return parseFloat(m[1]);
  if (m[2] !== undefined) return parseFloat(m[2]) / 100;
  return null;
}

function sizeInPx(m) {
  const n = parseFloat(m[1] ?? m[3]);
  const unit = m[2] ?? m[4];
  return unit === "rem" ? n * 16 : unit === "pt" ? n * (4 / 3) : n;
}

function stripePeriod(m) {
  const px = [...m[1].matchAll(/(\d*\.?\d+)px/g)].map((x) => parseFloat(x[1]));
  return px.length ? Math.max(...px) : null;
}

// severity may be a string or (match, ctx, line) => "error" | "warning" | "note" | null
const LINE_CHECKS = [
  { check: "pureExtremes", re: PURE_DECL,
    severity: (m, ctx) => (ctx.inContrastBlock ? null : "warning") },
  { check: "pureExtremes", re: PURE_CLASS, markupOnly: true, severity: "warning" },

  { check: "smallText",
    re: /font-size:\s*(\d*\.?\d+)(px|rem|pt)\b|\btext-\[(\d*\.?\d+)(px|rem)\]|\b(text-xs)\b/,
    severity: (m) => {
      if (m[5]) return "note";
      const px = sizeInPx(m);
      if (px >= 16) return null;
      return px < 14 ? "warning" : "note";
    },
    detail: (m) => {
      if (m[5]) return "12px in Tailwind. Fine for a short label, not for reading text.";
      const px = sizeInPx(m);
      return px < 14 ? `About ${Math.round(px * 10) / 10}px at default settings.` : "Below 16px. Fine for a short label, not for body text.";
    } },

  { check: "tightLeading",
    re: /line-height:\s*(?:(0?\.\d+|[0-9](?:\.\d+)?)(?:em)?|(\d{2,3})%)\s*(?:;|\}|$|!|"|')/,
    severity: (m, ctx, line) => {
      const v = leadingValue(m);
      if (v === null || v >= 1.4 || v === 0) return null;
      if (v < 1.1) return "warning";
      return HEADING_HINT.test(line) || HEADING_HINT.test(ctx.selector) ? null : "note";
    },
    detail: (m) => (leadingValue(m) < 1.1 ? "Lines will touch or overlap at reading sizes." : "Fine for headings, too tight for body text.") },
  { check: "tightLeading", re: /\bleading-(none|tight|snug)\b|\bleading-\[(0?\.\d+|1(?:\.[0-3]\d*)?)\]/, markupOnly: true,
    severity: (m, ctx, line) => {
      const v = m[2] !== undefined ? parseFloat(m[2]) : m[1] === "none" ? 1 : m[1] === "tight" ? 1.25 : 1.375;
      if (v < 1.1) return "warning";
      return /\btext-(?:[2-9]xl|xl|lg)\b|font-(?:bold|semibold|extrabold|black)\b/.test(line) ? null : "note";
    },
    detail: (m) => (m[1] === "none" ? "Lines will touch or overlap at reading sizes." : "Fine for headings, too tight for body text.") },

  { check: "viewportOnly", re: /font-size:\s*([^;}"']+)/,
    severity: (m) => (VIEWPORT_UNIT.test(m[1]) && !/\d(?:rem|em|px|pt)\b|%/.test(m[1]) && !/var\(/.test(m[1]) ? "error" : null) },
  { check: "zoomDisabled", severity: "error",
    re: /user-scalable\s*=\s*(?:no|0)|maximum-scale\s*=\s*[1-4](?:\.\d+)?\b|userScalable:\s*false|maximumScale:\s*[1-4](?:\.\d+)?\b/i },

  { check: "thinWeight", severity: "warning",
    re: /font-weight:\s*(?:[1-3]\d{2}|lighter)\b|\bfont-(?:thin|extralight|light)\b/ },
  { check: "justified", severity: "warning", re: /text-align:\s*justify|\btext-justify\b/ },

  { check: "infinite", severity: "warning",
    re: /animation(?:-iteration-count)?:[^;}]*\binfinite\b|\banimate-(?:ping|pulse|bounce)\b|repeat:\s*Infinity/,
    skip: (line) => /motion-reduce:|motion-safe:/.test(line) },
  { check: "infinite", severity: "note", re: /\banimate-spin\b/, markupOnly: true,
    detail: () => "Fine for a spinner that is removed when loading ends.",
    skip: (line) => /motion-reduce:|motion-safe:/.test(line) },
  { check: "legacyTags", severity: "error", re: /<(?:marquee|blink)\b/i, markupOnly: true },
  { check: "animatedImage", severity: "note", re: /\.gif\b(?=["')\s?#])/i },
  { check: "parallax", severity: "warning",
    re: /background-attachment:\s*fixed|\bbg-fixed\b|from\s+["'](?:lenis|locomotive-scroll|fullpage\.js|@studio-freight\/lenis|rellax|simple-parallax-js)["']/ },

  { check: "focusRemoved",
    re: /outline:\s*(?:none|0|transparent)\b(?!\s*px|\.)|outline-(?:width:\s*0\b(?!\.)|style:\s*none)|\boutline-none\b/,
    severity: (m, ctx) => (ctx.fileHasFocusStyle ? "warning" : "error"),
    detail: (m, ctx) => (ctx.fileHasFocusStyle
      ? "This file has other focus styles. Confirm one replaces this outline and survives forced colors (box-shadow does not)."
      : "No replacement focus style found in this file.") },

  { check: "stripes", re: /repeating-(?:linear|conic|radial)-gradient\(([^;]*)/,
    severity: (m) => {
      const period = stripePeriod(m);
      if (period === null) return "note";
      return period >= 4 && period <= 30 ? "note" : null;
    },
    detail: (m) => {
      const period = stripePeriod(m);
      return period === null ? "Check the stripe period and contrast by eye." : `Stripe period of about ${period}px. Check its contrast and area by eye.`;
    } },
  { check: "zebra", severity: "note",
    re: /:nth-(?:child|of-type)\(\s*(?:even|odd|2n(?:\s*\+\s*1)?)\s*\)[^{]*\{[^}]*background/ },
];

const MOTION_RE = /(?:^|[\s;{])(?:animation(?:-name)?|transition(?:-property)?)\s*:(?!\s*none)|@keyframes\b|scroll-behavior:\s*smooth/m;
const REDUCED_RE = /@media[^{]*prefers-reduced-motion|matchMedia\([^)]*prefers-reduced-motion|motion-reduce:|motion-safe:|useReducedMotion|reducedMotion/;
const COLOR_SCHEME_RE = /(?<!prefers-)color-scheme\s*:|colorScheme/;
const COLOR_SCHEME_META_RE = /<meta[^>]*name=["']color-scheme["']|colorScheme\s*:/i;
const DARK_RE = /prefers-color-scheme|light-dark\(|\.dark\b|\[data-theme|\bdark:/;
const CONTRAST_BLOCK_RE = /@media[^{]*(?:forced-colors|prefers-contrast)/;
const blank = (c) => c.replace(/[^\n]/g, " ");
const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, blank).replace(/<!--[\s\S]*?-->/g, blank);

function lineOf(content, index) {
  let n = 1;
  for (let i = 0; i < index && i < content.length; i++) if (content.charCodeAt(i) === 10) n++;
  return n;
}

function snippet(line, m) {
  const text = line.trim();
  if (text.length <= 160) return text;
  const at = Math.max(0, text.indexOf(m[0].trim()));
  const start = Math.max(0, at - 60);
  return (start > 0 ? "..." : "") + text.slice(start, start + 160) + (start + 160 < text.length ? "..." : "");
}

function push(findings, check, severity, file, line, source, extra = "", match = "") {
  const c = CHECKS[check];
  findings.push({
    rule: c.rule, severity, grade: c.grade, file, line, match, source,
    why: extra ? `${extra} ${c.why}` : c.why, fix: c.fix,
  });
}

function auditFile(file, rel, raw, findings) {
  const ext = extname(file).toLowerCase();
  const isStyle = STYLE_EXT.has(ext);
  const hasStyle = isStyle || (EMBEDS_STYLE.has(ext) && /<style[\s>]/i.test(raw));
  const rawLines = raw.split(/\r?\n/);
  const content = stripComments(raw);
  const lines = content.split(/\r?\n/);
  const ctx = {
    inContrastBlock: false,
    selector: "",
    fileHasFocusStyle: /:focus-visible|focus-visible:|focus:ring|focus:outline-(?!none)/.test(content),
  };
  let depth = 0;
  let blockDepth = -1;
  let skipNext = false;

  lines.forEach((line, i) => {
    const rawLine = rawLines[i] ?? "";
    if (hasStyle) {
      if (blockDepth < 0 && CONTRAST_BLOCK_RE.test(line)) blockDepth = depth;
      const open = line.indexOf("{");
      if (open >= 0 && !line.trimStart().startsWith("@")) ctx.selector = line.slice(0, open);
      for (const ch of line) {
        if (ch === "{") depth++;
        else if (ch === "}") { depth--; if (blockDepth >= 0 && depth <= blockDepth) blockDepth = -1; }
      }
      ctx.inContrastBlock = blockDepth >= 0 || CONTRAST_BLOCK_RE.test(line);
    }

    const ignored = skipNext || rawLine.includes(IGNORE);
    skipNext = rawLine.includes(IGNORE + "-next-line");
    if (ignored || line.length > 4000) return;

    const reported = new Set();
    for (const c of LINE_CHECKS) {
      if (c.markupOnly && isStyle) continue;
      if (reported.has(c.check)) continue;
      const m = c.re.exec(line);
      if (!m || (c.skip && c.skip(line))) continue;
      const severity = typeof c.severity === "function" ? c.severity(m, ctx, line) : c.severity;
      if (!severity) continue;
      reported.add(c.check);
      push(findings, c.check, severity, rel, i + 1, snippet(line, m), c.detail ? c.detail(m, ctx) : "", m[0].trim().slice(0, 80));
    }
  });

  // Tags can span lines, so these run on the whole file.
  const videoRe = /<video(?=[^>]*\bautoplay\b)(?![^>]*\bcontrols\b)[^>]*>/gi;
  let vm;
  while ((vm = videoRe.exec(content))) {
    const line = lineOf(content, vm.index);
    if ((rawLines[line - 1] || "").includes(IGNORE)) continue;
    push(findings, "autoplayVideo", "error", rel, line, vm[0].replace(/\s+/g, " ").slice(0, 160), "", "autoplay without controls");
  }

  if (hasStyle && /backdrop-filter:\s*(?!none)/.test(content) && !/prefers-reduced-transparency/.test(content)) {
    const line = lineOf(content, content.search(/backdrop-filter:\s*(?!none)/));
    if (!(rawLines[line - 1] || "").includes(IGNORE))
      push(findings, "unguardedBlur", "note", rel, line, (lines[line - 1] || "").trim().slice(0, 160), "", "backdrop-filter");
  }

  const motionAt = hasStyle ? content.search(MOTION_RE) : -1;
  return {
    rel, hasStyle,
    isHtml: (ext === ".html" || ext === ".htm") && /<head[\s>]/i.test(content),
    hasMotion: motionAt >= 0,
    motionLine: motionAt >= 0 ? lineOf(content, motionAt + 1) : 0,
    hasReduced: REDUCED_RE.test(content),
    hasColorScheme: COLOR_SCHEME_RE.test(content) || COLOR_SCHEME_META_RE.test(content),
    hasColorSchemeMeta: COLOR_SCHEME_META_RE.test(content),
    hasDark: DARK_RE.test(content),
  };
}

function audit(target) {
  const root = resolve(target);
  const files = walk(root);
  const base = statSync(root).isFile() ? resolve(root, "..") : root;
  const findings = [];
  const facts = [];
  let scanned = 0;

  for (const file of files) {
    let content;
    try { content = readFileSync(file, "utf8"); } catch { continue; }
    if (content.includes(IGNORE + "-file")) continue;
    scanned++;
    facts.push(auditFile(file, relative(base, file) || file, content, findings));
  }

  const styled = facts.filter((f) => f.hasStyle);
  const anyReduced = facts.some((f) => f.hasReduced);
  for (const f of styled) {
    if (!f.hasMotion || f.hasReduced) continue;
    push(findings, "noReducedGuard", anyReduced ? "note" : "error", f.rel, f.motionLine,
      "(animation or transition with no prefers-reduced-motion query in this file)",
      anyReduced ? "Another file handles reduced motion. Confirm it covers this one." : "", "");
  }
  if (styled.length && !facts.some((f) => f.hasColorScheme))
    push(findings, "noColorScheme", "warning", styled[0].rel, 1, "(no file declares color-scheme)");
  else if (facts.some((f) => f.isHtml) && !facts.some((f) => f.hasColorSchemeMeta))
    push(findings, "noColorSchemeMeta", "note", facts.find((f) => f.isHtml).rel, 1, "(no color-scheme meta tag found)");
  if (styled.length && !facts.some((f) => f.hasDark))
    push(findings, "singleScheme", "note", styled[0].rel, 1, "(no dark or light variant found)");

  const order = { error: 0, warning: 1, note: 2 };
  findings.sort((a, b) => order[a.severity] - order[b.severity] || a.file.localeCompare(b.file) || a.line - b.line);
  const count = (s) => findings.filter((f) => f.severity === s).length;
  return {
    tool: "easy-on-the-eyes", version: VERSION, path: target, filesScanned: scanned,
    summary: { errors: count("error"), warnings: count("warning"), notes: count("note") },
    findings,
    notVerified: [
      "Contrast of each real text and background pair, including text over images and gradients",
      "Whether small text is body copy or a short label",
      "Line length in the rendered layout",
      "Flash rate of animations and video",
      "Brightness jumps between sections and white embeds inside dark themes",
      "Layout shift during load",
      "Whether state is carried by color alone",
      "JavaScript-driven animation that ignores reduced motion",
      "Sizes set in em, percentages or the font shorthand, and stripes built from background-size",
    ],
  };
}

// ---------- output ----------

function printText(result) {
  const out = [];
  out.push(`Easy on the Eyes audit: ${result.path}`);
  out.push(`${result.filesScanned} files scanned. ${result.summary.errors} errors, ${result.summary.warnings} warnings, ${result.summary.notes} notes.`);
  for (const [sev, title] of [["error", "Errors"], ["warning", "Warnings"], ["note", "Notes"]]) {
    const group = result.findings.filter((f) => f.severity === sev);
    if (!group.length) continue;
    out.push("", `${title} (${group.length})`);
    for (const f of group) {
      out.push(`  ${f.file}:${f.line}  ${f.rule}  [${f.grade}]${f.match ? `  matched: ${f.match}` : ""}`);
      out.push(`    ${f.source}`);
      out.push(`    Why: ${f.why}`);
      out.push(`    Fix: ${f.fix}`);
    }
  }
  out.push("", "Not verified (needs a rendered page or a human eye)");
  for (const n of result.notVerified) out.push(`  - ${n}`);
  console.log(out.join("\n"));
}

function usage(code) {
  console.error([
    "Usage:",
    "  node audit.mjs <path> [--json] [--strict]",
    "  node audit.mjs contrast <foreground> <background> [--min 4.5] [--json]",
    "",
    "  --strict   exit 1 on warnings as well as errors",
    "  --min      ratio the pair must meet for exit 0 (use 3 for large text and UI parts)",
    "",
    "Colors accept hex, rgb(), hsl(), oklch(), white and black. Quote them in the shell.",
    "To skip a line, add a comment containing easy-on-the-eyes-ignore, or",
    "easy-on-the-eyes-ignore-next-line on the line before it. To skip a whole file,",
    "put easy-on-the-eyes-ignore-file anywhere in it.",
  ].join("\n"));
  process.exit(code);
}

function main() {
  const argv = process.argv.slice(2);
  let min = 4.5;
  const args = [];
  const flags = new Set();
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--min") { min = parseFloat(argv[++i]); if (!(min > 0)) usage(2); }
    else if (argv[i].startsWith("--")) flags.add(argv[i]);
    else args.push(argv[i]);
  }
  if (flags.has("--help")) usage(0);

  if (args[0] === "contrast") {
    if (args.length !== 3) usage(2);
    const report = contrastReport(args[1], args[2], min);
    if (!report) { console.error("Could not parse one of the colors. Use hex, rgb(), hsl(), oklch(), white or black."); process.exit(2); }
    if (flags.has("--json")) console.log(JSON.stringify(report, null, 2));
    else {
      const p = (ok) => (ok ? "pass" : "fail");
      console.log(`${report.foreground} on ${report.background}: ${report.ratio.toFixed(2)}:1 (${report.polarity})`);
      console.log(`  body text 4.5:1: ${p(report.pass.bodyText)}   large text and UI 3:1: ${p(report.pass.largeTextAndUi)}   AAA 7:1: ${p(report.pass.enhancedAAA)}`);
      for (const n of report.notes) console.log(`  ${n}`);
    }
    process.exit(report.pass.meetsMin ? 0 : 1);
  }

  if (args.length !== 1) usage(2);
  const target = args[0];
  if (!existsSync(target)) { console.error(`Path not found: ${target} (paths are relative to the current directory)`); process.exit(2); }
  const result = audit(target);
  if (result.filesScanned === 0) { console.error(`No CSS or markup files found in ${target}.`); process.exit(2); }
  if (flags.has("--json")) console.log(JSON.stringify(result, null, 2));
  else printText(result);
  process.exit(result.summary.errors > 0 || (flags.has("--strict") && result.summary.warnings > 0) ? 1 : 0);
}

main();
