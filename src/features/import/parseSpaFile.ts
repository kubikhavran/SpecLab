import type { Spectrum, Peak } from '../../app/types/core'

export interface SpaParseResult {
  spectrum: Spectrum
  peaks: Peak[]
}

/* ── helpers ─────────────────────────────────────────── */

const SPA_MAGIC = 'Spectral Data Fi'
const DIR_START = 0x130
const DIR_ENTRY_SIZE = 16

const BLOCK_PARAMS = 0x0002
const BLOCK_SPECTRAL = 0x0003
const BLOCK_PEAKS = 0x0068

interface DirEntry {
  type: number
  offset: number
  size: number
}

function readDirectory(view: DataView, fileSize: number): DirEntry[] {
  const entries: DirEntry[] = []
  let pos = DIR_START

  while (pos + DIR_ENTRY_SIZE <= fileSize) {
    const type = view.getUint16(pos, true)
    const offset = view.getUint32(pos + 2, true)
    const size = view.getUint32(pos + 6, true)

    if (type === 0 && offset === 0 && size === 0) break
    entries.push({ type, offset, size })
    pos += DIR_ENTRY_SIZE
  }

  return entries
}

function createSpectrumId(): string {
  if (
    typeof globalThis.crypto !== 'undefined' &&
    typeof globalThis.crypto.randomUUID === 'function'
  ) {
    return globalThis.crypto.randomUUID()
  }
  return `sp_${Date.now()}_${Math.random().toString(16).slice(2)}`
}

function createPeakId(): string {
  return `pk_${Date.now()}_${Math.random().toString(16).slice(2, 10)}`
}

function getSpectrumName(fileName: string): string {
  const trimmed = fileName.trim()
  const dotIndex = trimmed.lastIndexOf('.')
  return dotIndex > 0 ? trimmed.slice(0, dotIndex) : (trimmed || 'SPA spectrum')
}

/* ── parsers ─────────────────────────────────────────── */

function parseParams(
  view: DataView,
  entry: DirEntry,
): { numPoints: number; firstX: number; lastX: number } {
  const base = entry.offset
  const numPoints = view.getUint32(base + 4, true)
  const firstX = view.getFloat32(base + 16, true)
  const lastX = view.getFloat32(base + 20, true)

  if (
    numPoints === 0 ||
    !Number.isFinite(firstX) ||
    !Number.isFinite(lastX)
  ) {
    throw new Error(
      'Invalid SPA parameters: numPoints, firstX, or lastX are invalid.',
    )
  }

  return { numPoints, firstX, lastX }
}

function parseSpectralData(
  view: DataView,
  entry: DirEntry,
  numPoints: number,
): number[] {
  const expectedSize = numPoints * 4
  if (entry.size < expectedSize) {
    throw new Error(
      `SPA spectral block too small: expected ${expectedSize} bytes for ${numPoints} points, got ${entry.size}.`,
    )
  }

  const y: number[] = new Array(numPoints)
  let offset = entry.offset
  for (let i = 0; i < numPoints; i++) {
    y[i] = view.getFloat32(offset, true)
    offset += 4
  }
  return y
}

function buildXAxis(
  firstX: number,
  lastX: number,
  numPoints: number,
): number[] {
  const x: number[] = new Array(numPoints)
  const step = (lastX - firstX) / (numPoints - 1)
  for (let i = 0; i < numPoints; i++) {
    x[i] = firstX + i * step
  }
  return x
}

function parsePeaks(
  view: DataView,
  uint8: Uint8Array,
  entry: DirEntry,
): Peak[] {
  const base = entry.offset
  const blockEnd = base + entry.size
  const peakCount = view.getUint32(base, true)

  if (peakCount === 0 || peakCount > 10_000) return []

  const peaks: Peak[] = []
  let pos = base + 4

  for (let i = 0; i < peakCount; i++) {
    if (pos + 14 >= blockEnd) break

    // Skip flags (2 bytes at pos+0)
    const peakX = view.getFloat32(pos + 2, true)
    // Skip peakX2 (4 bytes at pos+6)
    const peakY = view.getFloat32(pos + 10, true)

    // Read null-terminated ASCII label
    let labelEnd = pos + 14
    while (labelEnd < blockEnd && uint8[labelEnd] !== 0) {
      labelEnd++
    }

    // Advance past null terminator
    const nextPos = labelEnd + 1

    if (!Number.isFinite(peakX) || !Number.isFinite(peakY)) {
      // Skip malformed entry
      pos = nextPos
      continue
    }

    peaks.push({
      id: createPeakId(),
      x: peakX,
      source: 'imported' as const,
    })

    pos = nextPos
  }

  return peaks
}

/* ── main export ─────────────────────────────────────── */

export function parseSpaFile(
  buffer: ArrayBuffer,
  fileName: string,
): SpaParseResult {
  if (buffer.byteLength < DIR_START + DIR_ENTRY_SIZE) {
    throw new Error(
      `File "${fileName}" is too small to be a valid SPA file.`,
    )
  }

  const view = new DataView(buffer)
  const uint8 = new Uint8Array(buffer)

  // Validate magic header
  const magic = String.fromCharCode(...uint8.slice(0, SPA_MAGIC.length))
  if (magic !== SPA_MAGIC) {
    throw new Error(
      `File "${fileName}" is not a valid Thermo/Nicolet SPA file.`,
    )
  }

  // Read block directory
  const dir = readDirectory(view, buffer.byteLength)
  if (dir.length === 0) {
    throw new Error(`File "${fileName}": empty SPA block directory.`)
  }

  // Find required blocks
  const paramsEntry = dir.find((e) => e.type === BLOCK_PARAMS)
  const spectralEntry = dir.find((e) => e.type === BLOCK_SPECTRAL)

  if (!paramsEntry) {
    throw new Error(
      `File "${fileName}": missing SPA parameters block (type 0x0002).`,
    )
  }
  if (!spectralEntry) {
    throw new Error(
      `File "${fileName}": missing SPA spectral data block (type 0x0003).`,
    )
  }

  // Parse parameters
  const { numPoints, firstX, lastX } = parseParams(view, paramsEntry)

  // Parse spectral Y data
  const y = parseSpectralData(view, spectralEntry, numPoints)

  // Build X axis by linear interpolation
  const x = buildXAxis(firstX, lastX, numPoints)

  // Parse peaks (optional — block may not exist)
  const peaksEntry = dir.find((e) => e.type === BLOCK_PEAKS)
  const peaks = peaksEntry ? parsePeaks(view, uint8, peaksEntry) : []

  const spectrum: Spectrum = {
    id: createSpectrumId(),
    name: getSpectrumName(fileName),
    x,
    y,
    meta: {
      sourceFile: fileName,
      format: 'spa',
      points: numPoints,
      firstX,
      lastX,
      parsedAt: new Date().toISOString(),
      importedPeakCount: peaks.length,
    },
  }

  return { spectrum, peaks }
}
