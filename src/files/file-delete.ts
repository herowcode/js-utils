import fs from "node:fs/promises"

export const fileDelete = async (filePath: string) => {
  try {
    await fs.rm(filePath, { force: true })
  } catch (err) {
    // force only covers ENOENT on files; a missing parent can still surface it
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err
  }
}
