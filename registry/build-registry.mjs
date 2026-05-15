#!/usr/bin/env node

/**
 * build-registry.mjs — Reads the polished .tsx component and produces
 * a shadcn-compatible registry JSON file.
 *
 * Usage:  node registry/build-registry.mjs
 * Output: registry/bahrawy-calendar.json
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const SOURCE = join(__dirname, "bahrawy-calendar.tsx");
const OUTPUT = join(__dirname, "bahrawy-calendar.json");

const content = readFileSync(SOURCE, "utf-8");

const registry = {
  name: "bahrawy-calendar",
  type: "registry:ui",
  dependencies: [
    "bahrawy-calendar",
    "zustand",
    "date-fns",
    "lucide-react",
  ],
  registryDependencies: [
    "button",
    "scroll-area",
    "dialog",
    "input",
    "label",
  ],
  files: [
    {
      path: "ui/bahrawy-calendar.tsx",
      content,
      type: "registry:ui",
    },
  ],
};

writeFileSync(OUTPUT, JSON.stringify(registry, null, 2) + "\n", "utf-8");
console.log(`✓ Registry JSON written to ${OUTPUT}`);
