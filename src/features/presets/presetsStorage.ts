import type { Preset, PresetPayload } from '../../app/types/core'

const PRESETS_STORAGE_KEY = 'speclab.presets.v1'

type PresetsStorageEnvelope = {
  version: 1
  presets: Preset[]
  activePresetId: string | null
}

type PresetsState = {
  presets: Preset[]
  activePresetId: string | null
}

const EMPTY_PRESETS_STATE: PresetsState = {
  presets: [],
  activePresetId: null,
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isPayload(value: unknown): value is PresetPayload {
  if (!isObject(value)) {
    return false
  }

  return (
    (value.themeMode === 'system' ||
      value.themeMode === 'light' ||
      value.themeMode === 'dark') &&
    isObject(value.plot) &&
    isObject(value.graphics) &&
    isObject(value.baseline) &&
    isObject(value.smoothing) &&
    isObject(value.cosmic) &&
    isObject(value.dataLabeling)
  )
}

function isPreset(value: unknown): value is Preset {
  if (!isObject(value)) {
    return false
  }

  return (
    typeof value.id === 'string' &&
    value.id.length > 0 &&
    typeof value.name === 'string' &&
    Number.isFinite(value.createdAt) &&
    Number.isFinite(value.updatedAt) &&
    isPayload(value.payload)
  )
}

export function loadPresetsFromStorage(): PresetsState {
  if (typeof window === 'undefined') {
    return EMPTY_PRESETS_STATE
  }

  try {
    const raw = window.localStorage.getItem(PRESETS_STORAGE_KEY)
    if (!raw) {
      return EMPTY_PRESETS_STATE
    }

    const parsed: unknown = JSON.parse(raw)
    if (!isObject(parsed) || parsed.version !== 1 || !Array.isArray(parsed.presets)) {
      return EMPTY_PRESETS_STATE
    }

    const presets = parsed.presets.filter(isPreset)
    const activePresetId =
      typeof parsed.activePresetId === 'string' &&
      presets.some((preset) => preset.id === parsed.activePresetId)
        ? parsed.activePresetId
        : null

    return {
      presets,
      activePresetId,
    }
  } catch {
    return EMPTY_PRESETS_STATE
  }
}

export function savePresetsToStorage(
  presets: Preset[],
  activePresetId: string | null,
) {
  if (typeof window === 'undefined') {
    return
  }

  const payload: PresetsStorageEnvelope = {
    version: 1,
    presets,
    activePresetId,
  }

  try {
    window.localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // Ignore persistence failures in restricted browser modes.
  }
}
