// Tests for the audit script and the skill's frontmatter. Run: node tests/run.mjs
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const skillDir = join(root, "skills", "easy-on-the-eyes");
const script = join(skillDir, "scripts", "audit.mjs");
let failed = 0;
const check = (name, ok, detail = "") => {
  console.log(`${ok ? "ok  " : "FAIL"} ${name}${ok || !detail ? "" : `\n     ${detail}`}`);
  if (!ok) failed++;
};
const run = (...args) => spawnSync("node", [script, ...args], { encoding: "utf8" });

// --- bad fixture: every rule the script claims to catch ---
const bad = run(join(root, "tests/fixtures/bad"), "--json");
const badJson = JSON.parse(bad.stdout);
check("bad fixture exits 1", bad.status === 1, `status ${bad.status}`);
for (const [rule, severity, file, match] of [
  ["type-rem-zoom", "error", "index.html", "maximum-scale"],
  ["type-rem-zoom", "error", "styles.css", "6vw"],
  ["type-rem-zoom", "error", "styles.css", "calc(2vw + 1vh)"],
  ["motion-autoplay", "error", "index.html", "<marquee"],
  ["motion-autoplay", "error", "index.html", "autoplay without controls"],
  ["motion-reduced", "error", "styles.css"],
  ["theme-focus", "error", "styles.css", "outline: none"],
  ["theme-focus", "error", "styles.css", "outline-style: none"],
  ["contrast-pure-extremes", "warning", "styles.css", "#fff"],
  ["contrast-pure-extremes", "warning", "styles.css", "hsl(0 0% 100%)"],
  ["contrast-pure-extremes", "warning", "index.html", "text-black"],
  ["type-body-size", "warning", "styles.css", "13px"],
  ["type-body-size", "warning", "styles.css", "0.6rem"],
  ["type-body-size", "note", "styles.css", "14px"],
  ["type-body-size", "note", "index.html", "text-xs"],
  ["type-leading", "warning", "styles.css", "1.05"],
  ["type-leading", "warning", "styles.css", "100%"],
  ["type-leading", "warning", "index.html", "leading-none"],
  ["type-weight", "warning", "styles.css", "300"],
  ["type-align", "warning", "styles.css"],
  ["motion-triggers", "warning", "styles.css"],
  ["motion-autoplay", "warning", "styles.css", "infinite"],
  ["motion-autoplay", "note", "index.html", ".gif"],
  ["lum-white-flash", "warning"],
  ["theme-both-schemes", "note"],
  ["theme-preferences", "note", "styles.css"],
  ["pattern-stripes", "note", "styles.css", "repeating-linear-gradient"],
  ["pattern-stripes", "note", "styles.css", "nth-child"],
]) check(`bad page: ${rule} ${severity}${file ? ` in ${file}` : ""}${match ? ` (${match})` : ""}`,
  badJson.findings.some((f) => f.rule === rule && f.severity === severity && (!file || f.file === file) && (!match || f.match.includes(match))));
check("the h1 with line-height 1.2 is not reported", !badJson.findings.some((f) => f.rule === "type-leading" && f.line === 9));
check("every finding has rule, grade, file, line, why and fix",
  badJson.findings.every((f) => f.rule && f.grade && f.file && f.line > 0 && f.why && f.fix));

// --- good fixture: near-miss negatives must stay silent ---
const good = run(join(root, "tests/fixtures/good"), "--json");
const goodJson = JSON.parse(good.stdout);
check("good fixture exits 0", good.status === 0, `status ${good.status}`);
check("good fixture has no findings", goodJson.findings.length === 0,
  goodJson.findings.map((f) => `${f.file}:${f.line} ${f.rule}`).join(", "));

// --- sneaky fixture: comments and look-alike queries must not satisfy project checks ---
const sneaky = JSON.parse(run(join(root, "tests/fixtures/sneaky"), "--json").stdout);
const sn = (rule, file) => sneaky.findings.some((f) => f.rule === rule && (!file || f.file === file));
check("a comment mentioning prefers-reduced-motion does not silence the motion error", sn("motion-reduced", "styles.css"));
check("motion inside an inline <style> block is checked", sn("motion-reduced", "page.html"));
check("prefers-color-scheme does not count as declaring color-scheme", sn("lum-white-flash"));
check("inline style line-height is checked", sn("type-leading", "page.html"));

// --- every rule ID the script reports is in the SKILL.md table ---
const skillText = readFileSync(join(skillDir, "SKILL.md"), "utf8");
const tableIds = new Set([...skillText.matchAll(/^\| `([a-z-]+)` \|/gm)].map((m) => m[1]));
const reported = new Set([...badJson.findings, ...sneaky.findings].map((f) => f.rule));
check("script rule IDs all appear in the SKILL.md table", [...reported].every((id) => tableIds.has(id)),
  [...reported].filter((id) => !tableIds.has(id)).join(", "));

// --- shipped tokens pass the skill's own audit ---
const tokens = run(join(skillDir, "assets"), "--json");
check("assets/tokens.css has no findings", JSON.parse(tokens.stdout).findings.length === 0);

// --- contrast maths against known values ---
const ratio = (fg, bg) => JSON.parse(run("contrast", fg, bg, "--json").stdout).ratio;
for (const [fg, bg, want] of [
  ["#000000", "#ffffff", 21], ["#767676", "#ffffff", 4.54], ["#777777", "#ffffff", 4.47],
  ["#161616", "#ffffff", 18.1], ["#a0a0a0", "#121212", 7.16], ["#b2b2b2", "#121212", 8.83],
  ["oklch(1 0 0 / 12%)", "oklch(0.18 0.01 255)", 1.38], ["hsl(0 0% 46.3%)", "white", 4.54],
  ["oklch(0.5 0.19 255)", "oklch(0.985 0.002 90)", 5.78], ["oklch(0.74 0.13 255)", "oklch(0.18 0.01 255)", 8.14],
  ["oklch(0.62 0.01 255)", "oklch(0.965 0.003 90)", 3.28], ["oklch(0.55 0.01 255)", "oklch(0.26 0.01 255)", 3.2],
  ["oklch(0.24 0.01 255)", "oklch(0.985 0.002 90)", 15.75],
  ["oklch(0.93 0.005 255)", "oklch(0.18 0.01 255)", 15.3],
  ["oklch(0.78 0.01 255)", "oklch(0.18 0.01 255)", 9.39],
  ["rgb(31 35 40)", "#fff", 15.79],
]) { const got = ratio(fg, bg); check(`contrast ${fg} on ${bg} = ${want}`, Math.abs(got - want) < 0.011, `got ${got}`); }
check("contrast exits 1 below 4.5:1", run("contrast", "#777", "#fff").status === 1);
check("contrast exits 0 at or above 4.5:1", run("contrast", "#767676", "#fff").status === 0);
check("contrast exits 2 on an unparseable color", run("contrast", "nope", "#fff").status === 2);
check("missing path exits 2", run("does-not-exist").status === 2);
check("contrast --min 3 exits 0 for a 3:1 UI pair", run("contrast", "#777", "#fff", "--min", "3").status === 0);
check("a folder with no CSS or markup exits 2", run(join(root, "docs")).status === 2);
check("no path exits 2", run().status === 2);
check("the script does not report on itself", run(join(skillDir, "scripts")).status === 2);
check("a translucent dark overlay is not a pure-black finding", !goodJson.findings.length);

// --- frontmatter against the Agent Skills spec ---
const md = readFileSync(join(skillDir, "SKILL.md"), "utf8");
const fm = md.match(/^---\n([\s\S]*?)\n---\n/);
check("SKILL.md has frontmatter", !!fm);
const front = fm ? fm[1] : "";
const name = (front.match(/^name:\s*(.+)$/m) || [])[1]?.trim();
const description = (front.match(/^description:\s*(.+)$/m) || [])[1]?.trim() ?? "";
check("name matches the directory", name === "easy-on-the-eyes");
check("name is valid", /^[a-z0-9]+(-[a-z0-9]+)*$/.test(name ?? "") && name.length <= 64 && !/claude|anthropic/.test(name));
check("description is 1 to 1024 characters", description.length > 0 && description.length <= 1024, `${description.length}`);
const allowed = new Set(["name", "description", "license", "compatibility", "metadata", "allowed-tools"]);
const keys = [...front.matchAll(/^([a-z-]+):/gm)].map((m) => m[1]);
check("only spec frontmatter keys are used", keys.every((k) => allowed.has(k)), keys.join(", "));
const body = md.slice(fm ? fm[0].length : 0);
check("SKILL.md body is under 500 lines", body.split("\n").length < 500, `${body.split("\n").length}`);

// --- every file SKILL.md points to exists ---
const refs = [...md.matchAll(/`((?:references|scripts|assets)\/[\w.-]+)`/g)].map((m) => m[1]);
const present = new Set(["references", "scripts", "assets"].flatMap((d) => readdirSync(join(skillDir, d)).map((f) => `${d}/${f}`)));
check("every referenced file exists", refs.length > 0 && refs.every((r) => present.has(r)), refs.filter((r) => !present.has(r)).join(", "));

// --- house style: no em dashes anywhere in shipped text ---
const texts = [join(root, "README.md"), join(skillDir, "SKILL.md"), ...readdirSync(join(skillDir, "references")).map((f) => join(skillDir, "references", f))];
check("no em dashes in shipped prose", texts.every((f) => { try { return !readFileSync(f, "utf8").includes("—"); } catch { return true; } }));

console.log(failed ? `\n${failed} check(s) failed` : "\nAll checks passed");
process.exit(failed ? 1 : 0);
