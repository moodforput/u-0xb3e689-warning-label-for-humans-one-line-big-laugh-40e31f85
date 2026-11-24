// Tests for the warning-label entry. Run: node --test test.mjs
// (Node 22.18+; no dependencies.)
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const LINE =
  "WARNING: This human contains strong opinions about things it has never tried and will defend them loudly, in public, until someone Googles it.";

function runOnce(dir) {
  const out = join(dir, "entry.txt");
  const r = spawnSync(process.execPath, ["main.ts"], {
    cwd: new URL(".", import.meta.url).pathname,
    env: { ...process.env, OUTPUT_PATH: out },
    encoding: "utf8",
  });
  assert.equal(r.status, 0, `main.ts exited ${r.status}: ${r.stderr}`);
  return readFileSync(out, "utf8");
}

test("entry is exactly the chosen line, 142 chars, inside the 1-160 gate", () => {
  const text = runOnce(mkdtempSync(join(tmpdir(), "label-")));
  assert.equal(text, LINE);
  assert.equal([...text].length, 142);
  assert.ok([...text].length >= 1 && [...text].length <= 160);
});

test("single line: no newline, no carriage return, no trailing whitespace", () => {
  const text = runOnce(mkdtempSync(join(tmpdir(), "label-")));
  assert.ok(!text.includes("\n") && !text.includes("\r"));
  assert.equal(text, text.trim());
  assert.ok(text.length > 0);
});

test("valid UTF-8, printable ASCII only, no control characters", () => {
  const text = runOnce(mkdtempSync(join(tmpdir(), "label-")));
  const bytes = Buffer.from(text, "utf8");
  assert.equal(bytes.toString("utf8"), text);
  for (const ch of text) {
    assert.ok(ch.codePointAt(0) >= 0x20 && ch.codePointAt(0) < 0x7f, `non-ASCII: ${ch}`);
  }
});

test("label form: opens WARNING: and names 'This human'", () => {
  const text = runOnce(mkdtempSync(join(tmpdir(), "label-")));
  assert.ok(text.startsWith("WARNING: This human"));
});

test("one idea only: a single sentence, no second sentence", () => {
  const text = runOnce(mkdtempSync(join(tmpdir(), "label-")));
  assert.equal(text.split(".").filter((s) => s.trim().length > 0).length, 1);
  assert.ok(text.endsWith("."));
});

test("the turn lands in the last few words", () => {
  const text = runOnce(mkdtempSync(join(tmpdir(), "label-")));
  assert.ok(text.endsWith("until someone Googles it."));
  const words = text.split(" ");
  assert.ok(words.slice(-4).join(" ") === "until someone Googles it.");
});

test("no filler words, no repeated joke", () => {
  const text = runOnce(mkdtempSync(join(tmpdir(), "label-")));
  const words = text.toLowerCase().split(/\W+/).filter(Boolean);
  const seen = new Set();
  for (const w of words) {
    if (["the", "it", "and", "in", "until", "someone"].includes(w)) continue;
    assert.ok(!seen.has(w), `repeated word: ${w}`);
    seen.add(w);
  }
  assert.ok(!/very|really|just|actually|literally/i.test(text));
});

test("uses most of the line without padding: 140-160 chars", () => {
  const text = runOnce(mkdtempSync(join(tmpdir(), "label-")));
  assert.ok([...text].length >= 140 && [...text].length <= 160);
});

test("determinism: two runs produce byte-identical output", () => {
  const d1 = mkdtempSync(join(tmpdir(), "label-"));
  const d2 = mkdtempSync(join(tmpdir(), "label-"));
  const a = runOnce(d1);
  const b = runOnce(d2);
  assert.equal(Buffer.from(a, "utf8").toString("hex"), Buffer.from(b, "utf8").toString("hex"));
  rmSync(d1, { recursive: true, force: true });
  rmSync(d2, { recursive: true, force: true });
});

test("creates a missing output directory", () => {
  const base = mkdtempSync(join(tmpdir(), "label-"));
  const nested = join(base, "deep", "nested");
  const out = join(nested, "entry.txt");
  const r = spawnSync(process.execPath, ["main.ts"], {
    cwd: new URL(".", import.meta.url).pathname,
    env: { ...process.env, OUTPUT_PATH: out },
    encoding: "utf8",
  });
  assert.equal(r.status, 0, r.stderr);
  assert.equal(readFileSync(out, "utf8"), LINE);
  rmSync(base, { recursive: true, force: true });
});

test("default output path is /output/entry.txt when OUTPUT_PATH is unset", () => {
  const env = { ...process.env };
  delete env.OUTPUT_PATH;
  const src = readFileSync(new URL("./main.ts", import.meta.url), "utf8");
  assert.ok(src.includes('"/output/entry.txt"'));
  assert.ok(src.includes("process.env.OUTPUT_PATH"));
});

test("main.ts is dependency-free: only node: builtins imported", () => {
  const src = readFileSync(new URL("./main.ts", import.meta.url), "utf8");
  const imports = [...src.matchAll(/from\s+"([^"]+)"/g)].map((m) => m[1]);
  assert.ok(imports.length > 0);
  assert.ok(imports.every((i) => i.startsWith("node:")), `non-builtin import: ${imports}`);
  assert.ok(!/fetch\(|node:http|node:net|Math\.random|Date\.now/.test(src));
});

test("README carries the three live make.fun badges, LICENSE is MIT, owner.json names the payout wallet", () => {
  const readme = readFileSync(new URL("./README.md", import.meta.url), "utf8");
  const slug = "u-0xb3e689-warning-label-for-humans-one-line-big-laugh-40e31f85";
  assert.ok(readme.includes(`https://make.fun/badge/${slug}.svg`));
  assert.ok(readme.includes(`https://make.fun/badge/${slug}/moodforput/u-0xb3e689-warning-label-for-humans-one-line-big-laugh-40e31f85/rank.svg`));
  assert.ok(readme.includes(`https://make.fun/badge/${slug}/moodforput/u-0xb3e689-warning-label-for-humans-one-line-big-laugh-40e31f85/reward.svg`));
  assert.ok(!readme.includes("{owner}") && !readme.includes("{repo}"));
  const license = readFileSync(new URL("./LICENSE", import.meta.url), "utf8");
  assert.ok(license.startsWith("SPDX-License-Identifier: MIT"));
  const owner = JSON.parse(readFileSync(new URL("./.makefun/owner.json", import.meta.url), "utf8"));
  assert.equal(owner.wallet, "AMhus9S4GqrfGk6chUvWPjbNTc3bCZCs52pQ9eZAURVj");
});
