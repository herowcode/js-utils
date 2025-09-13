const fs = require('node:fs')
const path = require('node:path')

const ESM_DIR = path.join(__dirname, '..', 'dist', 'esm')

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(p, files)
    else if (entry.isFile() && p.endsWith('.js')) files.push(p)
  }
  return files
}

function fixFile(file) {
  let src = fs.readFileSync(file, 'utf8')
  // Replace import/export specifiers missing extensions for relative paths
  // e.g., from "./foo" -> from "./foo.js"
  src = src.replace(/(from\s+["'])(\.\.?\/[^"'\n]+?)(["'])/g, (m, a, p, z) => {
    if (/\.(mjs|cjs|js|json)$/.test(p)) return m
    return `${a}${p}.js${z}`
  })
  // Replace dynamic imports import("./foo") -> import("./foo.js")
  src = src.replace(/(import\(\s*["'])(\.\.?\/[^"'\n]+?)(["']\s*\))/g, (m, a, p, z) => {
    if (/\.(mjs|cjs|js|json)$/.test(p)) return m
    return `${a}${p}.js${z}`
  })
  fs.writeFileSync(file, src)
}

if (fs.existsSync(ESM_DIR)) {
  const files = walk(ESM_DIR)
  files.forEach(fixFile)
  console.log(`Fixed ESM import specifiers in ${files.length} files`)
}

