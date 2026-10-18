import type { ICompressImageParams } from "./compress-image"

export async function compressImage(
  _params: ICompressImageParams,
): Promise<File> {
  throw new Error(
    "@herowcode/utils/files: compressImage is not supported in Node.js",
  )
}
