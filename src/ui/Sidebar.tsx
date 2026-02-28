import type { MutableRefObject } from 'react'
import type { PlotlyHTMLElement } from 'plotly.js'
import { ImportSpectrum } from '../features/import/ImportSpectrum'
import { ExportPanel } from '../features/export/ExportPanel'
import { GraphicsPanel } from '../features/graphics/GraphicsPanel'
import { BaselinePanel } from '../features/baseline/BaselinePanel'
import { SmoothingPanel } from '../features/smoothing/SmoothingPanel'
import { SpectrumList } from '../features/import/SpectrumList'
import { computeAutoFitY } from '../features/plot/autoFitY'
import { useAppDispatch, useAppState } from '../app/state/AppStore'

const sections = [
  'Data',
  'Graf',
  'Baseline',
  'Smoothing',
  'Cosmic rays',
  'Graphics',
  'Export',
  'Presets',
]

type SidebarProps = {
  plotDivRef: MutableRefObject<PlotlyHTMLElement | null>
}

export function Sidebar({ plotDivRef }: SidebarProps) {
  const { spectra, activeSpectrumId, plot } = useAppState()
  const dispatch = useAppDispatch()
  const stackOffsetDisabled = spectra.length < 2 || !plot.showAllSpectra

  const updateStackOffset = (rawValue: string) => {
    const numericValue = Number(rawValue)
    const safeValue = Number.isFinite(numericValue) ? numericValue : 0
    const clampedValue = Math.max(0, Math.min(20000, safeValue))

    dispatch({
      type: 'PLOT_SET',
      patch: { stackOffset: clampedValue },
    })
  }

  const parseAxisInput = (rawValue: string): number | null | undefined => {
    const trimmedValue = rawValue.trim()

    if (trimmedValue.length === 0) {
      return null
    }

    const numericValue = Number(trimmedValue)
    return Number.isFinite(numericValue) ? numericValue : undefined
  }

  const updateAxisValue = (
    axis: 'xMin' | 'xMax' | 'yMin' | 'yMax',
    rawValue: string,
  ) => {
    const parsedValue = parseAxisInput(rawValue)

    if (parsedValue === undefined) {
      return
    }

    switch (axis) {
      case 'xMin':
        dispatch({ type: 'PLOT_SET', patch: { xMin: parsedValue } })
        return
      case 'xMax':
        dispatch({ type: 'PLOT_SET', patch: { xMax: parsedValue } })
        return
      case 'yMin':
        dispatch({ type: 'PLOT_SET', patch: { yMin: parsedValue } })
        return
      case 'yMax':
        dispatch({ type: 'PLOT_SET', patch: { yMax: parsedValue } })
    }
  }

  const handleAutoFitY = () => {
    const result = computeAutoFitY({
      spectra,
      activeSpectrumId,
      showAllSpectra: plot.showAllSpectra,
      stackOffset: plot.stackOffset,
      xMin: plot.xMin ?? null,
      xMax: plot.xMax ?? null,
    })

    if (!result) {
      return
    }

    dispatch({
      type: 'PLOT_SET',
      patch: {
        yMin: result.yMin,
        yMax: result.yMax,
      },
    })
  }

  return (
    <div className="flex h-full min-w-0 flex-col overflow-x-hidden p-4">
      <h1 className="text-lg font-semibold tracking-tight text-slate-900">
        SpecLab
      </h1>

      <div className="mt-4 min-w-0 space-y-2 overflow-x-hidden overflow-y-auto pr-1">
        {sections.map((section) => (
          <details
            key={section}
            className="rounded-lg border border-slate-200 bg-white shadow-sm"
          >
            <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-slate-700">
              {section}
            </summary>
            <div className="space-y-2 border-t border-slate-100 px-3 py-2 text-xs text-slate-500">
              {section === 'Graf' ? (
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs text-slate-700">
                    <input
                      type="checkbox"
                      className="h-3.5 w-3.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                      checked={plot.showAllSpectra}
                      disabled={spectra.length < 2}
                      onChange={(event) =>
                        dispatch({
                          type: 'PLOT_SET',
                          patch: {
                            showAllSpectra: event.currentTarget.checked,
                          },
                        })
                      }
                    />
                    <span>Overlay (show all spectra)</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs text-slate-700">
                    <input
                      type="checkbox"
                      className="h-3.5 w-3.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                      checked={plot.invertX}
                      onChange={(event) =>
                        dispatch({
                          type: 'PLOT_SET',
                          patch: { invertX: event.currentTarget.checked },
                        })
                      }
                    />
                    <span>Invert X axis</span>
                  </label>

                  <div className="grid grid-cols-2 gap-1">
                    <label className="space-y-0.5">
                      <span className="text-[11px] text-slate-600">X min</span>
                      <input
                        type="text"
                        className="w-full rounded border border-slate-300 px-1.5 py-1 text-xs text-slate-700"
                        value={plot.xMin ?? ''}
                        onChange={(event) =>
                          updateAxisValue('xMin', event.currentTarget.value)
                        }
                      />
                    </label>
                    <label className="space-y-0.5">
                      <span className="text-[11px] text-slate-600">X max</span>
                      <input
                        type="text"
                        className="w-full rounded border border-slate-300 px-1.5 py-1 text-xs text-slate-700"
                        value={plot.xMax ?? ''}
                        onChange={(event) =>
                          updateAxisValue('xMax', event.currentTarget.value)
                        }
                      />
                    </label>
                    <label className="space-y-0.5">
                      <span className="text-[11px] text-slate-600">Y min</span>
                      <input
                        type="text"
                        className="w-full rounded border border-slate-300 px-1.5 py-1 text-xs text-slate-700"
                        value={plot.yMin ?? ''}
                        onChange={(event) =>
                          updateAxisValue('yMin', event.currentTarget.value)
                        }
                      />
                    </label>
                    <label className="space-y-0.5">
                      <span className="text-[11px] text-slate-600">Y max</span>
                      <input
                        type="text"
                        className="w-full rounded border border-slate-300 px-1.5 py-1 text-xs text-slate-700"
                        value={plot.yMax ?? ''}
                        onChange={(event) =>
                          updateAxisValue('yMax', event.currentTarget.value)
                        }
                      />
                    </label>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    <button
                      type="button"
                      className="rounded border border-slate-300 px-2 py-0.5 text-xs text-slate-700 hover:bg-slate-100"
                      onClick={() =>
                        dispatch({
                          type: 'PLOT_SET',
                          patch: {
                            xMin: null,
                            xMax: null,
                            yMin: null,
                            yMax: null,
                          },
                        })
                      }
                    >
                      Reset view
                    </button>
                    <button
                      type="button"
                      className="rounded border border-slate-300 px-2 py-0.5 text-xs text-slate-700 hover:bg-slate-100 disabled:cursor-default disabled:opacity-50"
                      disabled={spectra.length === 0}
                      onClick={handleAutoFitY}
                    >
                      Auto-fit Y
                    </button>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs font-medium text-slate-700">
                      Stack offset (Y)
                    </p>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min={0}
                        max={20000}
                        step={100}
                        className="w-full accent-sky-600"
                        value={plot.stackOffset}
                        disabled={stackOffsetDisabled}
                        onChange={(event) =>
                          updateStackOffset(event.currentTarget.value)
                        }
                      />
                      <input
                        type="number"
                        min={0}
                        max={20000}
                        step={100}
                        className="w-20 rounded border border-slate-300 px-2 py-1 text-xs text-slate-700"
                        value={plot.stackOffset}
                        disabled={stackOffsetDisabled}
                        onChange={(event) =>
                          updateStackOffset(event.currentTarget.value)
                        }
                      />
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Applies only when Overlay is enabled.
                    </p>
                  </div>
                </div>
              ) : null}
              {section === 'Data' ? <ImportSpectrum /> : null}
              {section === 'Data' ? <SpectrumList /> : null}
              {section === 'Baseline' ? <BaselinePanel /> : null}
              {section === 'Smoothing' ? <SmoothingPanel /> : null}
              {section === 'Graphics' ? <GraphicsPanel /> : null}
              {section === 'Export' ? <ExportPanel plotDivRef={plotDivRef} /> : null}
              <p>Placeholder controls for {section.toLowerCase()}.</p>
            </div>
          </details>
        ))}
      </div>
    </div>
  )
}
