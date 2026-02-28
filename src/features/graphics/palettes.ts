import type { GraphicsPalette } from '../../app/types/core'

const colorblindPalette = [
  '#0072B2',
  '#D55E00',
  '#009E73',
  '#CC79A7',
  '#F0E442',
  '#56B4E9',
  '#E69F00',
  '#000000',
]

const tableau10Palette = [
  '#4E79A7',
  '#F28E2B',
  '#E15759',
  '#76B7B2',
  '#59A14F',
  '#EDC948',
  '#B07AA1',
  '#FF9DA7',
  '#9C755F',
  '#BAB0AC',
]

const set2Palette = [
  '#66C2A5',
  '#FC8D62',
  '#8DA0CB',
  '#E78AC3',
  '#A6D854',
  '#FFD92F',
  '#E5C494',
  '#B3B3B3',
]

const dark2Palette = [
  '#1B9E77',
  '#D95F02',
  '#7570B3',
  '#E7298A',
  '#66A61E',
  '#E6AB02',
  '#A6761D',
  '#666666',
]

const pairedPalette = [
  '#A6CEE3',
  '#1F78B4',
  '#B2DF8A',
  '#33A02C',
  '#FB9A99',
  '#E31A1C',
  '#FDBF6F',
  '#FF7F00',
  '#CAB2D6',
  '#6A3D9A',
  '#FFFF99',
  '#B15928',
]

const accentPalette = [
  '#7FC97F',
  '#BEAED4',
  '#FDC086',
  '#FFFF99',
  '#386CB0',
  '#F0027F',
  '#BF5B17',
  '#666666',
]

const pastel1Palette = [
  '#FBB4AE',
  '#B3CDE3',
  '#CCEBC5',
  '#DECBE4',
  '#FED9A6',
  '#FFFFCC',
  '#E5D8BD',
  '#FDDAEC',
  '#F2F2F2',
]

const pastel2Palette = [
  '#B3E2CD',
  '#FDCDAC',
  '#CBD5E8',
  '#F4CAE4',
  '#E6F5C9',
  '#FFF2AE',
  '#F1E2CC',
  '#CCCCCC',
]

const viridisPalette = [
  '#440154',
  '#482878',
  '#3E4989',
  '#31688E',
  '#26828E',
  '#1F9E89',
  '#35B779',
  '#6CCE59',
  '#B4DE2C',
  '#FDE725',
]

const plasmaPalette = [
  '#0D0887',
  '#41049D',
  '#6A00A8',
  '#8F0DA4',
  '#B12A90',
  '#CC4778',
  '#E16462',
  '#F2844B',
  '#FCA636',
  '#F0F921',
]

const magmaPalette = [
  '#000004',
  '#1B0C41',
  '#4F0A6D',
  '#781C6D',
  '#A52C60',
  '#CF4446',
  '#ED6925',
  '#FB9B06',
  '#F7D13D',
  '#FCFDBF',
]

const cividisPalette = [
  '#00204C',
  '#00306F',
  '#2A3F85',
  '#4A4C8C',
  '#67598E',
  '#81658A',
  '#9A7083',
  '#B37C78',
  '#CC886B',
  '#E69B5E',
]

const monoPalette = [
  '#111827',
  '#1F2937',
  '#374151',
  '#4B5563',
  '#6B7280',
  '#9CA3AF',
  '#D1D5DB',
  '#E5E7EB',
]

const neonPalette = [
  '#00E5FF',
  '#FF00E5',
  '#7CFF00',
  '#FFD500',
  '#FF3B30',
  '#5E5CE6',
  '#00FF9C',
  '#FF6B00',
]

export function getPaletteColors(palette: GraphicsPalette): string[] | null {
  switch (palette) {
    case 'auto':
      return null
    case 'colorblind':
      return colorblindPalette
    case 'tableau10':
      return tableau10Palette
    case 'set2':
      return set2Palette
    case 'dark2':
      return dark2Palette
    case 'paired':
      return pairedPalette
    case 'accent':
      return accentPalette
    case 'pastel1':
      return pastel1Palette
    case 'pastel2':
      return pastel2Palette
    case 'viridis':
      return viridisPalette
    case 'plasma':
      return plasmaPalette
    case 'magma':
      return magmaPalette
    case 'cividis':
      return cividisPalette
    case 'mono':
      return monoPalette
    case 'neon':
      return neonPalette
    default:
      return null
  }
}
