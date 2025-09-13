const fs = require('node:fs')
const path = require('node:path')

function rewriteEsmImportSpecifiers(dir) {
  if (!fs.existsSync(dir)) return

  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      rewriteEsmImportSpecifiers(full)
      continue
    }

    if (!entry.name.endsWith('.js')) continue

    try {
      let content = fs.readFileSync(full, 'utf8')

      // Only rewrite relative specifiers starting with ./ or ../ inside string literals
      // Add .js extension to specifiers that don't have one, and ensure directory imports map to index.js
      content = content.replace(/(["'`])((?:\.{1,2}\/)\.?[^"'`]+)\1/g, (m, quote, spec) => {
        // preserve node: and absolute file: URLs
        if (!spec.startsWith('./') && !spec.startsWith('../')) return m

        // strip query/hash if present, keep them after extension
        const parts = spec.split(/([?#].*)$/)
        const pathOnly = parts[0]
        const suffix = parts[1] || ''

        // if pathOnly already has an extension (.js, .mjs, .cjs, .json, .wasm), leave as-is
        if (/\.[a-zA-Z0-9]+$/.test(pathOnly)) {
          return `${quote}${pathOnly}${suffix}${quote}`
        }

        // Resolve against current file to see if it's a directory import without trailing slash
        try {
          const fileDir = path.dirname(full)
          const resolved = path.resolve(fileDir, pathOnly)

          if (fs.existsSync(resolved)) {
            const stat = fs.statSync(resolved)
            if (stat.isDirectory()) {
              // map './foo' -> './foo/index.js'
              const specWithIndex = pathOnly.endsWith('/') ? `${pathOnly}index.js` : `${pathOnly}/index.js`
              return `${quote}${specWithIndex}${suffix}${quote}`
            }
            // if the resolved path is a file without extension, prefer adding .js
            if (fs.existsSync(resolved + '.js')) {
              return `${quote}${pathOnly}.js${suffix}${quote}`
            }
          }
        } catch (err) {
          // fallthrough to default behavior
        }

        // directory import (ends with /) -> index.js
        if (pathOnly.endsWith('/')) return `${quote}${pathOnly}index.js${suffix}${quote}`

        // default: add .js
        return `${quote}${pathOnly}.js${suffix}${quote}`
      })

      fs.writeFileSync(full, content, 'utf8')
    } catch (err) {
      console.warn(`Failed to rewrite imports in ${full}: ${err.message}`)
    }
  }
}

// Run after ESM build
const esmDir = path.join(__dirname, '..', 'dist', 'esm')
rewriteEsmImportSpecifiers(esmDir)
console.log('Rewrote ESM import specifiers under', esmDir)
