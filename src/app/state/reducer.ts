import type {
  AppState,
  BaselineSettings,
  GraphicsSettings,
  PlotSettings,
  SmoothingSettings,
  Spectrum,
} from '../types/core'

export type Action =
  | { type: 'SPECTRUM_ADD'; spectrum: Spectrum }
  | { type: 'SPECTRUM_SET_ACTIVE'; id: string }
  | { type: 'SPECTRUM_RENAME'; id: string; name: string }
  | {
      type: 'SPECTRUM_SET_PROCESSED'
      id: string
      processedY: number[]
      baselineY: number[]
    }
  | { type: 'SPECTRUM_SET_SMOOTHED_Y'; id: string; smoothedY: number[] }
  | { type: 'SPECTRUM_MOVE'; id: string; direction: 'up' | 'down' }
  | { type: 'SPECTRUM_REMOVE'; id: string }
  | { type: 'SPECTRA_CLEAR' }
  | {
      type: 'SPECTRA_RENAME_ALL'
      prefix: string
      mode?: 'index' | 'sequence'
      start?: number
      step?: number
      suffix?: string
      reverse?: boolean
    }
  | {
      type: 'SPECTRA_RENAME_BY_EXTRACT'
      source: 'filename' | 'name'
      preset: 'mv' | 'firstNumber' | 'lastNumber' | 'regex' | 'slice'
      regex?: string
      group?: number
      sliceStart?: number
      sliceEnd?: number
      trimResult?: boolean
      numbersOnly?: boolean
      prefix: string
      suffix: string
    }
  | { type: 'PLOT_SET'; patch: Partial<PlotSettings> }
  | { type: 'GRAPHICS_SET'; patch: Partial<GraphicsSettings> }
  | { type: 'BASELINE_SET'; patch: Partial<BaselineSettings> }
  | { type: 'BASELINE_RESET_ACTIVE' }
  | { type: 'BASELINE_RESET_ALL' }
  | { type: 'SMOOTHING_SET'; patch: Partial<SmoothingSettings> }
  | { type: 'SMOOTHING_RESET_ACTIVE' }
  | { type: 'SMOOTHING_RESET_ALL' }

function extractTokenFromText(
  text: string,
  action: Extract<Action, { type: 'SPECTRA_RENAME_BY_EXTRACT' }>,
): string | null {
  switch (action.preset) {
    case 'mv': {
      const match = text.match(/(-?\d+(?:[.,]\d+)?)\s*mV/i)
      return match?.[1] ?? null
    }
    case 'firstNumber': {
      const match = text.match(/-?\d+(?:[.,]\d+)?/)
      return match?.[0] ?? null
    }
    case 'lastNumber': {
      const matches = text.match(/-?\d+(?:[.,]\d+)?/g)
      return matches && matches.length > 0
        ? matches[matches.length - 1]
        : null
    }
    case 'regex': {
      try {
        const regex = new RegExp(action.regex ?? '', 'i')
        const match = text.match(regex)
        const groupNumberRaw = Number(action.group)
        const groupNumber =
          Number.isInteger(groupNumberRaw) && groupNumberRaw >= 0
            ? groupNumberRaw
            : 1

        return match?.[groupNumber] ?? null
      } catch {
        return null
      }
    }
    case 'slice': {
      const len = text.length
      const toAbsIndex = (raw: number, fallback: number): number => {
        if (!Number.isFinite(raw)) {
          return fallback
        }

        const value = Math.trunc(raw)
        return value < 0 ? len + value : value
      }

      const startRaw = Number(action.sliceStart)
      const endRaw = Number(action.sliceEnd)
      let start = toAbsIndex(startRaw, 0)
      let end = toAbsIndex(endRaw, len)

      start = Math.max(0, Math.min(len, start))
      end = Math.max(0, Math.min(len, end))

      if (end < start) {
        ;[start, end] = [end, start]
      }

      const raw = text.slice(start, end)
      const result = action.trimResult === false ? raw : raw.trim()
      const out = action.numbersOnly
        ? (result.match(/-?\d+(?:[.,]\d+)?/)?.[0] ?? '')
        : result

      return out.length > 0 ? out : null
    }
  }
}

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SPECTRUM_ADD':
      return {
        ...state,
        spectra: [...state.spectra, action.spectrum],
        activeSpectrumId: action.spectrum.id,
      }
    case 'SPECTRUM_SET_ACTIVE':
      return {
        ...state,
        activeSpectrumId: action.id,
      }
    case 'SPECTRUM_RENAME': {
      const nextName = action.name.trim()

      if (nextName.length === 0) {
        return state
      }

      let hasChanges = false
      const nextSpectra = state.spectra.map((spectrum) => {
        if (spectrum.id !== action.id || spectrum.name === nextName) {
          return spectrum
        }

        hasChanges = true
        return {
          ...spectrum,
          name: nextName,
        }
      })

      if (!hasChanges) {
        return state
      }

      return {
        ...state,
        spectra: nextSpectra,
      }
    }
    case 'SPECTRUM_SET_PROCESSED': {
      const nextSmoothed = { ...state.smoothedYById }
      delete nextSmoothed[action.id]

      return {
        ...state,
        processedYById: {
          ...state.processedYById,
          [action.id]: action.processedY,
        },
        baselineYById: {
          ...state.baselineYById,
          [action.id]: action.baselineY,
        },
        smoothedYById: nextSmoothed,
      }
    }
    case 'SPECTRUM_SET_SMOOTHED_Y':
      return {
        ...state,
        smoothedYById: {
          ...state.smoothedYById,
          [action.id]: action.smoothedY,
        },
      }
    case 'SPECTRUM_MOVE': {
      const sourceIndex = state.spectra.findIndex(
        (spectrum) => spectrum.id === action.id,
      )

      if (sourceIndex < 0) {
        return state
      }

      if (action.direction === 'up' && sourceIndex === 0) {
        return state
      }

      if (
        action.direction === 'down' &&
        sourceIndex === state.spectra.length - 1
      ) {
        return state
      }

      const targetIndex =
        action.direction === 'up' ? sourceIndex - 1 : sourceIndex + 1

      const nextSpectra = [...state.spectra]
      ;[nextSpectra[sourceIndex], nextSpectra[targetIndex]] = [
        nextSpectra[targetIndex],
        nextSpectra[sourceIndex],
      ]

      return {
        ...state,
        spectra: nextSpectra,
      }
    }
    case 'SPECTRUM_REMOVE': {
      const nextSpectra = state.spectra.filter(
        (spectrum) => spectrum.id !== action.id,
      )

      return {
        ...state,
        spectra: nextSpectra,
        activeSpectrumId:
          state.activeSpectrumId === action.id
            ? nextSpectra[0]?.id
            : state.activeSpectrumId,
      }
    }
    case 'SPECTRA_CLEAR':
      return {
        ...state,
        spectra: [],
        activeSpectrumId: undefined,
      }
    case 'SPECTRA_RENAME_ALL': {
      const list = state.spectra
      const prefix = action.prefix.trim()
      const mode = action.mode ?? 'index'
      const reverse = Boolean(action.reverse)
      const startN =
        Number.isFinite(Number(action.start)) ? Number(action.start) : 1
      const stepN =
        Number.isFinite(Number(action.step)) ? Number(action.step) : 1
      const suffix = action.suffix ?? ''
      const nextSpectra = list.map((spectrum, index) => {
        const effectiveIndex = reverse ? list.length - 1 - index : index
        const value =
          mode === 'sequence'
            ? startN + effectiveIndex * stepN
            : effectiveIndex + 1

        return {
          ...spectrum,
          name:
            mode === 'sequence'
              ? `${prefix}${value}${suffix}`
              : prefix
                ? `${prefix}${value}`
                : `${value}`,
        }
      })

      return {
        ...state,
        spectra: nextSpectra,
      }
    }
    case 'SPECTRA_RENAME_BY_EXTRACT': {
      const prefix = action.prefix.trim()
      const suffix = action.suffix ?? ''
      const nextSpectra = state.spectra.map((spectrum) => {
        const sourceText =
          action.source === 'filename'
            ? typeof spectrum.meta?.sourceName === 'string'
              ? spectrum.meta.sourceName
              : ''
            : spectrum.name ?? ''
        const token = extractTokenFromText(sourceText, action)

        if (token === null) {
          return spectrum
        }

        if (action.preset === 'slice') {
          return {
            ...spectrum,
            name: `${prefix}${token}${suffix}`,
          }
        }

        const normalizedToken = token.replace(/,/g, '.')
        const numericValue = Number(normalizedToken)

        if (!Number.isFinite(numericValue)) {
          return spectrum
        }

        const formattedValue =
          Math.abs(numericValue - Math.round(numericValue)) < 1e-9
            ? String(Math.round(numericValue))
            : normalizedToken

        return {
          ...spectrum,
          name: `${prefix}${formattedValue}${suffix}`,
        }
      })

      return {
        ...state,
        spectra: nextSpectra,
      }
    }
    case 'PLOT_SET':
      return {
        ...state,
        plot: {
          ...state.plot,
          ...action.patch,
        },
      }
    case 'GRAPHICS_SET':
      return {
        ...state,
        graphics: {
          ...state.graphics,
          ...action.patch,
        },
      }
    case 'BASELINE_SET':
      return {
        ...state,
        baseline: {
          ...state.baseline,
          ...action.patch,
        },
      }
    case 'BASELINE_RESET_ACTIVE': {
      if (!state.activeSpectrumId) {
        return state
      }

      const nextProcessed = { ...state.processedYById }
      const nextBaseline = { ...state.baselineYById }
      const nextSmoothed = { ...state.smoothedYById }
      delete nextProcessed[state.activeSpectrumId]
      delete nextBaseline[state.activeSpectrumId]
      delete nextSmoothed[state.activeSpectrumId]

      return {
        ...state,
        processedYById: nextProcessed,
        baselineYById: nextBaseline,
        smoothedYById: nextSmoothed,
      }
    }
    case 'BASELINE_RESET_ALL':
      return {
        ...state,
        processedYById: {},
        baselineYById: {},
        smoothedYById: {},
      }
    case 'SMOOTHING_SET':
      return {
        ...state,
        smoothing: {
          ...state.smoothing,
          ...action.patch,
        },
      }
    case 'SMOOTHING_RESET_ACTIVE': {
      if (!state.activeSpectrumId) {
        return state
      }

      const nextSmoothed = { ...state.smoothedYById }
      delete nextSmoothed[state.activeSpectrumId]

      return {
        ...state,
        smoothedYById: nextSmoothed,
      }
    }
    case 'SMOOTHING_RESET_ALL':
      return {
        ...state,
        smoothedYById: {},
      }
  }
}
