import fs from "node:fs/promises"
import { fileExists } from "./file-exists"

export const fileDelete = async (filePath: string) => {
  try {
    if (await fileExists(filePath)) await fs.rm(filePath)
  } catch (err) {
    // Log but don't throw during cleanup
    console.error(`Error deleting file at ${filePath}:`, err)
  }
}
