import "@testing-library/jest-dom"

// Mock window.location if needed for your YouTube tests; node-environment tests have no window
if (typeof window !== "undefined") {
  Object.defineProperty(window, "location", {
    value: {
      origin: "http://localhost:3000",
    },
    writable: true,
  })
}
