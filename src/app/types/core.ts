export interface SpectrumPoint {
  x: number
  y: number
}

export interface Spectrum {
  id: string
  name: string
  x: number[]
  y: number[]
  meta?: Record<string, unknown>
}

export interface PlotSettings {
  showGrid: boolean
  showAllSpectra: boolean
  reverseOverlayOrder: boolean
  stackOffset: number
  xMin?: number | null
  xMax?: number | null
  yMin?: number | null
  yMax?: number | null
  invertX: boolean
}

export interface BaselineSettings {
  enabled: boolean
  showOverlay: boolean
  lambda: number
  p: number
  iterations: number
}

export interface SmoothingSettings {
  window: number
  polyOrder: number
}

export type ThemeMode = 'system' | 'light' | 'dark'
export type PlotCanvasMode = 'auto' | 'white' | 'dark'

export type GraphicsPalette =
  | 'auto'
  | 'pubBold'
  | 'pubColorblind'
  | 'tolBright'
  | 'tolMuted'
  | 'deepRainbow'
  | 'viridisDark'
  | 'plasmaDark'
  | 'cividisDark'
  | 'colorblind'
  | 'tableau10'
  | 'dark2'
  | 'paired'
  | 'viridis'
  | 'plasma'
  | 'magma'
  | 'cividis'
  | 'electrochem'
  | 'mono'
  | 'neon'

export type GraphicsSettings = {
  xLabel: string
  yLabel: string
  axisLabelBold: boolean
  axisLabelItalic: boolean
  tickLabelBold: boolean
  tickLabelItalic: boolean
  showXTickMarks: boolean
  showYTickMarks: boolean
  spectrumLabelBold: boolean
  spectrumLabelItalic: boolean
  showXTickLabels: boolean
  showYTickLabels: boolean
  showGrid: boolean
  gridColor: string
  gridWidth: number
  previewCanvasSize: boolean
  axisLineWidth: number
  axisLineColor: string
  frameMode: 'open' | 'box'
  traceLineWidth: number
  fontFamily: string
  baseFontSize: number
  tickFontSize: number
  palette: GraphicsPalette
  inlineSpectrumLabels: boolean
  plotCanvas: PlotCanvasMode
  exportWidth: number
  exportHeight: number
}

export interface AppState {
  themeMode: ThemeMode
  spectra: Spectrum[]
  activeSpectrumId?: string
  plot: PlotSettings
  processedYById: Record<string, number[]>
  baselineYById: Record<string, number[]>
  smoothedYById: Record<string, number[]>
  baseline: BaselineSettings
  smoothing: SmoothingSettings
  graphics: GraphicsSettings
}
