import type { KeyboardEvent } from 'react'
import { useState } from 'react'
import { useAppDispatch, useAppState } from '../../app/state/AppStore'

export function SpectrumList() {
  const { spectra, activeSpectrumId } = useAppState()
  const dispatch = useAppDispatch()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draftName, setDraftName] = useState('')

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

  if (spectra.length === 0) {
    return <p className="text-[11px] text-slate-400">No spectra loaded.</p>
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
                      onKeyDown={(event) => handleRenameKeyDown(event, spectrum.id)}
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
    </div>
  )
}
