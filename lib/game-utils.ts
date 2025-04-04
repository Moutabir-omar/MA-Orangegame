/**
 * Generates a random game code
 * @returns A 6-character game code
 */
export function generateGameCode(): string {
  const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let result = ""
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return result
}

/**
 * Calculates the variability (standard deviation / mean) of a data set
 * @param data Array of numbers
 * @returns Variability ratio
 */
export function calculateVariability(data: number[]): number {
  if (data.length <= 1) return 1

  const mean = data.reduce((a, b) => a + b, 0) / data.length
  if (mean === 0) return 1

  const variance = data.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / data.length
  return Math.sqrt(variance) / mean
}

/**
 * Generates a random demand value between min and max (inclusive)
 * @param min Minimum demand value
 * @param max Maximum demand value
 * @returns Random demand value
 */
export function generateRandomDemand(min = 2, max = 8): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

