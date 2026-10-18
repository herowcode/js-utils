export interface ICompressImageParams {
  file: File
  maxWidth?: number
  maxHeight?: number
  quality?: number
  allowedFileTypes?: string[]
}

function convertToWebp(filename: string): string {
  const lastDotIndex = filename.lastIndexOf(".")

  if (lastDotIndex === -1) {
    return `${filename}.webp`
  }

  return `${filename.substring(0, lastDotIndex)}.webp`
}

export async function compressImage({
  file,
  maxWidth = Number.POSITIVE_INFINITY,
  maxHeight = Number.POSITIVE_INFINITY,
  quality = 1,
  allowedFileTypes = ["image/jpg", "image/jpeg", "image/png", "image/webp"],
}: ICompressImageParams): Promise<File> {
  if (!allowedFileTypes.includes(file.type)) {
    throw new Error("Image format not supported")
  }

  return new Promise<File>((resolve, reject) => {
    const reader = new FileReader()

    reader.onerror = () => reject(new Error("Failed to read image file"))
    reader.onabort = () => reject(new Error("Reading image file was aborted"))

    reader.onload = (event) => {
      try {
        const compressed = new Image()

        compressed.onerror = () => reject(new Error("Failed to load image"))
        compressed.onabort = () =>
          reject(new Error("Loading image was aborted"))

        compressed.onload = () => {
          try {
            const canvas = document.createElement("canvas")

            // Single scale factor keeps the aspect ratio within both bounds; never upscale
            const scale = Math.min(
              maxWidth / compressed.width,
              maxHeight / compressed.height,
              1,
            )
            const width = compressed.width * scale
            const height = compressed.height * scale

            canvas.width = width
            canvas.height = height

            const context = canvas.getContext("2d")

            if (!context) {
              reject(new Error("Failed to get canvas context"))
              return
            }

            context.drawImage(compressed, 0, 0, width, height)

            canvas.toBlob(
              (blob) => {
                if (!blob) {
                  reject(new Error("Failed to compress image."))
                  return
                }

                resolve(
                  new File([blob], convertToWebp(file.name), {
                    type: "image/webp",
                    lastModified: Date.now(),
                  }),
                )
              },
              "image/webp",
              quality,
            )
          } catch (error) {
            reject(error)
          }
        }

        compressed.src = event.target?.result as string
      } catch (error) {
        reject(error)
      }
    }

    reader.readAsDataURL(file)
  })
}
