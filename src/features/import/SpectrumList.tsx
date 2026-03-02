import type { KeyboardEvent } from 'react'
import { useState } from 'react'
import { useAppDispatch, useAppState } from '../../app/state/AppStore'

type RenumberMode = 'index' | 'sequence' | 'extract'
type ExtractSource = 'filename' | 'name'
type ExtractPreset = 'mv' | 'firstNumber' | 'lastNumber' | 'regex' | 'slice'

export function SpectrumList() {
  const { spectra, activeSpectrumId, plot } = useAppState()
  const dispatch = useAppDispatch()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draftName, setDraftName] = useState('')
  const [renumberMode, setRenumberMode] = useState<RenumberMode>('index')
  const [renumberPrefix, setRenumberPrefix] = useState('')
  const [sequenceStart, setSequenceStart] = useState('1')
  const [sequenceStep, setSequenceStep] = useState('1')
  const [sequenceSuffix, setSequenceSuffix] = useState('mV')
  const [extractSource, setExtractSource] = useState<ExtractSource>('filename')
  const [extractPreset, setExtractPreset] = useState<ExtractPreset>('mv')
  const [extractRegex, setExtractRegex] = useState('(\\d+)mV')
  const [extractSliceStart, setExtractSliceStart] = useState('0')
  const [extractSliceEnd, setExtractSliceEnd] = useState('10')
  const [extractTrimResult, setExtractTrimResult] = useState(true)
  const [extractNumbersOnly, setExtractNumbersOnly] = useState(false)
  const [extractPrefixText, setExtractPrefixText] = useState('')
  const [extractSuffix, setExtractSuffix] = useState(' mV')
  const [invertOrder, setInvertOrder] = useState(false)

  const cancelRename = () => {
    setEditingId(null)
    setDraftName('')
  }

  const saveRename = (id: string) => {
    dispatch({
      type: 'SPECTRUM_RENAME',
      id,
      name: draftName,
    })

    cancelRename()
  }

  const handleRenameKeyDown = (
    event: KeyboardEvent<HTMLInputElement>,
    id: string,
  ) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      saveRename(id)
    }

    if (event.key === 'Escape') {
      event.preventDefault()
      cancelRename()
    }
  }

  const handleAutoLabel = () => {
    if (renumberMode === 'extract') {
      dispatch({
        type: 'SPECTRA_RENAME_BY_EXTRACT',
        source: extractSource,
        preset: extractPreset,
        prefix: extractPrefixText,
        suffix: extractSuffix,
        ...(extractPreset === 'regex' ? { regex: extractRegex } : {}),
        ...(extractPreset === 'slice'
          ? {
              sliceStart: Number(extractSliceStart),
              sliceEnd: Number(extractSliceEnd),
              trimResult: extractTrimResult,
              numbersOnly: extractNumbersOnly,
            }
          : {}),
      })
      return
    }

    dispatch({
      type: 'SPECTRA_RENAME_ALL',
      prefix: renumberPrefix,
      mode: renumberMode,
      reverse: invertOrder,
      ...(renumberMode === 'sequence'
        ? {
            start: Number(sequenceStart),
            step: Number(sequenceStep),
            suffix: sequenceSuffix,
          }
        : {}),
    })
  }

  return (
    <div className="min-w-0 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
          Loaded
        </p>
        <button
          type="button"
          className="rounded border border-slate-300 px-1.5 py-0.5 text-xs text-slate-600 hover:bg-slate-100"
          onClick={() => dispatch({ type: 'SPECTRA_CLEAR' })}
        >
          Clear
        </button>
      </div>
      <label className="flex items-center gap-2 text-xs text-slate-700">
        <input
          type="checkbox"
          className="h-3.5 w-3.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
          checked={plot.reverseOverlayOrder}
          onChange={(event) =>
            dispatch({
              type: 'PLOT_SET',
              patch: { reverseOverlayOrder: event.currentTarget.checked },
            })
          }
          disabled={spectra.length < 2}
        />
        <span>Invert overlay order</span>
      </label>
      <p className="text-[11px] text-slate-500">Affects overlay stacking order.</p>

      <div className="flex flex-wrap items-center gap-1">
        <label className="sr-only" htmlFor="renumber-mode">
          Auto-label mode
        </label>
        <select
          id="renumber-mode"
          className="rounded border border-slate-300 px-1.5 py-0.5 text-xs text-slate-700"
          value={renumberMode}
          onChange={(event) => {
            const mode = event.currentTarget.value as RenumberMode
            setRenumberMode(mode)
            if (mode !== 'index') {
              setRenumberPrefix('')
            }
          }}
        >
          <option value="index">Numbers (1..N)</option>
          <option value="sequence">Sequence (start/step)</option>
          <option value="extract">Extract from filename</option>
        </select>

        <label className="sr-only" htmlFor="renumber-prefix">
          Auto-label prefix
        </label>
        <select
          id="renumber-prefix"
          className="rounded border border-slate-300 px-1.5 py-0.5 text-xs text-slate-700"
          value={renumberPrefix}
          onChange={(event) => setRenumberPrefix(event.currentTarget.value)}
        >
          <option value="">Numbers only</option>
          <option value="S">S</option>
          <option value="Spec ">Spec </option>
        </select>
        <button
          type="button"
          className="rounded border border-slate-300 px-1.5 py-0.5 text-xs text-slate-600 hover:bg-slate-100 disabled:cursor-default disabled:opacity-50"
          onClick={handleAutoLabel}
          disabled={spectra.length === 0}
        >
          {renumberMode === 'extract' ? 'Apply extract' : 'Renumber'}
        </button>
      </div>
      {renumberMode !== 'extract' ? (
        <label className="flex items-center gap-2 text-xs text-slate-700">
          <input
            type="checkbox"
            className="h-3.5 w-3.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
            checked={invertOrder}
            onChange={(event) => setInvertOrder(event.currentTarget.checked)}
          />
          <span>Invert order</span>
        </label>
      ) : null}
      {renumberMode === 'sequence' ? (
        <div className="grid grid-cols-3 gap-1">
          <label className="space-y-0.5">
            <span className="text-[11px] text-slate-600">Start</span>
            <input
              type="text"
              inputMode="decimal"
              className="w-full rounded border border-slate-300 px-1.5 py-0.5 text-xs text-slate-700"
              value={sequenceStart}
              onChange={(event) => setSequenceStart(event.currentTarget.value)}
            />
          </label>
          <label className="space-y-0.5">
            <span className="text-[11px] text-slate-600">Step</span>
            <input
              type="text"
              inputMode="decimal"
              className="w-full rounded border border-slate-300 px-1.5 py-0.5 text-xs text-slate-700"
              value={sequenceStep}
              onChange={(event) => setSequenceStep(event.currentTarget.value)}
            />
          </label>
          <label className="space-y-0.5">
            <span className="text-[11px] text-slate-600">Suffix</span>
            <input
              type="text"
              placeholder=" mV"
              className="w-full rounded border border-slate-300 px-1.5 py-0.5 text-xs text-slate-700"
              value={sequenceSuffix}
              onChange={(event) => setSequenceSuffix(event.currentTarget.value)}
            />
          </label>
        </div>
      ) : renumberMode === 'extract' ? (
        <div className="space-y-1">
          <div className="grid grid-cols-2 gap-1">
            <label className="space-y-0.5">
              <span className="text-[11px] text-slate-600">Source</span>
              <select
                className="w-full rounded border border-slate-300 px-1.5 py-0.5 text-xs text-slate-700"
                value={extractSource}
                onChange={(event) =>
                  setExtractSource(event.currentTarget.value as ExtractSource)
                }
              >
                <option value="filename">Filename</option>
                <option value="name">Current name</option>
              </select>
            </label>
            <label className="space-y-0.5">
              <span className="text-[11px] text-slate-600">Preset</span>
              <select
                className="w-full rounded border border-slate-300 px-1.5 py-0.5 text-xs text-slate-700"
                value={extractPreset}
                onChange={(event) =>
                  setExtractPreset(event.currentTarget.value as ExtractPreset)
                }
              >
                <option value="mv">mV token (...50mV...)</option>
                <option value="firstNumber">First number</option>
                <option value="lastNumber">Last number</option>
                <option value="regex">Custom regex</option>
                <option value="slice">Slice (start..end)</option>
              </select>
            </label>
          </div>
          {extractPreset === 'regex' ? (
            <label className="space-y-0.5">
              <span className="text-[11px] text-slate-600">Regex</span>
              <input
                type="text"
                className="w-full rounded border border-slate-300 px-1.5 py-0.5 text-xs text-slate-700"
                placeholder="(\\d+)mV"
                value={extractRegex}
                onChange={(event) => setExtractRegex(event.currentTarget.value)}
              />
            </label>
          ) : null}
          {extractPreset === 'slice' ? (
            <div className="space-y-1">
              <div className="grid grid-cols-2 gap-1">
                <label className="space-y-0.5">
                  <span className="text-[11px] text-slate-600">Start</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    className="w-full rounded border border-slate-300 px-1.5 py-0.5 text-xs text-slate-700"
                    value={extractSliceStart}
                    onChange={(event) =>
                      setExtractSliceStart(event.currentTarget.value)
                    }
                  />
                </label>
                <label className="space-y-0.5">
                  <span className="text-[11px] text-slate-600">End</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    className="w-full rounded border border-slate-300 px-1.5 py-0.5 text-xs text-slate-700"
                    value={extractSliceEnd}
                    onChange={(event) =>
                      setExtractSliceEnd(event.currentTarget.value)
                    }
                  />
                </label>
              </div>
              <label className="flex items-center gap-2 text-xs text-slate-700">
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                  checked={extractTrimResult}
                  onChange={(event) =>
                    setExtractTrimResult(event.currentTarget.checked)
                  }
                />
                <span>Trim result</span>
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-700">
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                  checked={extractNumbersOnly}
                  onChange={(event) =>
                    setExtractNumbersOnly(event.currentTarget.checked)
                  }
                />
                <span>Numbers only</span>
              </label>
              <p className="text-[11px] text-slate-500">
                Extracts the first numeric token from the sliced text (e.g.
                "_-50mV" -&gt; "-50").
              </p>
              <p className="text-[11px] text-slate-500">
                Supports negative indices (from end), e.g. -1 is last char.
                Range is [start, end) (end exclusive).
              </p>
            </div>
          ) : null}
          <div className="grid grid-cols-2 gap-1">
            <label className="space-y-0.5">
              <span className="text-[11px] text-slate-600">Prefix</span>
              <input
                type="text"
                className="w-full rounded border border-slate-300 px-1.5 py-0.5 text-xs text-slate-700"
                value={extractPrefixText}
                onChange={(event) =>
                  setExtractPrefixText(event.currentTarget.value)
                }
              />
            </label>
            <label className="space-y-0.5">
              <span className="text-[11px] text-slate-600">Suffix</span>
              <input
                type="text"
                className="w-full rounded border border-slate-300 px-1.5 py-0.5 text-xs text-slate-700"
                placeholder=" mV"
                value={extractSuffix}
                onChange={(event) => setExtractSuffix(event.currentTarget.value)}
              />
            </label>
          </div>
        </div>
      ) : null}

      {spectra.length === 0 ? (
        <p className="text-[11px] text-slate-400">No spectra loaded.</p>
      ) : (
        <ul className="space-y-1">
          {spectra.map((spectrum, index) => {
            const isActive = spectrum.id === activeSpectrumId
            const isEditing = spectrum.id === editingId
            const isFirst = index === 0
            const isLast = index === spectra.length - 1

            return (
              <li key={spectrum.id}>
                <div
                  className={[
                    'min-w-0 rounded-md border p-2',
                    isActive
                      ? 'border-sky-300 bg-sky-50'
                      : 'border-slate-200 bg-white',
                  ].join(' ')}
                >
                  {isEditing ? (
                    <div className="min-w-0 space-y-1.5">
                      <input
                        type="text"
                        autoFocus
                        value={draftName}
                        className="w-full min-w-0 rounded border border-slate-300 px-2 py-1 text-xs text-slate-700"
                        onChange={(event) => setDraftName(event.currentTarget.value)}
                        onKeyDown={(event) =>
                          handleRenameKeyDown(event, spectrum.id)
                        }
                      />
                      <p className="text-[11px] text-slate-500">
                        {spectrum.x.length} points
                      </p>
                      <div className="flex flex-wrap gap-1">
                        <button
                          type="button"
                          className="rounded border border-slate-300 px-1.5 py-0.5 text-xs text-slate-600 hover:bg-slate-100"
                          onClick={() => saveRename(spectrum.id)}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          className="rounded border border-slate-300 px-1.5 py-0.5 text-xs text-slate-600 hover:bg-slate-100"
                          onClick={cancelRename}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="min-w-0 space-y-1.5">
                      <div className="flex min-w-0 items-center justify-between gap-2">
                        <button
                          type="button"
                          className="min-w-0 flex-1 text-left"
                          onClick={() =>
                            dispatch({
                              type: 'SPECTRUM_SET_ACTIVE',
                              id: spectrum.id,
                            })
                          }
                        >
                          <span className="block truncate text-xs font-medium text-slate-700">
                            {spectrum.name}
                          </span>
                        </button>
                        <span className="shrink-0 text-[11px] text-slate-500">
                          {spectrum.x.length} points
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        <button
                          type="button"
                          className="rounded border border-slate-300 px-1.5 py-0.5 text-xs text-slate-600 hover:bg-slate-100 disabled:cursor-default disabled:opacity-50"
                          onClick={() =>
                            dispatch({
                              type: 'SPECTRUM_SET_ACTIVE',
                              id: spectrum.id,
                            })
                          }
                          disabled={isActive}
                        >
                          Select
                        </button>

                        <button
                          type="button"
                          aria-label={`Move up ${spectrum.name}`}
                          className="rounded border border-slate-300 px-1.5 py-0.5 text-xs text-slate-600 hover:bg-slate-100 disabled:cursor-default disabled:opacity-50"
                          onClick={() =>
                            dispatch({
                              type: 'SPECTRUM_MOVE',
                              id: spectrum.id,
                              direction: 'up',
                            })
                          }
                          disabled={isFirst}
                        >
                          &uarr;
                        </button>

                        <button
                          type="button"
                          aria-label={`Move down ${spectrum.name}`}
                          className="rounded border border-slate-300 px-1.5 py-0.5 text-xs text-slate-600 hover:bg-slate-100 disabled:cursor-default disabled:opacity-50"
                          onClick={() =>
                            dispatch({
                              type: 'SPECTRUM_MOVE',
                              id: spectrum.id,
                              direction: 'down',
                            })
                          }
                          disabled={isLast}
                        >
                          &darr;
                        </button>

                        <button
                          type="button"
                          className="rounded border border-slate-300 px-1.5 py-0.5 text-xs text-slate-600 hover:bg-slate-100"
                          onClick={() => {
                            setEditingId(spectrum.id)
                            setDraftName(spectrum.name)
                          }}
                        >
                          Rename
                        </button>

                        <button
                          type="button"
                          className="rounded border border-red-200 px-1.5 py-0.5 text-xs text-red-600 hover:bg-red-50"
                          onClick={() =>
                            dispatch({ type: 'SPECTRUM_REMOVE', id: spectrum.id })
                          }
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

