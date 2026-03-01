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

export type GraphicsPalette =
  | 'auto'
  | 'colorblind'
  | 'tableau10'
  | 'set2'
  | 'dark2'
  | 'paired'
  | 'accent'
  | 'pastel1'
  | 'pastel2'
  | 'viridis'
  | 'plasma'
  | 'magma'
  | 'cividis'
  | 'mono'
  | 'neon'

export type GraphicsSettings = {
  xLabel: string
  yLabel: string
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
  exportWidth: number
  exportHeight: number
}

export interface AppState {
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
