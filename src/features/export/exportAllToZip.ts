import JSZip from 'jszip'
import type { Spectrum } from '../../app/types/core'
import { downloadBlobFile } from '../../lib/downloadBlobFile'
import { spectrumToDelimitedText } from './exportSpectrumData'

type ExportAllToZipOptions = {
  spectra: Spectrum[]
  delimiter: ';' | '\t'
  decimalComma: boolean
  zipFileName: string
}

function sanitizeName(rawName: string): string {
  const cleaned = rawName
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[\\/:*?"<>|]/g, '')

  return cleaned.length > 0 ? cleaned : 'spectrum'
}

export async function exportAllToZip(options: ExportAllToZipOptions) {
  const { spectra, delimiter, decimalComma, zipFileName } = options
  const zip = new JSZip()
  const usedNames = new Set<string>()
  const extension = delimiter === ';' ? 'csv' : 'tsv'

  for (const spectrum of spectra) {
    const text = spectrumToDelimitedText({
      spectrum,
      delimiter,
      decimalComma,
    })

    const baseName = sanitizeName(spectrum.name)
    let fileName = `${baseName}.${extension}`
    let suffix = 2

    while (usedNames.has(fileName)) {
      fileName = `${baseName}_${suffix}.${extension}`
      suffix += 1
    }

    usedNames.add(fileName)
    zip.file(fileName, text)
  }

  const blob = await zip.generateAsync({ type: 'blob' })
  downloadBlobFile(zipFileName, blob, 'application/zip')
}
