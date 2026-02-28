import { useEffect, useState, type KeyboardEvent } from 'react'
import type { GraphicsPalette } from '../../app/types/core'
import { useAppDispatch, useAppState } from '../../app/state/AppStore'

const fontFamilies = ['Arial', 'Inter', 'Times New Roman', 'Courier New'] as const
const paletteOptions: Array<{ label: string; value: GraphicsPalette }> = [
  { label: 'Auto (Plotly)', value: 'auto' },
  { label: 'Colorblind (Okabe-Ito)', value: 'colorblind' },
  { label: 'Tableau 10', value: 'tableau10' },
  { label: 'Set2', value: 'set2' },
  { label: 'Dark2', value: 'dark2' },
  { label: 'Paired', value: 'paired' },
  { label: 'Accent', value: 'accent' },
  { label: 'Pastel1', value: 'pastel1' },
  { label: 'Pastel2', value: 'pastel2' },
  { label: 'Viridis', value: 'viridis' },
  { label: 'Plasma', value: 'plasma' },
  { label: 'Magma', value: 'magma' },
  { label: 'Cividis', value: 'cividis' },
  { label: 'Monochrome', value: 'mono' },
  { label: 'Neon', value: 'neon' },
]

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export function GraphicsPanel() {
  const { graphics } = useAppState()
  const dispatch = useAppDispatch()
  const [widthText, setWidthText] = useState(String(graphics.exportWidth))
  const [heightText, setHeightText] = useState(String(graphics.exportHeight))

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setWidthText(String(graphics.exportWidth))
  }, [graphics.exportWidth])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHeightText(String(graphics.exportHeight))
  }, [graphics.exportHeight])

  const commitSize = (kind: 'w' | 'h') => {
    const raw = kind === 'w' ? widthText : heightText
    const parsed = Number(raw.replace(/[^\d]/g, ''))

    if (!Number.isFinite(parsed)) {
      return
    }

    const clamped = Math.max(200, Math.min(20000, parsed))
    dispatch({
      type: 'GRAPHICS_SET',
      patch: kind === 'w' ? { exportWidth: clamped } : { exportHeight: clamped },
    })
  }

  const onSizeKeyDown = (kind: 'w' | 'h') => (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      commitSize(kind)
    }
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-1">
        <label className="space-y-0.5">
          <span className="text-[11px] text-slate-600">X label</span>
          <input
            type="text"
            className="w-full rounded border border-slate-300 px-1.5 py-1 text-xs text-slate-700"
            value={graphics.xLabel}
            onChange={(event) =>
              dispatch({
                type: 'GRAPHICS_SET',
                patch: { xLabel: event.currentTarget.value },
              })
            }
          />
        </label>
        <label className="space-y-0.5">
          <span className="text-[11px] text-slate-600">Y label</span>
          <input
            type="text"
            className="w-full rounded border border-slate-300 px-1.5 py-1 text-xs text-slate-700"
            value={graphics.yLabel}
            onChange={(event) =>
              dispatch({
                type: 'GRAPHICS_SET',
                patch: { yLabel: event.currentTarget.value },
              })
            }
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-1">
        <label className="flex items-center gap-2 text-xs text-slate-700">
          <input
            type="checkbox"
            className="h-3.5 w-3.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
            checked={graphics.showXTickLabels}
            onChange={(event) =>
              dispatch({
                type: 'GRAPHICS_SET',
                patch: { showXTickLabels: event.currentTarget.checked },
              })
            }
          />
          <span>Show X tick labels</span>
        </label>
        <label className="flex items-center gap-2 text-xs text-slate-700">
          <input
            type="checkbox"
            className="h-3.5 w-3.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
            checked={graphics.showYTickLabels}
            onChange={(event) =>
              dispatch({
                type: 'GRAPHICS_SET',
                patch: { showYTickLabels: event.currentTarget.checked },
              })
            }
          />
          <span>Show Y tick labels</span>
        </label>
      </div>

      <div className="grid grid-cols-2 gap-1">
        <label className="flex items-center gap-2 text-xs text-slate-700">
          <input
            type="checkbox"
            className="h-3.5 w-3.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
            checked={graphics.showGrid}
            onChange={(event) =>
              dispatch({
                type: 'GRAPHICS_SET',
                patch: { showGrid: event.currentTarget.checked },
              })
            }
          />
          <span>Show grid</span>
        </label>
        <label className="space-y-0.5">
          <span className="text-[11px] text-slate-600">Grid color</span>
          <input
            type="color"
            className="h-8 w-full rounded border border-slate-300 p-1"
            value={graphics.gridColor}
            onChange={(event) =>
              dispatch({
                type: 'GRAPHICS_SET',
                patch: { gridColor: event.currentTarget.value },
              })
            }
          />
        </label>
      </div>

      <label className="block space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-slate-600">Grid width</span>
          <span className="text-[11px] text-slate-500">{graphics.gridWidth}</span>
        </div>
        <input
          type="range"
          min={1}
          max={3}
          step={1}
          className="w-full accent-sky-600"
          value={graphics.gridWidth}
          onChange={(event) =>
            dispatch({
              type: 'GRAPHICS_SET',
              patch: {
                gridWidth: clamp(Number(event.currentTarget.value), 1, 3),
              },
            })
          }
        />
      </label>

      <div className="grid grid-cols-2 gap-1">
        <label className="space-y-0.5">
          <span className="text-[11px] text-slate-600">Axis line color</span>
          <input
            type="color"
            className="h-8 w-full rounded border border-slate-300 p-1"
            value={graphics.axisLineColor}
            onChange={(event) =>
              dispatch({
                type: 'GRAPHICS_SET',
                patch: { axisLineColor: event.currentTarget.value },
              })
            }
          />
        </label>
        <label className="space-y-0.5">
          <span className="text-[11px] text-slate-600">Frame</span>
          <select
            className="w-full rounded border border-slate-300 px-1.5 py-1 text-xs text-slate-700"
            value={graphics.frameMode}
            onChange={(event) =>
              dispatch({
                type: 'GRAPHICS_SET',
                patch: {
                  frameMode: event.currentTarget.value as 'open' | 'box',
                },
              })
            }
          >
            <option value="open">Open (left/bottom)</option>
            <option value="box">Box (all sides)</option>
          </select>
        </label>
      </div>

      <label className="block space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-slate-600">Axis line width</span>
          <span className="text-[11px] text-slate-500">{graphics.axisLineWidth}</span>
        </div>
        <input
          type="range"
          min={1}
          max={6}
          step={1}
          className="w-full accent-sky-600"
          value={graphics.axisLineWidth}
          onChange={(event) =>
            dispatch({
              type: 'GRAPHICS_SET',
              patch: {
                axisLineWidth: clamp(Number(event.currentTarget.value), 1, 6),
              },
            })
          }
        />
      </label>

      <label className="block space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-slate-600">Trace line width</span>
          <span className="text-[11px] text-slate-500">{graphics.traceLineWidth}</span>
        </div>
        <input
          type="range"
          min={1}
          max={6}
          step={1}
          className="w-full accent-sky-600"
          value={graphics.traceLineWidth}
          onChange={(event) =>
            dispatch({
              type: 'GRAPHICS_SET',
              patch: {
                traceLineWidth: clamp(Number(event.currentTarget.value), 1, 6),
              },
            })
          }
        />
      </label>

      <label className="block space-y-0.5">
        <span className="text-[11px] text-slate-600">Font family</span>
        <select
          className="w-full rounded border border-slate-300 px-1.5 py-1 text-xs text-slate-700"
          value={graphics.fontFamily}
          onChange={(event) =>
            dispatch({
              type: 'GRAPHICS_SET',
              patch: { fontFamily: event.currentTarget.value },
            })
          }
        >
          {fontFamilies.map((family) => (
            <option key={family} value={family}>
              {family}
            </option>
          ))}
        </select>
      </label>

      <label className="block space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-slate-600">Base font size</span>
          <span className="text-[11px] text-slate-500">{graphics.baseFontSize}</span>
        </div>
        <input
          type="range"
          min={10}
          max={48}
          step={1}
          className="w-full accent-sky-600"
          value={graphics.baseFontSize}
          onChange={(event) =>
            dispatch({
              type: 'GRAPHICS_SET',
              patch: {
                baseFontSize: clamp(Number(event.currentTarget.value), 10, 48),
              },
            })
          }
        />
      </label>

      <label className="block space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-slate-600">Tick font size</span>
          <span className="text-[11px] text-slate-500">{graphics.tickFontSize}</span>
        </div>
        <input
          type="range"
          min={8}
          max={36}
          step={1}
          className="w-full accent-sky-600"
          value={graphics.tickFontSize}
          onChange={(event) =>
            dispatch({
              type: 'GRAPHICS_SET',
              patch: {
                tickFontSize: clamp(Number(event.currentTarget.value), 8, 36),
              },
            })
          }
        />
      </label>

      <label className="block space-y-0.5">
        <span className="text-[11px] text-slate-600">Palette</span>
        <select
          className="w-full rounded border border-slate-300 px-1.5 py-1 text-xs text-slate-700"
          value={graphics.palette}
          onChange={(event) =>
            dispatch({
              type: 'GRAPHICS_SET',
              patch: { palette: event.currentTarget.value as GraphicsPalette },
            })
          }
        >
          {paletteOptions.map((palette) => (
            <option key={palette.value} value={palette.value}>
              {palette.label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-2 text-xs text-slate-700">
        <input
          type="checkbox"
          className="h-3.5 w-3.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
          checked={graphics.inlineSpectrumLabels}
          onChange={(event) =>
            dispatch({
              type: 'GRAPHICS_SET',
              patch: { inlineSpectrumLabels: event.currentTarget.checked },
            })
          }
        />
        <span>Inline spectrum labels</span>
      </label>

      <div className="grid grid-cols-2 gap-1">
        <label className="space-y-0.5">
          <span className="text-[11px] text-slate-600">Width</span>
          <input
            type="text"
            inputMode="numeric"
            className="w-full rounded border border-slate-300 px-1.5 py-1 text-xs text-slate-700"
            value={widthText}
            onChange={(event) => setWidthText(event.currentTarget.value)}
            onBlur={() => commitSize('w')}
            onKeyDown={onSizeKeyDown('w')}
          />
        </label>
        <label className="space-y-0.5">
          <span className="text-[11px] text-slate-600">Height</span>
          <input
            type="text"
            inputMode="numeric"
            className="w-full rounded border border-slate-300 px-1.5 py-1 text-xs text-slate-700"
            value={heightText}
            onChange={(event) => setHeightText(event.currentTarget.value)}
            onBlur={() => commitSize('h')}
            onKeyDown={onSizeKeyDown('h')}
          />
        </label>
      </div>
      <label className="flex items-center gap-2 text-xs text-slate-700">
        <input
          type="checkbox"
          className="h-3.5 w-3.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
          checked={graphics.previewCanvasSize}
          onChange={(event) =>
            dispatch({
              type: 'GRAPHICS_SET',
              patch: { previewCanvasSize: event.currentTarget.checked },
            })
          }
        />
        <span>Preview export size on canvas</span>
      </label>
      <p className="text-[11px] text-slate-400">
        Used for PNG/SVG export size (px).
      </p>
    </div>
  )
}
