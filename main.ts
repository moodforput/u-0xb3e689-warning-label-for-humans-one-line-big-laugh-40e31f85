// Warning Label for Humans: One Line, Big Laugh
// Writes one single-line safety warning label for every human being to
// /output/entry.txt. The line is a fixed string: deterministic, no input,
// no randomness, no clock, no network. Runs on Node 22.18+ (grader: 22.23.4).
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

export const ENTRY =
  "WARNING: This human contains strong opinions about things it has never tried and will defend them loudly, in public, until someone Googles it.";

export const MAX_CHARS = 160;

export function outputPath(): string {
  return process.env.OUTPUT_PATH ?? "/output/entry.txt";
}

export function main(): void {
  const path = outputPath();
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, ENTRY, "utf8");
}

main();
