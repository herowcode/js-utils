const fs = require("node:fs")
const path = require("node:path")

function renameEsmFiles(dir) {
  const files = fs.readdirSync(dir)

  files.forEach((file) => {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)

    if (stat.isDirectory()) {
      renameEsmFiles(filePath)
    } else if (file.endsWith(".js") && !file.endsWith(".esm.js")) {
      const esmPath = filePath.replace(".js", ".esm.js")
      fs.copyFileSync(filePath, esmPath)
    }
  })
}

// Run after ESM build
const distDir = path.join(__dirname, "..", "dist")
if (fs.existsSync(distDir)) {
  renameEsmFiles(distDir)
  console.log("ESM files renamed successfully")
}
