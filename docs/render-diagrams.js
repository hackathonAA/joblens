#!/usr/bin/env node
/**
 * Extracts all Mermaid code blocks from docs/architecture.md
 * and renders each one as a PNG using @mermaid-js/mermaid-cli.
 *
 * Prerequisites:
 *   npm install -g @mermaid-js/mermaid-cli
 *
 * Usage:
 *   node docs/render-diagrams.js
 *
 * Output files are written to docs/diagrams/
 */

const fs = require("fs")
const path = require("path")
const { execSync } = require("child_process")

const src = fs.readFileSync(path.join(__dirname, "architecture.md"), "utf8")
const outDir = path.join(__dirname, "diagrams")
fs.mkdirSync(outDir, { recursive: true })

// Extract all ```mermaid ... ``` blocks
const blockRe = /```mermaid\n([\s\S]*?)```/g
let match
let index = 0

while ((match = blockRe.exec(src)) !== null) {
  index++
  const diagram = match[1].trim()

  // Derive a name from the first line (e.g. "flowchart TD" → "flowchart")
  const firstWord = diagram.split(/\s+/)[0].replace(/[^a-zA-Z0-9_-]/g, "")
  const name = `${String(index).padStart(2, "0")}-${firstWord}`
  const mmdPath = path.join(outDir, `${name}.mmd`)
  const pngPath = path.join(outDir, `${name}.png`)

  fs.writeFileSync(mmdPath, diagram)

  console.log(`Rendering ${name}...`)
  try {
    execSync(
      `mmdc -i "${mmdPath}" -o "${pngPath}" -t dark -b "#0f0f0f" --width 1600`,
      { stdio: "inherit" }
    )
    console.log(`  → ${pngPath}`)
  } catch {
    console.error(`  ✗ Failed to render ${name}. Is @mermaid-js/mermaid-cli installed?`)
    console.error(`    Run: npm install -g @mermaid-js/mermaid-cli`)
  }
}

console.log(`\nDone. ${index} diagram(s) processed → docs/diagrams/`)
