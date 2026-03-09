import type { ChangeEvent } from 'react'
import { useRef, useState } from 'react'
import { useAppDispatch } from '../../app/state/AppStore'
import { parseSpectrumText } from './parseSpectrumText'
import { parseSpaFile } from './parseSpaFile'

export function ImportSpectrum() {
  const dispatch = useAppDispatch()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [errors, setErrors] = useState<string[]>([])

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.currentTarget.files

    if (!selectedFiles || selectedFiles.length === 0) {
      return
    }

    setErrors([])
    const files = Array.from(selectedFiles)
    const nextErrors: string[] = []

    for (const file of files) {
      try {
        const isSpa = file.name.toLowerCase().endsWith('.spa')

        if (isSpa) {
          const buffer = await file.arrayBuffer()
          const result = parseSpaFile(buffer, file.name)
          const spectrum = {
            ...result.spectrum,
            meta: {
              ...(result.spectrum.meta ?? {}),
              sourceName: file.name,
            },
          }

          dispatch({ type: 'SPECTRUM_ADD', spectrum })

          if (result.peaks.length > 0) {
            dispatch({
              type: 'PEAKS_SET_MANUAL',
              spectrumId: spectrum.id,
              peaks: result.peaks,
            })
            dispatch({
              type: 'PEAKS_SET',
              patch: { enabled: true, showLabels: true, showMarkers: true },
            })
          }
        } else {
          const text = await file.text()
          const parsedSpectrum = parseSpectrumText(text, file.name)
          const spectrum = {
            ...parsedSpectrum,
            meta: {
              ...(parsedSpectrum.meta ?? {}),
              sourceName: file.name,
            },
          }

          dispatch({ type: 'SPECTRUM_ADD', spectrum })
        }
      } catch (importError) {
        const message =
          importError instanceof Error
            ? importError.message
            : 'Spectrum import failed.'

        nextErrors.push(`${file.name}: ${message}`)
      }
    }

    setErrors(nextErrors)

    if (inputRef.current) {
      inputRef.current.value = ''
    } else {
      event.currentTarget.value = ''
    }
  }

  return (
    <div className="space-y-2">
      <label className="inline-flex cursor-pointer items-center rounded-md border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100">
        Import .txt/.csv/.spa
        <input
          ref={inputRef}
          className="hidden"
          type="file"
          multiple
          accept=".txt,.csv,.spa,text/plain"
          onChange={handleFileChange}
        />
      </label>

      <p className="text-[11px] text-slate-500">
        TXT/CSV: first two numeric columns as x/y. SPA (Thermo/OMNIC):
        binary format with peaks if present. Select multiple files
        (Ctrl/Shift).
      </p>

      {errors.length > 0 ? (
        <ul className="space-y-1 text-[11px] text-red-600">
          {errors.map((error, index) => (
            <li key={`${error}-${index}`}>{error}</li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
