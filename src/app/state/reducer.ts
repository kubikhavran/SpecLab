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
  | { type: 'PLOT_SET'; patch: Partial<PlotSettings> }
  | { type: 'GRAPHICS_SET'; patch: Partial<GraphicsSettings> }
  | { type: 'BASELINE_SET'; patch: Partial<BaselineSettings> }
  | { type: 'BASELINE_RESET_ACTIVE' }
  | { type: 'BASELINE_RESET_ALL' }
  | { type: 'SMOOTHING_SET'; patch: Partial<SmoothingSettings> }
  | { type: 'SMOOTHING_RESET_ACTIVE' }
  | { type: 'SMOOTHING_RESET_ALL' }

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
