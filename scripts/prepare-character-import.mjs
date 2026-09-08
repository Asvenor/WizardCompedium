// Generated projections only. The V2 schemas/canonical/analysis records remain owners.
import {
  readFile,
  writeFile,
  mkdir,
  readdir,
  copyFile,
  access,
} from "node:fs/promises";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";
const root = fileURLToPath(new URL("../", import.meta.url));
const v2 = path.resolve(root, "../Wizard_Compendium_V2");
const check = process.argv.includes("--check");
const out = path.join(root, "src/features/character-lab/generated");
const manifest = {};
const hashes = {};
async function source(rel) {
  const raw = await readFile(path.join(v2, rel), "utf8");
  manifest[rel] = createHash("sha256").update(raw).digest("hex");
  return JSON.parse(raw);
}
async function emit(name, value) {
  const text = JSON.stringify(value, null, 2) + "\n";
  hashes[name] = createHash("sha256").update(text).digest("hex");
  if (check) {
    if ((await readFile(path.join(out, name), "utf8")) !== text)
      throw Error(`Stale Character Lab projection: ${name}`);
  } else {
    await mkdir(out, { recursive: true });
    await writeFile(path.join(out, name), text);
  }
}
const hasOwners =
  !process.argv.includes("--standalone") &&
  (await access(path.join(v2, "schemas/character_snapshot.schema.json")).then(
    () => true,
    () => false,
  ));
if (hasOwners) {
  await emit(
    "snapshot.schema.json",
    await source("schemas/character_snapshot.schema.json"),
  );
  const paths = [
    "canonical/classes/class.wizard.core2024.json",
    "canonical/rules/rule.character_advancement.core2024.json",
    "canonical/rules/rule.multiclass_slots.core2024.json",
    "canonical/rules/rule.multiclass_preparation.core2024.json",
    "canonical/rules/rule.spellbook_copying.core2024.json",
    "canonical/rules/rule.scroll_copying.core2024.json",
    "canonical/rules/rule.magic_item_crafting.core2024.json",
    "analysis/decision_rules/decision_rule.opening.pilot_v1.json",
    "analysis/decision_rules/decision_rule.reaction.pilot_v1.json",
    "analysis/decision_rules/decision_rule.escape.pilot_v1.json",
    "analysis/build_foundations/sequence.pure_wizard.v1.json",
  ];
  const owners = {};
  for (const rel of paths) {
    const record = await source(rel);
    owners[record.id] = record;
  }
  await emit("owners.json", owners);
  const spellOwners = [];
  async function walk(dir) {
    for (const entry of await readdir(path.join(v2, dir), {
      withFileTypes: true,
    })) {
      const rel = `${dir}/${entry.name}`;
      if (entry.isDirectory()) await walk(rel);
      else if (entry.name.endsWith(".json")) {
        const r = await source(rel);
        if (r.category === "spell")
          spellOwners.push({
            id: r.id,
            name: r.official_name,
            generation: r.rules_identity.generation,
          });
      }
    }
  }
  await walk("canonical/spells");
  await emit("spell-owners.json", spellOwners);
  await emit("manifest.json", manifest);
  const lock = { ...hashes };
  await emit("projection-lock.json", lock);
} else {
  // A standalone GitHub checkout ships the locked generated projections, not private V2 data.
  const lock = JSON.parse(
    await readFile(path.join(out, "projection-lock.json"), "utf8"),
  );
  for (const [name, hash] of Object.entries(lock))
    if (
      createHash("sha256")
        .update(await readFile(path.join(out, name)))
        .digest("hex") !== hash
    )
      throw Error(`Modified Character Lab projection: ${name}`);
}
if (!check) {
  const assets = path.join(root, "public/character-import");
  await mkdir(assets, { recursive: true });
  await copyFile(
    path.join(root, "node_modules/tesseract.js/dist/worker.min.js"),
    path.join(assets, "worker.min.js"),
  );
  const core = path.join(root, "node_modules/tesseract.js-core");
  for (const name of await readdir(core))
    if (/^tesseract-core.*\.(wasm|js)$/.test(name))
      await copyFile(path.join(core, name), path.join(assets, name));
  await copyFile(
    path.join(
      root,
      "node_modules/@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz",
    ),
    path.join(assets, "eng.traineddata.gz"),
  );
  // Fonts/CMaps are also same-origin: no PDF document URLs or CDN fallbacks.
  for (const folder of ["standard_fonts", "cmaps", "wasm"]) {
    const src = path.join(root, "node_modules/pdfjs-dist", folder);
    await mkdir(path.join(assets, folder), { recursive: true });
    for (const name of await readdir(src))
      await copyFile(path.join(src, name), path.join(assets, folder, name));
  }
}
console.log(
  `Character Lab: ${hasOwners ? Object.keys(manifest).length + " source records checked" : "locked standalone projections verified"}; assets ${check ? "unchanged" : "prepared"}.`,
);
