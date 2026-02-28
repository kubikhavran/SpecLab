import type { MutableRefObject } from 'react'
import { useMemo, useState } from 'react'
import Plotly from 'plotly.js-dist-min'
import type { Data, DownloadImgopts, Layout, PlotlyHTMLElement } from 'plotly.js'
import { useAppState } from '../../app/state/AppStore'
import { downloadTextFile } from '../../lib/downloadTextFile'
import { exportAllToZip } from './exportAllToZip'
import { spectrumToDelimitedText } from './exportSpectrumData'

type ExportPanelProps = {
  plotDivRef: MutableRefObject<PlotlyHTMLElement | null>
}

type ExportFormat = 'png' | 'svg'
type ExportPreset = 'screen' | 'publication'

type LooseAxis = {
  titlefont?: unknown
  title?: { font?: unknown }
  tickfont?: unknown
  linewidth?: unknown
  ticks?: unknown
  ticklen?: unknown
  showline?: unknown
  mirror?: unknown
}

type LooseLayout = {
  paper_bgcolor?: unknown
  plot_bgcolor?: unknown
  font?: unknown
  xaxis?: LooseAxis
  yaxis?: LooseAxis
  legend?: { font?: unknown }
}

type LooseTrace = {
  line?: { width?: unknown }
}

type GraphDivState = PlotlyHTMLElement & {
  layout?: LooseLayout
  data?: LooseTrace[]
}

function sanitizeFilename(rawName: string): string {
  const cleaned = rawName
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[\\/]/g, '_')
    .replace(/[<>:"|?*]/g, '')

  return cleaned.length > 0 ? cleaned : 'plot'
}

function clampInt(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}

export function ExportPanel({ plotDivRef }: ExportPanelProps) {
  const { spectra, activeSpectrumId, plot, graphics } = useAppState()
  const [transparentBackground, setTransparentBackground] = useState(false)
  const [decimalComma, setDecimalComma] = useState(true)
  const [exportPreset, setExportPreset] = useState<ExportPreset>('screen')
  const [isExporting, setIsExporting] = useState(false)
  const roundedExportW = Math.round(graphics.exportWidth)
  const roundedExportH = Math.round(graphics.exportHeight)
  const exportW = clampInt(roundedExportW, 300, 8000)
  const exportH = clampInt(roundedExportH, 300, 8000)
  const isExportSizeClamped =
    exportW !== roundedExportW || exportH !== roundedExportH

  const activeSpectrum = useMemo(
    () =>
      activeSpectrumId !== undefined
        ? spectra.find((spectrum) => spectrum.id === activeSpectrumId) ??
          spectra[0]
        : spectra[0],
    [activeSpectrumId, spectra],
  )

  const filename = sanitizeFilename(
    plot.showAllSpectra
      ? 'overlay'
      : activeSpectrum !== undefined
        ? activeSpectrum.name
        : 'plot',
  )

  const isPlotReady = plotDivRef.current !== null
  const hasSpectra = spectra.length > 0
  const exportDisabled = !isPlotReady || isExporting
  const exportDataDisabled = !hasSpectra

  const exportData = (delimiter: ';' | '\t') => {
    if (!activeSpectrum) {
      return
    }

    const serialized = spectrumToDelimitedText({
      spectrum: activeSpectrum,
      delimiter,
      decimalComma,
    })
    const baseName = sanitizeFilename(activeSpectrum.name || 'spectrum')
    const extension = delimiter === ';' ? 'csv' : 'tsv'
    const mime =
      delimiter === ';'
        ? 'text/csv;charset=utf-8'
        : 'text/tab-separated-values;charset=utf-8'

    downloadTextFile(`${baseName}_data.${extension}`, serialized, mime)
  }

  const exportAllData = async (delimiter: ';' | '\t') => {
    if (!hasSpectra) {
      return
    }

    await exportAllToZip({
      spectra,
      delimiter,
      decimalComma,
      zipBaseName: plot.showAllSpectra ? 'overlay_all' : 'all_spectra',
    })
  }

  const exportPlot = async (format: ExportFormat) => {
    const graphDiv = plotDivRef.current

    if (!graphDiv) {
      return
    }

    const downloadOptions: DownloadImgopts & { scale: number } = {
      format,
      filename,
      width: exportW,
      height: exportH,
      scale: 2,
    }

    setIsExporting(true)

    const graphState = graphDiv as GraphDivState
    const layoutAny = graphState.layout ?? {}
    const prevPaper =
      typeof layoutAny.paper_bgcolor === 'string'
        ? layoutAny.paper_bgcolor
        : '#ffffff'
    const prevPlot =
      typeof layoutAny.plot_bgcolor === 'string'
        ? layoutAny.plot_bgcolor
        : '#ffffff'
    const previousStylePatch = {
      font: layoutAny.font ?? { family: 'Arial', size: 12 },
      xaxis: {
        titlefont:
          layoutAny.xaxis?.titlefont ??
          layoutAny.xaxis?.title?.font ?? { size: 12 },
        tickfont: layoutAny.xaxis?.tickfont ?? { size: 12 },
        linewidth:
          typeof layoutAny.xaxis?.linewidth === 'number'
            ? layoutAny.xaxis.linewidth
            : 0,
        ticks: layoutAny.xaxis?.ticks ?? '',
        ticklen:
          typeof layoutAny.xaxis?.ticklen === 'number'
            ? layoutAny.xaxis.ticklen
            : 0,
        showline: Boolean(layoutAny.xaxis?.showline),
        mirror: layoutAny.xaxis?.mirror ?? false,
      },
      yaxis: {
        titlefont:
          layoutAny.yaxis?.titlefont ??
          layoutAny.yaxis?.title?.font ?? { size: 12 },
        tickfont: layoutAny.yaxis?.tickfont ?? { size: 12 },
        linewidth:
          typeof layoutAny.yaxis?.linewidth === 'number'
            ? layoutAny.yaxis.linewidth
            : 0,
        ticks: layoutAny.yaxis?.ticks ?? '',
        ticklen:
          typeof layoutAny.yaxis?.ticklen === 'number'
            ? layoutAny.yaxis.ticklen
            : 0,
        showline: Boolean(layoutAny.yaxis?.showline),
        mirror: layoutAny.yaxis?.mirror ?? false,
      },
      legend: {
        font: layoutAny.legend?.font ?? { size: 12 },
      },
    }

    const rawData = (graphDiv as unknown as { data?: unknown }).data
    const currentTraceWidths: number[] = Array.isArray(rawData)
      ? rawData.map((trace) => {
          const lineValue =
            typeof trace === 'object' && trace !== null && 'line' in trace
              ? (trace as { line?: { width?: unknown } }).line
              : undefined

          return typeof lineValue?.width === 'number' ? lineValue.width : 2
        })
      : []

    const publicationTraceWidths = currentTraceWidths.map((width) =>
      Math.max(width, 2.5),
    )

    const publicationLayoutPatch = {
      font: { family: 'Arial', size: 18 },
      xaxis: {
        titlefont: { size: 20 },
        tickfont: { size: 16 },
        linewidth: 2,
        ticks: 'outside',
        ticklen: 6,
        showline: true,
        mirror: true,
      },
      yaxis: {
        titlefont: { size: 20 },
        tickfont: { size: 16 },
        linewidth: 2,
        ticks: 'outside',
        ticklen: 6,
        showline: true,
        mirror: true,
      },
      legend: {
        font: { size: 16 },
      },
    }
    const publicationTracePatch = {
      'line.width': publicationTraceWidths,
    } as unknown as Data
    const restoreTracePatch = {
      'line.width': currentTraceWidths,
    } as unknown as Data
    const restoreLayoutPatch = {
      ...previousStylePatch,
      paper_bgcolor: prevPaper,
      plot_bgcolor: prevPlot,
    } as unknown as Partial<Layout>

    try {
      if (transparentBackground) {
        await Plotly.relayout(graphDiv, {
          paper_bgcolor: 'rgba(0,0,0,0)',
          plot_bgcolor: 'rgba(0,0,0,0)',
        })
      } else {
        await Plotly.relayout(graphDiv, {
          paper_bgcolor: '#ffffff',
          plot_bgcolor: '#ffffff',
        })
      }

      if (exportPreset === 'publication') {
        await Plotly.relayout(
          graphDiv,
          publicationLayoutPatch as unknown as Partial<Layout>,
        )
        await Plotly.restyle(graphDiv, publicationTracePatch)
      }

      await Plotly.downloadImage(graphDiv, downloadOptions)
    } finally {
      try {
        if (currentTraceWidths.length > 0) {
          await Plotly.restyle(graphDiv, restoreTracePatch)
        }

        await Plotly.relayout(graphDiv, restoreLayoutPatch)
      } finally {
        setIsExporting(false)
      }
    }
  }

  return (
    <div className="space-y-2">
      <label className="block space-y-1">
        <span className="text-xs text-slate-700">Export preset</span>
        <select
          className="w-full rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700"
          value={exportPreset}
          onChange={(event) =>
            setExportPreset(event.currentTarget.value as ExportPreset)
          }
        >
          <option value="screen">Screen</option>
          <option value="publication">Publication</option>
        </select>
      </label>

      <label className="flex items-center gap-2 text-xs text-slate-700">
        <input
          type="checkbox"
          className="h-3.5 w-3.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
          checked={transparentBackground}
          onChange={(event) =>
            setTransparentBackground(event.currentTarget.checked)
          }
        />
        <span>Transparent background</span>
      </label>

      <div className="flex flex-wrap gap-1">
        <button
          type="button"
          className="rounded border border-slate-300 px-2 py-0.5 text-xs text-slate-700 hover:bg-slate-100 disabled:cursor-default disabled:opacity-50"
          disabled={exportDisabled}
          onClick={() => exportPlot('png')}
        >
          Export PNG
        </button>
        <button
          type="button"
          className="rounded border border-slate-300 px-2 py-0.5 text-xs text-slate-700 hover:bg-slate-100 disabled:cursor-default disabled:opacity-50"
          disabled={exportDisabled}
          onClick={() => exportPlot('svg')}
        >
          Export SVG
        </button>
      </div>
      <p className="text-[11px] text-slate-500">
        Export size: {exportW} x {exportH} px{' '}
        <span className="text-slate-400">(from Graphics)</span>
      </p>
      {isExportSizeClamped ? (
        <p className="text-[11px] text-slate-400">
          Clamped to 300..8000 for export.
        </p>
      ) : null}

      <div className="space-y-1 border-t border-slate-200 pt-2">
        <p className="text-xs text-slate-700">Data export</p>
        <label className="flex items-center gap-2 text-xs text-slate-700">
          <input
            type="checkbox"
            className="h-3.5 w-3.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
            checked={decimalComma}
            onChange={(event) => setDecimalComma(event.currentTarget.checked)}
          />
          <span>Decimal comma (CZ)</span>
        </label>

        <div className="flex flex-wrap gap-1">
          <button
            type="button"
            className="rounded border border-slate-300 px-2 py-0.5 text-xs text-slate-700 hover:bg-slate-100 disabled:cursor-default disabled:opacity-50"
            disabled={exportDataDisabled}
            onClick={() => exportData(';')}
          >
            Export CSV (;)
          </button>
          <button
            type="button"
            className="rounded border border-slate-300 px-2 py-0.5 text-xs text-slate-700 hover:bg-slate-100 disabled:cursor-default disabled:opacity-50"
            disabled={exportDataDisabled}
            onClick={() => exportData('\t')}
          >
            Export TSV
          </button>
          <button
            type="button"
            className="rounded border border-slate-300 px-2 py-0.5 text-xs text-slate-700 hover:bg-slate-100 disabled:cursor-default disabled:opacity-50"
            disabled={exportDataDisabled}
            onClick={() => {
              void exportAllData(';')
            }}
          >
            Export ALL -&gt; ZIP (CSV)
          </button>
          <button
            type="button"
            className="rounded border border-slate-300 px-2 py-0.5 text-xs text-slate-700 hover:bg-slate-100 disabled:cursor-default disabled:opacity-50"
            disabled={exportDataDisabled}
            onClick={() => {
              void exportAllData('\t')
            }}
          >
            Export ALL -&gt; ZIP (TSV)
          </button>
        </div>
      </div>

      {!isPlotReady ? (
        <p className="text-[11px] text-slate-400">Plot not ready yet.</p>
      ) : null}
    </div>
  )
}
