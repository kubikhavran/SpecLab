import { useEffect, type MutableRefObject } from 'react'
import createPlotlyComponent from 'react-plotly.js/factory'
import Plotly from 'plotly.js-dist-min'
import type { Config, Data, Layout, PlotlyHTMLElement } from 'plotly.js'
import { useAppState } from '../../app/state/AppStore'
import type { Spectrum } from '../../app/types/core'
import { getPaletteColors } from '../graphics/palettes'
import { applyTickTextInlineStyles } from './tickTextStyles'

type PlotSeries = {
  id: string
  name: string
  x: number[]
  y: number[]
  isActive: boolean
}

const Plot = createPlotlyComponent(Plotly)

const fallbackX: number[] = [100, 120, 140, 160, 180, 200, 220, 240]
const fallbackY: number[] = [12, 18, 15, 24, 21, 27, 23, 30]
const DEFAULT_COLORWAY = [
  '#1f77b4',
  '#ff7f0e',
  '#2ca02c',
  '#d62728',
  '#9467bd',
  '#8c564b',
  '#e377c2',
  '#7f7f7f',
  '#bcbd22',
  '#17becf',
]

type PlotAreaProps = {
  plotDivRef: MutableRefObject<PlotlyHTMLElement | null>
}

function clampInt(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}

function getRange(values: number[]): { min: number; max: number } {
  if (values.length === 0) {
    return { min: Number.NaN, max: Number.NaN }
  }

  return {
    min: Math.min(...values),
    max: Math.max(...values),
  }
}

function formatRangeValue(value: number): string {
  return Number.isFinite(value) ? value.toString() : 'n/a'
}

function truncateLabel(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text
  }

  return `${text.slice(0, Math.max(0, maxLength - 3))}...`
}

function escapeHtml(str: string): string {
  return str.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case '&':
        return '&amp;'
      case '<':
        return '&lt;'
      case '>':
        return '&gt;'
      case '"':
        return '&quot;'
      case '\'':
        return '&#39;'
      default:
        return char
    }
  })
}

function styleText(
  str: string | undefined,
  bold: boolean,
  italic: boolean,
): string {
  const safe = escapeHtml(str ?? '')
  if (!safe) {
    return safe
  }

  if (bold && italic) {
    return `<b><i>${safe}</i></b>`
  }

  if (bold) {
    return `<b>${safe}</b>`
  }

  if (italic) {
    return `<i>${safe}</i>`
  }

  return safe
}

function isTransparentColor(color: string | undefined): boolean {
  if (!color) {
    return true
  }

  const normalized = color.trim().toLowerCase()
  if (!normalized || normalized === 'transparent') {
    return true
  }

  if (!normalized.startsWith('rgba(')) {
    return false
  }

  const channels = normalized
    .slice(5, -1)
    .split(',')
    .map((part) => Number(part.trim()))

  return channels.length === 4 && Number.isFinite(channels[3]) && channels[3] <= 0
}

function getInlineLabelBgColor(color: string | undefined): string {
  if (isTransparentColor(color)) {
    return 'rgba(0,0,0,0)'
  }

  return color ?? 'rgba(0,0,0,0)'
}

function getCanvasColor(mode: 'auto' | 'white' | 'dark'): string {
  if (mode === 'white') {
    return '#ffffff'
  }

  if (mode === 'dark') {
    return '#0b1220'
  }

  return 'rgba(0, 0, 0, 0)'
}

function getCanvasFrameClass(mode: 'auto' | 'white' | 'dark'): string {
  if (mode === 'white') {
    return 'bg-white dark:bg-white'
  }

  if (mode === 'dark') {
    return 'bg-slate-950/60 dark:bg-slate-950/60'
  }

  return 'bg-slate-50/70 dark:bg-slate-950/40'
}

function toSeries(
  spectrum: Spectrum,
  yValues: number[],
  activeId: string | undefined,
  yOffset: number,
): PlotSeries {
  const pointCount = Math.min(spectrum.x.length, yValues.length)

  return {
    id: spectrum.id,
    name: spectrum.name,
    x: spectrum.x.slice(0, pointCount),
    y: yValues.slice(0, pointCount).map((value) => value + yOffset),
    isActive: activeId !== undefined && spectrum.id === activeId,
  }
}

export function PlotArea({ plotDivRef }: PlotAreaProps) {
  const {
    spectra,
    activeSpectrumId,
    plot,
    graphics,
    baseline,
    processedYById,
    baselineYById,
    smoothedYById,
  } = useAppState()

  const resolvedActiveSpectrum =
    spectra.find((spectrum) => spectrum.id === activeSpectrumId) ?? spectra[0]
  const resolvedActiveId = resolvedActiveSpectrum?.id
  const overlayMode = spectra.length > 0 && plot.showAllSpectra
  const overlaySpectra = plot.reverseOverlayOrder
    ? [...spectra].slice().reverse()
    : spectra
  const useInlineLabels = overlayMode && graphics.inlineSpectrumLabels

  const plottedSpectra: Spectrum[] =
    spectra.length === 0
      ? []
      : overlayMode
        ? overlaySpectra
        : [resolvedActiveSpectrum]
  const xAxisLabelStyled = styleText(
    graphics.xLabel.trim() || 'X',
    graphics.axisLabelBold,
    graphics.axisLabelItalic,
  )
  const yAxisLabelStyled = styleText(
    graphics.yLabel.trim() || 'Y',
    graphics.axisLabelBold,
    graphics.axisLabelItalic,
  )
  const traceLineWidth = Math.max(1, graphics.traceLineWidth)
  const titleStandoff = Math.max(8, Math.round(graphics.baseFontSize * 0.8))
  const isBox = graphics.frameMode === 'box'
  const activeTraceLineWidth = Math.max(
    traceLineWidth + 1,
    traceLineWidth,
  )
  const previewW = clampInt(Math.round(graphics.exportWidth), 300, 8000)
  const previewH = clampInt(Math.round(graphics.exportHeight), 300, 8000)
  const shouldPreviewCanvasSize = graphics.previewCanvasSize

  const series: PlotSeries[] =
    plottedSpectra.length > 0
      ? plottedSpectra.map((spectrum, index) => {
          const yBase = processedYById[spectrum.id] ?? spectrum.y
          const yToPlot = smoothedYById[spectrum.id] ?? yBase

          return toSeries(
            spectrum,
            yToPlot,
            resolvedActiveId,
            overlayMode ? index * plot.stackOffset : 0,
          )
        })
      : [
          {
            id: 'dummy',
            name: 'Dummy',
            x: fallbackX,
            y: fallbackY,
            isActive: false,
          },
        ]
  const primaryTraceCount = series.length
  const paletteColors = getPaletteColors(graphics.palette, primaryTraceCount)

  const primaryTraces: Data[] = series.map((entry, index) => {
    const paletteColor =
      paletteColors !== null
        ? (paletteColors[index] ??
          paletteColors[index % paletteColors.length])
        : undefined

    return {
      type: 'scatter',
      mode: 'lines',
      name: entry.name,
      x: entry.x,
      y: entry.y,
      line: {
        width: entry.isActive ? activeTraceLineWidth : traceLineWidth,
        ...(paletteColor !== undefined ? { color: paletteColor } : {}),
      },
      hovertemplate: `${entry.name}<br>x: %{x}<br>y: %{y}<extra></extra>`,
    }
  })
  const activeBaselineY =
    !overlayMode && resolvedActiveSpectrum
      ? baselineYById[resolvedActiveSpectrum.id]
      : undefined
  const baselineTrace: Data | null =
    !overlayMode &&
    baseline.showOverlay &&
    resolvedActiveSpectrum &&
    Array.isArray(activeBaselineY)
      ? {
          type: 'scatter',
          mode: 'lines',
          name: `${resolvedActiveSpectrum.name} baseline`,
          x: resolvedActiveSpectrum.x.slice(
            0,
            Math.min(resolvedActiveSpectrum.x.length, activeBaselineY.length),
          ),
          y: activeBaselineY.slice(
            0,
            Math.min(resolvedActiveSpectrum.x.length, activeBaselineY.length),
          ),
          line: {
            color: '#94a3b8',
            width: 1.5,
            dash: 'dash',
          },
          hovertemplate: `baseline<br>x: %{x}<br>y: %{y}<extra></extra>`,
        }
      : null
  const traces: Data[] =
    baselineTrace !== null
      ? [...primaryTraces, baselineTrace]
      : primaryTraces
  const plotCanvasMode = graphics.plotCanvas ?? 'auto'
  const canvasColor = getCanvasColor(plotCanvasMode)
  const canvasFrameClass = getCanvasFrameClass(plotCanvasMode)
  const hasXRange = plot.xMin != null && plot.xMax != null
  const inlineLabelBgColor = getInlineLabelBgColor(canvasColor)
  const inlineAnnotations: NonNullable<Layout['annotations']> = useInlineLabels
    ? series
        .map((entry, index) => {
          const xs = entry.x
          const ys = entry.y
          const pointCount = Math.min(xs.length, ys.length)
          if (pointCount <= 0) {
            return null
          }

          const xTarget = hasXRange
            ? plot.invertX
              ? Number(plot.xMin)
              : Number(plot.xMax)
            : (() => {
                const xMin = Math.min(...xs)
                const xMax = Math.max(...xs)
                return plot.invertX ? xMin : xMax
              })()

          let bestI = 0
          let bestD = Math.abs(xs[0] - xTarget)
          for (let i = 1; i < pointCount; i += 1) {
            const distance = Math.abs(xs[i] - xTarget)
            if (distance < bestD) {
              bestD = distance
              bestI = i
            }
          }

          const labelColor =
            paletteColors !== null
              ? (paletteColors[index] ??
                paletteColors[index % paletteColors.length])
              : DEFAULT_COLORWAY[index % DEFAULT_COLORWAY.length]

          return {
            x: xs[bestI],
            y: ys[bestI],
            xref: 'x' as const,
            yref: 'y' as const,
            text: styleText(
              truncateLabel(entry.name, 24),
              graphics.spectrumLabelBold,
              graphics.spectrumLabelItalic,
            ),
            showarrow: false,
            xanchor: 'left' as const,
            yanchor: 'middle' as const,
            xshift: 10,
            bgcolor: inlineLabelBgColor,
            bordercolor: inlineLabelBgColor,
            borderwidth: 0,
            font: {
              color: labelColor,
              size: graphics.tickFontSize,
            },
          }
        })
        .filter((annotation): annotation is NonNullable<typeof annotation> => annotation !== null)
    : []

  const allX = series.flatMap((entry) => entry.x)
  const allY = series.flatMap((entry) => entry.y)
  const xRange = getRange(allX)
  const yRange = getRange(allY)
  const hasYRange = plot.yMin != null && plot.yMax != null
  const showXMarks = graphics.showXTickLabels && graphics.showXTickMarks
  const showYMarks = graphics.showYTickLabels && graphics.showYTickMarks
  const tickClass = [
    'speclab-plot',
    graphics.tickLabelBold ? 'speclab-tick-bold' : '',
    graphics.tickLabelItalic ? 'speclab-tick-italic' : '',
  ]
    .filter(Boolean)
    .join(' ')

  useEffect(() => {
    if (!plotDivRef.current) {
      return
    }

    // Ensure export and live view share the same tick text styling.
    applyTickTextInlineStyles(plotDivRef.current, {
      tickLabelBold: graphics.tickLabelBold,
      tickLabelItalic: graphics.tickLabelItalic,
    })
  }, [
    graphics.tickLabelBold,
    graphics.tickLabelItalic,
    plotDivRef,
  ])

  const layout: Partial<Layout> = {
    autosize: !shouldPreviewCanvasSize,
    ...(shouldPreviewCanvasSize
      ? {
          width: previewW,
          height: previewH,
        }
      : {}),
    margin: { l: 72, r: useInlineLabels ? 160 : 24, t: 24, b: 64 },
    showlegend: useInlineLabels ? false : traces.length > 1,
    ...(paletteColors === null ? { colorway: DEFAULT_COLORWAY } : {}),
    ...(inlineAnnotations.length > 0 ? { annotations: inlineAnnotations } : {}),
    font: {
      family: graphics.fontFamily || 'Arial',
      size: graphics.baseFontSize,
      color: '#0f172a',
    },
    paper_bgcolor: canvasColor,
    plot_bgcolor: canvasColor,
    xaxis: {
      title: {
        text: xAxisLabelStyled,
        font: {
          size: graphics.baseFontSize + 2,
        },
        standoff: titleStandoff,
      },
      gridcolor: graphics.gridColor,
      gridwidth: graphics.gridWidth,
      zeroline: false,
      showgrid: graphics.showGrid,
      automargin: true,
      showticklabels: graphics.showXTickLabels,
      showline: true,
      mirror: isBox,
      linewidth: graphics.axisLineWidth,
      linecolor: graphics.axisLineColor,
      ticks: showXMarks ? 'outside' : '',
      ticklen: showXMarks ? 6 : 0,
      tickcolor: graphics.axisLineColor,
      tickfont: {
        size: graphics.tickFontSize,
        color: graphics.axisLineColor,
      },
      ...(hasXRange
        ? {
            autorange: false,
            range: plot.invertX
              ? [plot.xMax, plot.xMin]
              : [plot.xMin, plot.xMax],
          }
        : {
            autorange: plot.invertX ? 'reversed' : true,
          }),
    },
    yaxis: {
      title: {
        text: yAxisLabelStyled,
        font: {
          size: graphics.baseFontSize + 2,
        },
        standoff: titleStandoff,
      },
      gridcolor: graphics.gridColor,
      gridwidth: graphics.gridWidth,
      zeroline: false,
      showgrid: graphics.showGrid,
      automargin: true,
      showticklabels: graphics.showYTickLabels,
      showline: true,
      mirror: isBox,
      linewidth: graphics.axisLineWidth,
      linecolor: graphics.axisLineColor,
      ticks: showYMarks ? 'outside' : '',
      ticklen: showYMarks ? 6 : 0,
      tickcolor: graphics.axisLineColor,
      tickfont: {
        size: graphics.tickFontSize,
        color: graphics.axisLineColor,
      },
      ...(hasYRange
        ? {
            autorange: false,
            range: [plot.yMin, plot.yMax],
          }
        : {
            autorange: true,
          }),
    },
  }

  const config: Partial<Config> = {
    responsive: true,
    scrollZoom: true,
    displaylogo: false,
  }

  return (
    <section className="h-full">
      <div className="flex h-full min-h-[30rem] flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Plot</h2>

        <div
          className={`mt-4 min-h-[20rem] overflow-hidden rounded-lg border border-slate-200 p-2 dark:border-slate-800 ${canvasFrameClass} ${shouldPreviewCanvasSize ? '' : 'flex-1'} ${tickClass}`}
          style={
            shouldPreviewCanvasSize
              ? { width: previewW, height: previewH }
              : undefined
          }
        >
          <Plot
            className={`h-full w-full overflow-hidden ${tickClass}`}
            data={traces}
            layout={layout}
            config={config}
            onInitialized={(_, graphDiv) => {
              plotDivRef.current = graphDiv as PlotlyHTMLElement
              applyTickTextInlineStyles(plotDivRef.current, {
                tickLabelBold: graphics.tickLabelBold,
                tickLabelItalic: graphics.tickLabelItalic,
              })
            }}
            onUpdate={(_, graphDiv) => {
              plotDivRef.current = graphDiv as PlotlyHTMLElement
              applyTickTextInlineStyles(plotDivRef.current, {
                tickLabelBold: graphics.tickLabelBold,
                tickLabelItalic: graphics.tickLabelItalic,
              })
            }}
            useResizeHandler
            style={{ width: '100%', height: '100%' }}
          />
        </div>

        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
          Debug: traces={traces.length}, active={resolvedActiveSpectrum?.name ?? 'none'}, x=[
          {formatRangeValue(xRange.min)}, {formatRangeValue(xRange.max)}], y=[
          {formatRangeValue(yRange.min)}, {formatRangeValue(yRange.max)}]
        </p>
      </div>
    </section>
  )
}
