import type { YAxisMode } from '../../app/types/core'

/**
 * Apply display-level Y-axis conversion.
 *
 * - 'as-loaded'      -> no change
 * - 'absorbance'     -> treats input as %T (0-100) and converts to Absorbance
 * - 'transmittance'  -> treats input as Absorbance and converts to %T (0-100)
 *
 * The original array is never mutated; a new array is returned.
 */
export function convertYAxis(y: number[], mode: YAxisMode): number[] {
  if (mode === 'as-loaded') {
    return y
  }

  if (mode === 'absorbance') {
    // %T -> Absorbance: A = 2 - log10(%T)
    // Clamp %T to a small positive value to avoid log(0) or log(negative)
    return y.map((v) => {
      const clamped = Math.max(v, 0.001)
      return 2 - Math.log10(clamped)
    })
  }

  if (mode === 'transmittance') {
    // Absorbance -> %T: %T = 100 × 10^(-A)
    return y.map((v) => 100 * Math.pow(10, -v))
  }

  return y
}
