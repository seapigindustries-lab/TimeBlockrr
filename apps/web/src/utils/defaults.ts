import type { Settings, Tag } from '../types'

export const defaultSettings: Settings = {
  skin: 'glassmorphism',
  theme: 'light',
  weekStartsOnSunday: true,
  defaultStartHour: 6,
  defaultEndHour: 23,
  timeIncrement: 30,
  pushBlocksOnDrag: false,
  use24Hour: false,
  colorBlindMode: 'none'
}

export const defaultTags: Tag[] = [
  { id: '1', name: 'Work', color: '#4A90D9', isBuffer: false },
  { id: '2', name: 'Sleep', color: '#5CB85C', isBuffer: false },
  { id: '3', name: 'Exercise', color: '#9B7FD9', isBuffer: false },
  { id: '4', name: 'Meals', color: '#F0AD4E', isBuffer: false },
  { id: '5', name: 'Personal', color: '#D9534F', isBuffer: false },
  { id: '6', name: 'Commute', color: '#6B6B6B', isBuffer: false }
]

export const defaultPalettes: Record<string, string[]> = {
  'Pastels': ['#FFB3BA', '#BAFFC9', '#BAE1FF', '#FFFFBA', '#FFD9BA', '#E8BAFF', '#C9BAFF', '#FFC9E8', '#C9FFFF', '#E8FFC9'],
  'Primaries': ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FF8800', '#8800FF', '#FF0088', '#88FF00'],
  'Secondaries': ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'],
  'Windows 95': ['#000080', '#008080', '#C0C0C0', '#808080', '#FFFFFF', '#000000', '#808000', '#800080', '#800000', '#008000'],
  'Windows XP': ['#1F4F91', '#3A6EA5', '#EDE7D9', '#A0A0A0', '#F5F5F5', '#2C2C2C', '#6B8E23', '#E6B8AF', '#9DC3E6', '#C5D9F1'],
  'Windows 10': ['#0078D4', '#106EBE', '#2D2D2D', '#767676', '#FFFFFF', '#005A9E', '#004275', '#00CC6A', '#E3008C', '#FFB900'],
  'Windows Vista': ['#1B3F6E', '#2E75B5', '#F0F0F0', '#757575', '#FFFFFF', '#003C6E', '#002B4D', '#5499C7', '#A9CCE3', '#D4E6F1']
}
