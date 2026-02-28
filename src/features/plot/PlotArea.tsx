import type { MutableRefObject } from 'react'
import createPlotlyComponent from 'react-plotly.js/factory'
import Plotly from 'plotly.js-dist-min'
import type { Config, Data, Layout, PlotlyHTMLElement } from 'plotly.js'
import { useAppState } from '../../app/state/AppStore'
import type { Spectrum } from '../../app/types/core'
import { getPaletteColors } from '../graphics/palettes'

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
    processedYById,
    baselineYById,
    smoothedYById,
  } = useAppState()

  const resolvedActiveSpectrum =
    spectra.find((spectrum) => spectrum.id === activeSpectrumId) ?? spectra[0]
  const resolvedActiveId = resolvedActiveSpectrum?.id
  const overlayMode = spectra.length > 0 && plot.showAllSpectra
  const useInlineLabels = overlayMode && graphics.inlineSpectrumLabels

  const plottedSpectra: Spectrum[] =
    spectra.length === 0
      ? []
      : overlayMode
        ? spectra
        : [resolvedActiveSpectrum]
  const xAxisLabel = graphics.xLabel.trim() || 'X'
  const yAxisLabel = graphics.yLabel.trim() || 'Y'
  const traceLineWidth = Math.max(1, graphics.traceLineWidth)
  const titleStandoff = Math.max(8, Math.round(graphics.baseFontSize * 0.8))
  const isBox = graphics.frameMode === 'box'
  const activeTraceLineWidth = Math.max(
    traceLineWidth + 1,
    traceLineWidth,
  )
  const paletteColors = getPaletteColors(graphics.palette)
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

  const primaryTraces: Data[] = series.map((entry, index) => {
    const paletteColor =
      paletteColors !== null
        ? paletteColors[index % paletteColors.length]
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
    !overlayMode && resolvedActiveSpectrum && Array.isArray(activeBaselineY)
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
  const hasXRange = plot.xMin != null && plot.xMax != null
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
              ? paletteColors[index % paletteColors.length]
              : '#0f172a'

          return {
            x: xs[bestI],
            y: ys[bestI],
            xref: 'x' as const,
            yref: 'y' as const,
            text: truncateLabel(entry.name, 24),
            showarrow: false,
            xanchor: 'left' as const,
            yanchor: 'middle' as const,
            xshift: 10,
            bgcolor: 'rgba(255,255,255,0.7)',
            bordercolor: 'rgba(0,0,0,0)',
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
    ...(inlineAnnotations.length > 0 ? { annotations: inlineAnnotations } : {}),
    font: {
      family: graphics.fontFamily || 'Arial',
      size: graphics.baseFontSize,
      color: '#0f172a',
    },
    paper_bgcolor: 'rgba(0, 0, 0, 0)',
    plot_bgcolor: 'rgba(0, 0, 0, 0)',
    xaxis: {
      title: {
        text: xAxisLabel,
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
      ticks: graphics.showXTickLabels ? 'outside' : '',
      ticklen: graphics.showXTickLabels ? 6 : 0,
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
        text: yAxisLabel,
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
      ticks: graphics.showYTickLabels ? 'outside' : '',
      ticklen: graphics.showYTickLabels ? 6 : 0,
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
      <div className="flex h-full min-h-[30rem] flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Plot</h2>

        <div
          className={`mt-4 min-h-[20rem] rounded-lg border border-slate-200 bg-slate-50/70 p-2 ${shouldPreviewCanvasSize ? '' : 'flex-1'}`}
          style={
            shouldPreviewCanvasSize
              ? { width: previewW, height: previewH }
              : undefined
          }
        >
          <Plot
            className="h-full w-full"
            data={traces}
            layout={layout}
            config={config}
            onInitialized={(_, graphDiv) => {
              plotDivRef.current = graphDiv as PlotlyHTMLElement
            }}
            onUpdate={(_, graphDiv) => {
              plotDivRef.current = graphDiv as PlotlyHTMLElement
            }}
            useResizeHandler
            style={{ width: '100%', height: '100%' }}
          />
        </div>

        <p className="mt-3 text-xs text-slate-500">
          Debug: traces={traces.length}, active={resolvedActiveSpectrum?.name ?? 'none'}, x=[
          {formatRangeValue(xRange.min)}, {formatRangeValue(xRange.max)}], y=[
          {formatRangeValue(yRange.min)}, {formatRangeValue(yRange.max)}]
        </p>
      </div>
    </section>
  )
}
