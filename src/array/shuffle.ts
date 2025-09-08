export function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    // Get cryptographically strong random values
    const randomBuffer = new Uint32Array(1)
    crypto.getRandomValues(randomBuffer)

    // Use modulo to get a value in our range
    const j = randomBuffer[0] % (i + 1)

    // Swap elements
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}
