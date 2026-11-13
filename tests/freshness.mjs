// Compares what the skill's docs assume (tests/verified.json) with live data.
// Run: node tests/freshness.mjs   Exit 1 when something has moved and the docs need a review.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const verified = JSON.parse(readFileSync(join(here, "verified.json"), "utf8"));
const get = async (url) => { const r = await fetch(url, { redirect: "follow" }); if (!r.ok) throw new Error(`${url}: ${r.status}`); return r.json(); };
const drift = [];

const data = await get("https://unpkg.com/web-features/data.json");
const features = data.features ?? data;
for (const [id, want] of Object.entries(verified.features)) {
  const f = features[id];
  if (!f) { drift.push(`${id}: no longer in the web-features dataset`); continue; }
  const s = f.status ?? {};
  const got = { baseline: s.baseline ?? false, firefox: s.support?.firefox ?? null, safari: s.support?.safari ?? null };
  for (const k of Object.keys(want)) if (String(got[k]) !== String(want[k])) drift.push(`${id}: ${k} was ${want[k]}, now ${got[k]}`);
}
for (const [name, major] of Object.entries(verified.packages)) {
  const { version } = await get(`https://registry.npmjs.org/${name}/latest`);
  if (parseInt(version, 10) !== major) drift.push(`${name}: docs were checked against major ${major}, latest is ${version}`);
}

if (drift.length) {
  console.log(`Changed since ${verified.checkedOn}:\n` + drift.map((d) => `  - ${d}`).join("\n"));
  console.log("\nReview references/theming.md and the framework snippets, then update tests/verified.json.");
  process.exit(1);
}
console.log(`No drift since ${verified.checkedOn}: ${Object.keys(verified.features).length} features and ${Object.keys(verified.packages).length} packages match.`);
