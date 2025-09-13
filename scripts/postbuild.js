const fs = require('node:fs')
const path = require('node:path')

const ROOT = path.join(__dirname, '..')
const CJS_DIR = path.join(ROOT, 'dist', 'cjs')
const ESM_DIR = path.join(ROOT, 'dist', 'esm')

// Subpath entry points we want to expose/compatibilize
const ENTRIES = ['array', 'date', 'files', 'function', 'string', 'youtube']

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

function writeFileIfMissing(file, content) {
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, content, 'utf8')
  }
}

function createCjsStubs() {
  ensureDir(CJS_DIR)
  for (const name of ENTRIES) {
    const targetIndex = path.join(CJS_DIR, name, 'index.js')
    // Only create a flat stub if the real index exists
    if (fs.existsSync(targetIndex)) {
      const stub = path.join(CJS_DIR, `${name}.js`)
      const content = `module.exports = require('./${name}/index.js')\n`
      writeFileIfMissing(stub, content)
    }
  }
}

function createEsmStubs() {
  ensureDir(ESM_DIR)
  for (const name of ENTRIES) {
    const targetIndex = path.join(ESM_DIR, name, 'index.js')
    if (fs.existsSync(targetIndex)) {
      const stub = path.join(ESM_DIR, `${name}.js`)
      const content = `export * from './${name}/index.js'\n`
      writeFileIfMissing(stub, content)
    }
  }
}

createCjsStubs()
createEsmStubs()
console.log('Postbuild: created CJS/ESM flat stubs for sub-entries')
