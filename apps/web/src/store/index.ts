import { create } from 'zustand'
import type { AppData, Settings, Tag, TimeBlock } from '../types'
import { defaultSettings, defaultTags } from '../utils/defaults'
import { splitBlockOnDayBoundary } from '../utils/time'

const STORAGE_KEY = 'timeblockrr-data'

interface AppStore extends AppData {
  isLoading: boolean
  selectedBlockId: string | null
  setLoading: (loading: boolean) => void
  setSelectedBlockId: (id: string | null) => void
  setSettings: (settings: Partial<Settings>) => void
  setTags: (tags: Tag[]) => void
  addTag: (tag: Tag) => void
  updateTag: (id: string, updates: Partial<Tag>) => void
  deleteTag: (id: string) => void
  setTimeBlocks: (blocks: TimeBlock[]) => void
  addTimeBlock: (block: TimeBlock) => void
  updateTimeBlock: (id: string, updates: Partial<TimeBlock>) => void
  updateRecurringBlocks: (parentId: string, updates: Partial<TimeBlock>) => void
  deleteTimeBlock: (id: string) => void
  setHasCompletedSetup: (value: boolean) => void
  loadData: () => Promise<void>
  saveData: () => Promise<void>
}

const loadFromStorage = (): AppData | null => {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (data) {
      return JSON.parse(data)
    }
  } catch (error) {
    console.error('Failed to load data from localStorage:', error)
  }
  return null
}

const saveToStorage = (data: AppData): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (error) {
    console.error('Failed to save data to localStorage:', error)
  }
}

export const useAppStore = create<AppStore>((set, get) => ({
  settings: defaultSettings,
  tags: defaultTags,
  timeBlocks: [],
  hasCompletedSetup: false,
  isLoading: true,
  selectedBlockId: null,

  setLoading: (loading) => set({ isLoading: loading }),

  setSelectedBlockId: (id) => set({ selectedBlockId: id }),

  setSettings: (newSettings) => {
    set((state) => ({ settings: { ...state.settings, ...newSettings } }))
    get().saveData()
  },

  setTags: (tags) => {
    set({ tags })
    get().saveData()
  },

  addTag: (tag) => {
    set((state) => ({ tags: [...state.tags, tag] }))
    get().saveData()
  },

  updateTag: (id, updates) => {
    set((state) => ({
      tags: state.tags.map((t) => (t.id === id ? { ...t, ...updates } : t))
    }))
    get().saveData()
  },

  deleteTag: (id) => {
    set((state) => ({ tags: state.tags.filter((t) => t.id !== id) }))
    get().saveData()
  },

  setTimeBlocks: (blocks) => {
    set({ timeBlocks: blocks })
    get().saveData()
  },

  addTimeBlock: (block) => {
    // Split block if it would overflow to next day
    const blocksToAdd = splitBlockOnDayBoundary(block)
    set((state) => ({ timeBlocks: [...state.timeBlocks, ...blocksToAdd] }))
    get().saveData()
  },

  updateTimeBlock: (id, updates) => {
    set((state) => {
      // First, find the block to update
      const blockToUpdate = state.timeBlocks.find(b => b.id === id)
      if (!blockToUpdate) return state
      
      // Calculate updated block
      const newStartTime = updates.startTime ?? blockToUpdate.startTime
      const newEndTime = updates.endTime ?? blockToUpdate.endTime
      const newDuration = updates.duration ?? blockToUpdate.duration
      
      let calculatedUpdates: Partial<TimeBlock> = {}
      
      if (updates.startTime && !updates.endTime && !updates.duration) {
        const [startH, startM] = newStartTime.split(':').map(Number)
        const totalStartMinutes = startH * 60 + startM
        const totalEndMinutes = totalStartMinutes + newDuration
        const endH = Math.floor(totalEndMinutes / 60) % 24
        const endM = totalEndMinutes % 60
        calculatedUpdates.endTime = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`
      } else if (updates.endTime && !updates.startTime && !updates.duration) {
        const [startH, startM] = newStartTime.split(':').map(Number)
        const [endH, endM] = newEndTime.split(':').map(Number)
        let duration = (endH * 60 + endM) - (startH * 60 + startM)
        if (duration < 0) duration += 24 * 60
        calculatedUpdates.duration = duration
      } else if (updates.duration && !updates.startTime && !updates.endTime) {
        const [startH, startM] = newStartTime.split(':').map(Number)
        const totalStartMinutes = startH * 60 + startM
        const totalEndMinutes = totalStartMinutes + newDuration
        const endH = Math.floor(totalEndMinutes / 60) % 24
        const endM = totalEndMinutes % 60
        calculatedUpdates.endTime = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`
      } else if ((updates.startTime && updates.endTime) || (updates.startTime && updates.duration) || (updates.endTime && updates.duration)) {
        const [startH, startM] = newStartTime.split(':').map(Number)
        const [endH, endM] = newEndTime.split(':').map(Number)
        let calculatedDuration = (endH * 60 + endM) - (startH * 60 + startM)
        if (calculatedDuration < 0) calculatedDuration += 24 * 60
          
        if (updates.duration && (updates.startTime || !updates.endTime)) {
          const totalStartMinutes = startH * 60 + startM
          const totalEndMinutes = totalStartMinutes + newDuration
          const calcEndH = Math.floor(totalEndMinutes / 60) % 24
          const calcEndM = totalEndMinutes % 60
          calculatedUpdates.endTime = `${calcEndH.toString().padStart(2, '0')}:${calcEndM.toString().padStart(2, '0')}`
        } else {
          calculatedUpdates.duration = calculatedDuration
        }
      }
      
      const updatedBlock = { ...blockToUpdate, ...updates, ...calculatedUpdates }
      
      // Check if block would overflow and split if necessary
      const blocksToAdd = splitBlockOnDayBoundary(updatedBlock)
      
      // Remove the original block and add the new blocks
      const filteredBlocks = state.timeBlocks.filter(b => b.id !== id)
      return { timeBlocks: [...filteredBlocks, ...blocksToAdd] }
    })
    get().saveData()
  },

  deleteTimeBlock: (id) => {
    set((state) => ({ timeBlocks: state.timeBlocks.filter((b) => b.id !== id) }))
    get().saveData()
  },

  updateRecurringBlocks: (parentId, updates) => {
    set((state) => ({
      timeBlocks: state.timeBlocks.map((b) => {
        // Update the original block or any instance with matching parentId
        if (b.id !== parentId && b.parentId !== parentId) return b
        
        const newStartTime = updates.startTime ?? b.startTime
        const newEndTime = updates.endTime ?? b.endTime
        const newDuration = updates.duration ?? b.duration
        
        let calculatedUpdates: Partial<TimeBlock> = {}
        
        if (updates.startTime && !updates.endTime && !updates.duration) {
          const [startH, startM] = newStartTime.split(':').map(Number)
          const totalStartMinutes = startH * 60 + startM
          const totalEndMinutes = totalStartMinutes + newDuration
          const endH = Math.floor(totalEndMinutes / 60) % 24
          const endM = totalEndMinutes % 60
          calculatedUpdates.endTime = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`
        } else if (updates.endTime && !updates.startTime && !updates.duration) {
          const [startH, startM] = newStartTime.split(':').map(Number)
          const [endH, endM] = newEndTime.split(':').map(Number)
          let duration = (endH * 60 + endM) - (startH * 60 + startM)
          if (duration < 0) duration += 24 * 60
          calculatedUpdates.duration = duration
        } else if (updates.duration && !updates.startTime && !updates.endTime) {
          const [startH, startM] = newStartTime.split(':').map(Number)
          const totalStartMinutes = startH * 60 + startM
          const totalEndMinutes = totalStartMinutes + newDuration
          const endH = Math.floor(totalEndMinutes / 60) % 24
          const endM = totalEndMinutes % 60
          calculatedUpdates.endTime = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`
        } else if ((updates.startTime && updates.endTime) || (updates.startTime && updates.duration) || (updates.endTime && updates.duration)) {
          const [startH, startM] = newStartTime.split(':').map(Number)
          const [endH, endM] = newEndTime.split(':').map(Number)
          let calculatedDuration = (endH * 60 + endM) - (startH * 60 + startM)
          if (calculatedDuration < 0) calculatedDuration += 24 * 60
          
          if (updates.duration && (updates.startTime || !updates.endTime)) {
            const totalStartMinutes = startH * 60 + startM
            const totalEndMinutes = totalStartMinutes + newDuration
            const calcEndH = Math.floor(totalEndMinutes / 60) % 24
            const calcEndM = totalEndMinutes % 60
            calculatedUpdates.endTime = `${calcEndH.toString().padStart(2, '0')}:${calcEndM.toString().padStart(2, '0')}`
          } else {
            calculatedUpdates.duration = calculatedDuration
          }
        }
        
        return { ...b, ...updates, ...calculatedUpdates }
      })
    }))
    get().saveData()
  },

  setHasCompletedSetup: (value) => {
    set({ hasCompletedSetup: value })
    get().saveData()
  },

  loadData: async () => {
    try {
      const stored = loadFromStorage()
      if (stored) {
        // Ensure skin setting has a valid value
        if (!stored.settings) stored.settings = defaultSettings
        if (!stored.settings.skin) stored.settings.skin = 'glassmorphism'
        set({
          settings: { ...defaultSettings, ...stored.settings },
          tags: stored.tags?.length ? stored.tags : defaultTags,
          timeBlocks: (stored.timeBlocks || []).map((b: any) => ({
            ...b,
            name: b.name ?? '',
          })),
          hasCompletedSetup: stored.hasCompletedSetup || false,
          isLoading: false
        })
      } else {
        set({ isLoading: false })
      }
    } catch (error) {
      console.error('Failed to load data:', error)
      set({ isLoading: false })
    }
  },

  saveData: async () => {
    const { settings, tags, timeBlocks, hasCompletedSetup } = get()
    saveToStorage({
      settings,
      tags,
      timeBlocks,
      hasCompletedSetup
    })
  }
}))
