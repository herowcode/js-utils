import '@testing-library/jest-dom'

// Mock window.location if needed for your YouTube tests
Object.defineProperty(window, 'location', {
  value: {
    origin: 'http://localhost:3000',
  },
  writable: true,
})