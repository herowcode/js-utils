/** biome-ignore-all lint/suspicious/noExplicitAny: Manipulation of global functions */
import { compressImage } from "./compress-image"

describe("compressImage", () => {
  function createMockFile(type = "image/jpeg", name = "test.jpg") {
    const blob = new Blob(["dummy content"], { type })
    return new File([blob], name, { type })
  }

  let originalCreateElement: typeof document.createElement
  let originalFileReader: typeof FileReader

  beforeAll(() => {
    originalCreateElement = document.createElement
    document.createElement = jest.fn().mockImplementation((tag: string) => {
      if (tag === "canvas") {
        return {
          width: 0,
          height: 0,
          getContext: jest.fn().mockReturnValue({
            drawImage: jest.fn(),
          }),
          toBlob: (
            cb: (blob: Blob | null) => void,
            type: string,
            _quality: number,
          ) => {
            cb(new Blob(["compressed"], { type }))
          },
        }
      }
      return originalCreateElement.call(document, tag)
    })

    // Mock FileReader
    originalFileReader = (global as any).FileReader
    class MockFileReader {
      public onload:
        | ((this: FileReader, ev: ProgressEvent<FileReader>) => any)
        | null = null
      public readAsDataURL = jest.fn(() => {
        setTimeout(() => {
          if (this.onload) {
            this.onload.call(
              this as any,
              {
                target: { result: "data:image/jpeg;base64,xyz" },
              } as any,
            )
          }
        }, 0)
      })
    }
    ;(global as any).FileReader = MockFileReader
  })

  afterAll(() => {
    document.createElement = originalCreateElement
    ;(global as any).FileReader = originalFileReader
  })

  it("compresses a supported image file and returns a File", async () => {
    const originalImage = (global as any).Image
    class MockImage {
      public width = 100
      public height = 100
      public onload: (() => void) | null = null
      set src(_src: string) {
        setTimeout(() => {
          if (this.onload) this.onload()
        }, 0)
      }
    }
    ;(global as any).Image = MockImage

    const file = createMockFile("image/jpeg", "photo.jpg")
    const result = await compressImage({ file })

    expect(result).toBeInstanceOf(File)
    expect(result.type).toBe("image/webp")
    expect(result.name.endsWith(".webp")).toBe(true)

    ;(global as any).Image = originalImage
  })

  it("throws if file type is not allowed", () => {
    const file = createMockFile("image/gif", "anim.gif")
    expect(() => compressImage({ file })).toThrow("Image format not supported")
  })

  it("resolves if file type is allowed via allowedFileTypes", async () => {
    // Mock Image and canvas for this test
    const originalImage = (global as any).Image
    class MockImage {
      public width = 100
      public height = 100
      public onload: (() => void) | null = null
      set src(_src: string) {
        setTimeout(() => {
          if (this.onload) this.onload()
        }, 0)
      }
    }
    ;(global as any).Image = MockImage

    const file = createMockFile("image/gif", "anim.gif")
    const result = await compressImage({
      file,
      allowedFileTypes: ["image/gif"],
    })
    expect(result).toBeInstanceOf(File)
    expect(result.type).toBe("image/webp")
    expect(result.name.endsWith(".webp")).toBe(true)

    ;(global as any).Image = originalImage
  })

  it("respects maxWidth and maxHeight", async () => {
    const originalImage = (global as any).Image
    class MockImage {
      public width = 2000
      public height = 1000
      public onload: (() => void) | null = null
      set src(_src: string) {
        setTimeout(() => {
          if (this.onload) this.onload()
        }, 0)
      }
    }
    ;(global as any).Image = MockImage

    const file = createMockFile("image/jpeg", "big.jpg")
    await compressImage({ file, maxWidth: 500, maxHeight: 500 })

    ;(global as any).Image = originalImage
  })

  it("rejects if canvas context is null", async () => {
    // Override canvas mock to return null context
    const prevCreateElement = document.createElement
    document.createElement = jest.fn().mockImplementation((tag: string) => {
      if (tag === "canvas") {
        return {
          width: 0,
          height: 0,
          getContext: jest.fn().mockReturnValue(null),
        }
      }
      return prevCreateElement.call(document, tag)
    })

    // Mock Image for this test
    const originalImage = (global as any).Image
    class MockImage {
      public width = 100
      public height = 100
      public onload: (() => void) | null = null
      set src(_src: string) {
        setTimeout(() => {
          if (this.onload) this.onload()
        }, 0)
      }
    }
    ;(global as any).Image = MockImage

    const file = createMockFile("image/jpeg", "fail.jpg")
    await expect(compressImage({ file })).rejects.toThrow(
      "Failed to get canvas context",
    )

    document.createElement = originalCreateElement
    ;(global as any).Image = originalImage
  })

  it("rejects if toBlob returns null", async () => {
    // Override canvas mock to return null blob
    const prevCreateElement = document.createElement
    document.createElement = jest.fn().mockImplementation((tag: string) => {
      if (tag === "canvas") {
        return {
          width: 0,
          height: 0,
          getContext: jest.fn().mockReturnValue({
            drawImage: jest.fn(),
          }),
          toBlob: (cb: (blob: Blob | null) => void) => {
            cb(null)
          },
        }
      }
      return prevCreateElement.call(document, tag)
    })

    const originalImage = (global as any).Image
    class MockImage {
      public width = 100
      public height = 100
      public onload: (() => void) | null = null
      set src(_src: string) {
        setTimeout(() => {
          if (this.onload) this.onload()
        }, 0)
      }
    }
    ;(global as any).Image = MockImage

    const file = createMockFile("image/jpeg", "fail2.jpg")
    await expect(compressImage({ file })).rejects.toThrow(
      "Failed to compress image.",
    )

    ;(global as any).Image = originalImage
    document.createElement = originalCreateElement
  })
})
