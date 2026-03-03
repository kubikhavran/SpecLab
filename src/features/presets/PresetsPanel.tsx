import type { KeyboardEvent } from 'react'
import { useMemo, useState } from 'react'
import { useAppDispatch, useAppState } from '../../app/state/AppStore'
import {
  DEFAULT_LABEL_EXTRACT_SETTINGS,
  type DataLabelingSettings,
  type Preset,
} from '../../app/types/core'
import { applyBaseline } from '../baseline/applyBaseline'
import { aslsBaseline } from '../baseline/aslsBaseline'
import { removeCosmicRays } from '../cosmic/removeCosmicRays'
import { extractLabelFromFilename } from '../import/extractLabelFromFilename'
import { savgolSmooth } from '../smoothing/savgol'

const APPLY_ALL_YIELD_EVERY = 4

function clampPolyOrder(polyOrder: number, window: number): number {
  const minValue = 2
  const maxValue = Math.min(5, Math.max(minValue, window - 1))

  return Math.min(maxValue, Math.max(minValue, Math.round(polyOrder)))
}

function yieldToMainThread(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 0)
  })
}

function resolveLabelExtractSettings(
  dataLabeling: DataLabelingSettings,
) {
  return {
    ...DEFAULT_LABEL_EXTRACT_SETTINGS,
    ...dataLabeling.labelExtract,
  }
}

export function PresetsPanel() {
  const { spectra, presets, activePresetId } = useAppState()
  const dispatch = useAppDispatch()
  const [newPresetName, setNewPresetName] = useState('')
  const [renameId, setRenameId] = useState<string | null>(null)
  const [renameDraft, setRenameDraft] = useState('')
  const [isApplyingAll, setIsApplyingAll] = useState(false)

  const activePreset = useMemo(
    () => presets.find((preset) => preset.id === activePresetId) ?? null,
    [activePresetId, presets],
  )

  const handleCreatePreset = () => {
    dispatch({
      type: 'PRESET_CREATE_FROM_CURRENT',
      name: newPresetName,
    })
    setNewPresetName('')
  }

  const beginRename = (id: string, currentName: string) => {
    setRenameId(id)
    setRenameDraft(currentName)
  }

  const cancelRename = () => {
    setRenameId(null)
    setRenameDraft('')
  }

  const commitRename = (id: string) => {
    dispatch({
      type: 'PRESET_RENAME',
      id,
      name: renameDraft,
    })
    cancelRename()
  }

  const handleRenameKeyDown = (
    event: KeyboardEvent<HTMLInputElement>,
    id: string,
  ) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      commitRename(id)
      return
    }

    if (event.key === 'Escape') {
      event.preventDefault()
      cancelRename()
    }
  }

  const handleDeletePreset = (id: string, name: string) => {
    if (!window.confirm(`Delete preset "${name}"?`)) {
      return
    }

    dispatch({
      type: 'PRESET_DELETE',
      id,
    })

    if (renameId === id) {
      cancelRename()
    }
  }

  const handleApplyAllSettings = async (preset: Preset) => {
    if (isApplyingAll) {
      return
    }

    setIsApplyingAll(true)
    try {
      dispatch({
        type: 'PRESET_APPLY_SETTINGS',
        id: preset.id,
      })

      const labelExtract = resolveLabelExtractSettings(preset.payload.dataLabeling)
      for (let index = 0; index < spectra.length; index += 1) {
        const spectrum = spectra[index]
        const sourceName =
          typeof spectrum.meta?.sourceName === 'string'
            ? spectrum.meta.sourceName
            : ''
        const nextLabel = extractLabelFromFilename(sourceName, labelExtract)

        if (nextLabel !== null && nextLabel !== spectrum.name) {
          dispatch({
            type: 'SPECTRUM_RENAME',
            id: spectrum.id,
            name: nextLabel,
          })
        }
      }

      dispatch({ type: 'COSMIC_RESET_ALL' })

      const cosmicSettings = preset.payload.cosmic
      const baselineSettings = preset.payload.baseline
      const smoothingSettings = preset.payload.smoothing
      const clampedPolyOrder = clampPolyOrder(
        smoothingSettings.polyOrder,
        smoothingSettings.window,
      )

      for (let index = 0; index < spectra.length; index += 1) {
        const spectrum = spectra[index]
        const cosmicResult = removeCosmicRays(spectrum.y, {
          window: cosmicSettings.window,
          threshold: cosmicSettings.threshold,
          maxWidth: cosmicSettings.maxWidth,
          positiveOnly: cosmicSettings.positiveOnly,
          iterations: cosmicSettings.iterations,
        })

        dispatch({
          type: 'SPECTRUM_SET_COSMIC_CLEANED_Y',
          spectrumId: spectrum.id,
          yClean: cosmicResult.yClean,
          removedCount: cosmicResult.removedCount,
        })

        const baselineY = aslsBaseline(
          cosmicResult.yClean,
          baselineSettings.lambda,
          baselineSettings.p,
          baselineSettings.iterations,
        )
        const processedY = applyBaseline(cosmicResult.yClean, baselineY)

        dispatch({
          type: 'SPECTRUM_SET_PROCESSED',
          id: spectrum.id,
          processedY,
          baselineY,
        })

        const smoothedY = savgolSmooth(
          processedY,
          smoothingSettings.window,
          clampedPolyOrder,
        )
        dispatch({
          type: 'SPECTRUM_SET_SMOOTHED_Y',
          id: spectrum.id,
          smoothedY,
        })

        if ((index + 1) % APPLY_ALL_YIELD_EVERY === 0) {
          await yieldToMainThread()
        }
      }

      dispatch({
        type: 'BASELINE_SET',
        patch: { enabled: true },
      })
      dispatch({
        type: 'SMOOTHING_SET',
        patch: { polyOrder: clampedPolyOrder },
      })
    } finally {
      setIsApplyingAll(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        <input
          type="text"
          className="min-w-0 flex-1 rounded border border-slate-300 px-2 py-1 text-xs text-slate-700"
          placeholder="Preset name"
          value={newPresetName}
          onChange={(event) => setNewPresetName(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              handleCreatePreset()
            }
          }}
        />
        <button
          type="button"
          className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-100"
          disabled={isApplyingAll}
          onClick={handleCreatePreset}
        >
          Create preset
        </button>
      </div>

      {presets.length === 0 ? (
        <p className="text-[11px] text-slate-400">No presets yet.</p>
      ) : (
        <ul className="space-y-1">
          {presets.map((preset) => {
            const isActive = preset.id === activePresetId
            const isRenaming = preset.id === renameId

            return (
              <li
                key={preset.id}
                className={[
                  'rounded border p-2',
                  isActive
                    ? 'border-sky-300 bg-sky-50'
                    : 'border-slate-200 bg-white',
                ].join(' ')}
              >
                {isRenaming ? (
                  <div className="space-y-1">
                    <input
                      type="text"
                      autoFocus
                      className="w-full rounded border border-slate-300 px-2 py-1 text-xs text-slate-700"
                      value={renameDraft}
                      onChange={(event) =>
                        setRenameDraft(event.currentTarget.value)
                      }
                      onKeyDown={(event) =>
                        handleRenameKeyDown(event, preset.id)
                      }
                    />
                    <div className="flex flex-wrap gap-1">
                      <button
                        type="button"
                        className="rounded border border-slate-300 px-2 py-0.5 text-xs text-slate-700 hover:bg-slate-100"
                        onClick={() => commitRename(preset.id)}
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        className="rounded border border-slate-300 px-2 py-0.5 text-xs text-slate-700 hover:bg-slate-100"
                        onClick={cancelRename}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-xs font-medium text-slate-700">
                        {preset.name}
                      </span>
                      {isActive ? (
                        <span className="rounded bg-sky-100 px-1.5 py-0.5 text-[10px] font-medium text-sky-700">
                          Active
                        </span>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      <button
                        type="button"
                        className="rounded border border-slate-300 px-2 py-0.5 text-xs text-slate-700 hover:bg-slate-100"
                        disabled={isApplyingAll}
                        onClick={() =>
                          dispatch({
                            type: 'PRESET_SET_ACTIVE',
                            id: preset.id,
                          })
                        }
                      >
                        Select
                      </button>
                      <button
                        type="button"
                        className="rounded border border-slate-300 px-2 py-0.5 text-xs text-slate-700 hover:bg-slate-100"
                        disabled={isApplyingAll}
                        onClick={() => beginRename(preset.id, preset.name)}
                      >
                        Rename
                      </button>
                      <button
                        type="button"
                        className="rounded border border-slate-300 px-2 py-0.5 text-xs text-slate-700 hover:bg-slate-100"
                        disabled={isApplyingAll}
                        onClick={() =>
                          dispatch({
                            type: 'PRESET_DUPLICATE',
                            id: preset.id,
                          })
                        }
                      >
                        Duplicate
                      </button>
                      <button
                        type="button"
                        className="rounded border border-red-200 px-2 py-0.5 text-xs text-red-600 hover:bg-red-50"
                        disabled={isApplyingAll}
                        onClick={() => handleDeletePreset(preset.id, preset.name)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}

      <div className="flex flex-wrap gap-1 border-t border-slate-200 pt-2">
        <button
          type="button"
          className="rounded border border-slate-300 px-2 py-0.5 text-xs text-slate-700 hover:bg-slate-100 disabled:cursor-default disabled:opacity-50"
          disabled={!activePreset || isApplyingAll}
          onClick={() => {
            if (!activePreset) {
              return
            }

            dispatch({
              type: 'PRESET_APPLY_SETTINGS',
              id: activePreset.id,
            })
          }}
        >
          Apply settings
        </button>
        <button
          type="button"
          className="rounded border border-slate-300 px-2 py-0.5 text-xs text-slate-700 hover:bg-slate-100 disabled:cursor-default disabled:opacity-50"
          disabled={!activePreset || isApplyingAll}
          onClick={() => {
            if (!activePreset) {
              return
            }

            void handleApplyAllSettings(activePreset)
          }}
        >
          Apply ALL settings
        </button>
      </div>
      {isApplyingAll ? (
        <p className="text-[11px] text-slate-500">Applying preset to all spectra...</p>
      ) : null}
    </div>
  )
}
