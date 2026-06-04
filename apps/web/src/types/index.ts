export interface Tag {
  id: string
  name: string
  color: string
  isBuffer: boolean
}

export type RecurrenceType = 'none' | 'daily' | 'weekdays' | 'weekends' | 'weekly' | 'biweekly' | 'monthly' | 'monthly-day' | 'monthly-weekday' | 'yearly'

export interface RecurrenceRule {
  type: RecurrenceType
  endDate?: string // ISO date string for when recurrence ends
  occurrences?: number // Number of times to repeat
}

export interface TimeBlock {
  id: string
  name: string
  tagId: string
  dayOfWeek: number
  startTime: string // HH:mm format
  endTime: string // HH:mm format - calculated from startTime + duration
  duration: number // in minutes
  notes?: string
  weekOffset: number
  recurrence?: RecurrenceRule
  isRecurringInstance?: boolean // True if this is a generated instance
  parentId?: string // ID of the original block if this is an instance
}

export type Skin = 'glassmorphism' | 'warm-minimalism'

export interface Settings {
  skin: Skin
  theme: 'light' | 'dark' | 'business'
  weekStartsOnSunday: boolean
  defaultStartHour: number
  defaultEndHour: number
  timeIncrement: 15 | 30 | 60 | 'freeform'
  pushBlocksOnDrag: boolean
  use24Hour: boolean
  colorBlindMode: 'none' | 'deuteranopia' | 'protanopia' | 'tritanopia' | 'achromatopsia'
}

export interface AppData {
  settings: Settings
  tags: Tag[]
  timeBlocks: TimeBlock[]
  hasCompletedSetup: boolean
}
