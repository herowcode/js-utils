/** biome-ignore-all lint/suspicious/noExplicitAny: Manipulation of global functions */
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest"
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
    document.createElement = vi.fn().mockImplementation((tag: string) => {
      if (tag === "canvas") {
        return {
          width: 0,
          height: 0,
          getContext: vi.fn().mockReturnValue({
            drawImage: vi.fn(),
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
      public readAsDataURL = vi.fn(() => {
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

  it("rejects if file type is not allowed", async () => {
    const file = createMockFile("image/gif", "anim.gif")
    await expect(compressImage({ file })).rejects.toThrow(
      "Image format not supported",
    )
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
    document.createElement = vi.fn().mockImplementation((tag: string) => {
      if (tag === "canvas") {
        return {
          width: 0,
          height: 0,
          getContext: vi.fn().mockReturnValue(null),
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
    document.createElement = vi.fn().mockImplementation((tag: string) => {
      if (tag === "canvas") {
        return {
          width: 0,
          height: 0,
          getContext: vi.fn().mockReturnValue({
            drawImage: vi.fn(),
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

describe("compressImage failure and scaling", () => {
  const file = new File(["x"], "pic.png", { type: "image/png" })
  const realCreateElement = document.createElement
  let canvas: { width: number; height: number }
  let readerBehavior: "load" | "error" | "abort"
  let imageBehavior: "load" | "error"
  let imageSize: { width: number; height: number }
  let getContext: () => unknown

  beforeEach(() => {
    canvas = { width: 0, height: 0 }
    readerBehavior = "load"
    imageBehavior = "load"
    imageSize = { width: 100, height: 100 }
    getContext = () => ({ drawImage: vi.fn() })

    document.createElement = vi.fn().mockImplementation((tag: string) => {
      if (tag !== "canvas") return realCreateElement.call(document, tag)
      return Object.assign(canvas, {
        getContext: () => getContext(),
        toBlob: (cb: (blob: Blob | null) => void) => cb(new Blob(["c"])),
      })
    })

    class FakeReader {
      onload: ((e: any) => void) | null = null
      onerror: (() => void) | null = null
      onabort: (() => void) | null = null
      readAsDataURL() {
        setTimeout(() => {
          if (readerBehavior === "load") {
            this.onload?.({ target: { result: "data:image/png;base64,xx" } })
          } else if (readerBehavior === "error") this.onerror?.()
          else this.onabort?.()
        }, 0)
      }
    }
    class FakeImage {
      onload: (() => void) | null = null
      onerror: (() => void) | null = null
      get width() {
        return imageSize.width
      }
      get height() {
        return imageSize.height
      }
      set src(_v: string) {
        setTimeout(() => {
          if (imageBehavior === "load") this.onload?.()
          else this.onerror?.()
        }, 0)
      }
    }
    vi.stubGlobal("FileReader", FakeReader)
    vi.stubGlobal("Image", FakeImage)
  })

  afterEach(() => {
    document.createElement = realCreateElement
    vi.unstubAllGlobals()
  })

  it("rejects when the file reader errors", async () => {
    readerBehavior = "error"
    await expect(compressImage({ file })).rejects.toThrow()
  })

  it("rejects when the file reader aborts", async () => {
    readerBehavior = "abort"
    await expect(compressImage({ file })).rejects.toThrow()
  })

  it("rejects when the image fails to decode", async () => {
    imageBehavior = "error"
    await expect(compressImage({ file })).rejects.toThrow()
  })

  it("rejects instead of throwing when drawing fails", async () => {
    getContext = () => {
      throw new Error("canvas exploded")
    }
    await expect(compressImage({ file })).rejects.toThrow("canvas exploded")
  })

  it("scales so both maxWidth and maxHeight hold", async () => {
    imageSize = { width: 2000, height: 1000 }
    await compressImage({ file, maxWidth: 500, maxHeight: 200 })
    expect(canvas.width).toBe(400)
    expect(canvas.height).toBe(200)
  })

  it("scales a portrait image by maxWidth", async () => {
    imageSize = { width: 600, height: 800 }
    await compressImage({ file, maxWidth: 300 })
    expect(canvas.width).toBe(300)
    expect(canvas.height).toBe(400)
  })

  it("never upscales", async () => {
    imageSize = { width: 100, height: 50 }
    await compressImage({ file, maxWidth: 1000, maxHeight: 1000 })
    expect(canvas.width).toBe(100)
    expect(canvas.height).toBe(50)
  })
})
