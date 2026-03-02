import type { AppState, ThemeMode } from '../types/core'

const THEME_STORAGE_KEY = 'speclab.theme'

function getInitialThemeMode(): ThemeMode {
  if (typeof window === 'undefined') {
    return 'system'
  }

  try {
    const storedValue = window.localStorage.getItem(THEME_STORAGE_KEY)

    if (
      storedValue === 'system' ||
      storedValue === 'light' ||
      storedValue === 'dark'
    ) {
      return storedValue
    }
  } catch {
    // Fall back to system theme when localStorage is unavailable.
  }

  return 'system'
}

export const initialState: AppState = {
  themeMode: getInitialThemeMode(),
  spectra: [],
  activeSpectrumId: undefined,
  plot: {
    showGrid: true,
    showAllSpectra: false,
    reverseOverlayOrder: false,
    stackOffset: 0,
    xMin: null,
    xMax: null,
    yMin: null,
    yMax: null,
    invertX: false,
  },
  processedYById: {},
  baselineYById: {},
  smoothedYById: {},
  baseline: {
    enabled: false,
    showOverlay: true,
    lambda: 1e6,
    p: 0.01,
    iterations: 10,
  },
  smoothing: {
    window: 11,
    polyOrder: 3,
  },
  graphics: {
    xLabel: 'X',
    yLabel: 'Y',
    axisLabelBold: false,
    axisLabelItalic: false,
    tickLabelBold: false,
    tickLabelItalic: false,
    showXTickMarks: true,
    showYTickMarks: true,
    spectrumLabelBold: false,
    spectrumLabelItalic: false,
    axisLineWidth: 4,
    traceLineWidth: 4,
    fontFamily: 'Arial',
    baseFontSize: 32,
    tickFontSize: 30,
    palette: 'auto',
    exportWidth: 1600,
    exportHeight: 900,
    showXTickLabels: true,
    showYTickLabels: false,
    axisLineColor: '#000000',
    frameMode: 'open',
    showGrid: false,
    gridColor: '#e2e8f0',
    gridWidth: 1,
    inlineSpectrumLabels: true,
    plotCanvas: 'auto',
    previewCanvasSize: false,
  },
}
