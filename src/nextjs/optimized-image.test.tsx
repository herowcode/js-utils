import { act, fireEvent, render, screen } from "@testing-library/react"
import { describe, beforeEach, expect, it, vi } from "vitest"
import { OptimizedImage } from "./optimized-image"

// Mock next/image to a plain <img> so tests run without the Next.js runtime
vi.mock("next/image", () => ({
  default: vi.fn(
    ({
      src,
      alt,
      onLoad,
      onError,
      className,
      width,
      height,
    }: {
      src: string
      alt: string
      onLoad?: React.ReactEventHandler<HTMLImageElement>
      onError?: React.ReactEventHandler<HTMLImageElement>
      className?: string
      width?: number
      height?: number
    }) => (
      <img
        src={src}
        alt={alt}
        onLoad={onLoad}
        onError={onError}
        className={className}
        width={width}
        height={height}
      />
    ),
  ),
}))

// IntersectionObserver mock
let observerCallback: (entries: Partial<IntersectionObserverEntry>[]) => void =
  () => {}

beforeEach(() => {
  observerCallback = () => {}
  window.IntersectionObserver = vi.fn((callback) => {
    observerCallback = callback as typeof observerCallback
    return {
      observe: vi.fn(),
      disconnect: vi.fn(),
      unobserve: vi.fn(),
      root: null,
      rootMargin: "",
      thresholds: [],
      takeRecords: () => [],
    }
  }) as unknown as typeof IntersectionObserver
})

describe("OptimizedImage", () => {
  describe("container dimensions", () => {
    it("sets pixel dimensions from numeric width/height", () => {
      const { container } = render(
        <OptimizedImage src="/img.jpg" alt="test" width={200} height={100} />,
      )
      const div = container.firstChild as HTMLElement
      expect(div.style.width).toBe("200px")
      expect(div.style.height).toBe("100px")
    })

    it("sets string dimensions from numeric-string width/height", () => {
      const { container } = render(
        <OptimizedImage src="/img.jpg" alt="test" width="200" height="100" />,
      )
      const div = container.firstChild as HTMLElement
      expect(div.style.width).toBe("200px")
      expect(div.style.height).toBe("100px")
    })

    it("defaults to 100% when width/height are omitted", () => {
      const { container } = render(
        <OptimizedImage src="/img.jpg" alt="test" />,
      )
      const div = container.firstChild as HTMLElement
      expect(div.style.width).toBe("100%")
      expect(div.style.height).toBe("100%")
    })
  })

  describe("skeleton loader", () => {
    it("shows skeleton while loading (lazyLoad=false renders image immediately)", () => {
      const { container } = render(
        <OptimizedImage src="/img.jpg" alt="test" lazyLoad={false} />,
      )
      // Skeleton is the pulse div
      const skeleton = container.querySelector(".animate-pulse")
      expect(skeleton).toBeInTheDocument()
    })

    it("hides skeleton and shows image after load event fires", () => {
      const { container } = render(
        <OptimizedImage src="/img.jpg" alt="test" lazyLoad={false} />,
      )
      const img = screen.getByRole("img")
      // Image starts with opacity-0
      expect(img.className).toContain("opacity-0")

      fireEvent.load(img)

      // Skeleton gone, image visible
      expect(container.querySelector(".animate-pulse")).not.toBeInTheDocument()
      expect(img.className).toContain("opacity-100")
    })
  })

  describe("lazy loading (IntersectionObserver)", () => {
    it("does not render the image before entering the viewport", () => {
      render(<OptimizedImage src="/img.jpg" alt="lazy" />)
      expect(screen.queryByRole("img")).not.toBeInTheDocument()
    })

    it("renders the image after the observer fires", () => {
      render(<OptimizedImage src="/img.jpg" alt="lazy" />)
      expect(screen.queryByRole("img")).not.toBeInTheDocument()

      act(() => {
        observerCallback([{ isIntersecting: true } as IntersectionObserverEntry])
      })

      expect(screen.getByRole("img")).toBeInTheDocument()
    })

    it("renders the image immediately when lazyLoad=false", () => {
      render(<OptimizedImage src="/img.jpg" alt="eager" lazyLoad={false} />)
      expect(screen.getByRole("img")).toBeInTheDocument()
    })
  })

  describe("error state", () => {
    it("shows the default fallback text on image error", () => {
      render(<OptimizedImage src="/bad.jpg" alt="broken" lazyLoad={false} />)
      fireEvent.error(screen.getByRole("img"))
      expect(
        screen.getByText("Falha ao carregar a imagem"),
      ).toBeInTheDocument()
      expect(screen.queryByRole("img")).not.toBeInTheDocument()
    })

    it("shows a custom fallbackText on image error", () => {
      render(
        <OptimizedImage
          src="/bad.jpg"
          alt="broken"
          lazyLoad={false}
          fallbackText="Image unavailable"
        />,
      )
      fireEvent.error(screen.getByRole("img"))
      expect(screen.getByText("Image unavailable")).toBeInTheDocument()
    })
  })

  describe("callbacks & props", () => {
    it("calls the onLoad prop when the image loads", () => {
      const handleLoad = vi.fn()
      render(
        <OptimizedImage
          src="/img.jpg"
          alt="test"
          lazyLoad={false}
          onLoad={handleLoad}
        />,
      )
      fireEvent.load(screen.getByRole("img"))
      expect(handleLoad).toHaveBeenCalledTimes(1)
    })

    it("appends the custom className to the image", () => {
      render(
        <OptimizedImage
          src="/img.jpg"
          alt="test"
          lazyLoad={false}
          className="my-custom-class"
        />,
      )
      const img = screen.getByRole("img")
      expect(img.className).toContain("my-custom-class")
    })

    it("uses /placeholder.svg when src is falsy", () => {
      render(
        <OptimizedImage
          src={"" as unknown as string}
          alt="test"
          lazyLoad={false}
        />,
      )
      expect(screen.getByRole("img")).toHaveAttribute("src", "/placeholder.svg")
    })
  })
})
