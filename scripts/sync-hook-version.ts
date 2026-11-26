// Run by `npm version` (the "version" script): pins the pre-commit hook to the version being released.
import { readFileSync, writeFileSync } from "node:fs";

const version = JSON.parse(readFileSync("package.json", "utf8")).version;
const path = ".pre-commit-hooks.yaml";
const text = readFileSync(path, "utf8");
const next = text.replace(/mandat@\d+\.\d+\.\d+/g, `mandat@${version}`);
if (next === text && !text.includes(`mandat@${version}`)) throw new Error(`${path}: no mandat@<version> to update`);
writeFileSync(path, next);
