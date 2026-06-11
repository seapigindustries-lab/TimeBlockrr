import { describe, it, expect, beforeEach } from 'vitest'
import { useAppStore } from '../store'
import { defaultSettings, defaultTags } from '../utils/defaults'
import type { Tag, TimeBlock } from '../types'

// Reset store before each test
beforeEach(() => {
  useAppStore.setState({
    settings: defaultSettings,
    tags: defaultTags,
    timeBlocks: [],
    hasCompletedSetup: false,
    isLoading: false,
    selectedBlockId: null
  })
})

describe('useAppStore', () => {
  describe('settings', () => {
    it('updates settings', () => {
      useAppStore.getState().setSettings({ use24Hour: true })
      expect(useAppStore.getState().settings.use24Hour).toBe(true)
    })

    it('merges settings partially', () => {
      useAppStore.getState().setSettings({ theme: 'dark' })
      expect(useAppStore.getState().settings.theme).toBe('dark')
      expect(useAppStore.getState().settings.skin).toBe(defaultSettings.skin)
    })
  })

  describe('tags', () => {
    it('adds a tag', () => {
      const newTag: Tag = { id: '100', name: 'Test', color: '#000000', isBuffer: false }
      useAppStore.getState().addTag(newTag)
      expect(useAppStore.getState().tags).toContainEqual(newTag)
    })

    it('updates a tag', () => {
      const firstTag = useAppStore.getState().tags[0]
      useAppStore.getState().updateTag(firstTag.id, { name: 'Updated' })
      expect(useAppStore.getState().tags.find(t => t.id === firstTag.id)?.name).toBe('Updated')
    })

    it('deletes a tag', () => {
      const firstTag = useAppStore.getState().tags[0]
      useAppStore.getState().deleteTag(firstTag.id)
      expect(useAppStore.getState().tags.find(t => t.id === firstTag.id)).toBeUndefined()
    })

    it('replaces all tags', () => {
      const newTags: Tag[] = [{ id: '200', name: 'New', color: '#FFFFFF', isBuffer: false }]
      useAppStore.getState().setTags(newTags)
      expect(useAppStore.getState().tags).toEqual(newTags)
    })
  })

  describe('timeBlocks', () => {
    const createBlock = (overrides: Partial<TimeBlock> = {}): TimeBlock => ({
      id: 'block-1',
      name: 'Test Block',
      tagId: defaultTags[0].id,
      dayOfWeek: 1,
      startTime: '09:00',
      endTime: '10:00',
      duration: 60,
      weekOffset: 0,
      ...overrides
    })

    it('adds a time block', () => {
      const block = createBlock()
      useAppStore.getState().addTimeBlock(block)
      expect(useAppStore.getState().timeBlocks).toContainEqual(block)
    })

    it('updates a time block', () => {
      const block = createBlock()
      useAppStore.getState().addTimeBlock(block)
      useAppStore.getState().updateTimeBlock(block.id, { name: 'Updated' })
      expect(useAppStore.getState().timeBlocks.find(b => b.id === block.id)?.name).toBe('Updated')
    })

    it('deletes a time block', () => {
      const block = createBlock()
      useAppStore.getState().addTimeBlock(block)
      useAppStore.getState().deleteTimeBlock(block.id)
      expect(useAppStore.getState().timeBlocks.find(b => b.id === block.id)).toBeUndefined()
    })

    it('replaces all time blocks', () => {
      const blocks = [createBlock({ id: '1' }), createBlock({ id: '2' })]
      useAppStore.getState().setTimeBlocks(blocks)
      expect(useAppStore.getState().timeBlocks).toEqual(blocks)
    })

    it('recalculates endTime when startTime changes', () => {
      const block = createBlock({ startTime: '09:00', duration: 60 })
      useAppStore.getState().addTimeBlock(block)
      useAppStore.getState().updateTimeBlock(block.id, { startTime: '10:00' })
      const updated = useAppStore.getState().timeBlocks.find(b => b.id === block.id)
      expect(updated?.endTime).toBe('11:00')
    })

    it('recalculates duration when endTime changes', () => {
      const block = createBlock({ startTime: '09:00', endTime: '10:00', duration: 60 })
      useAppStore.getState().addTimeBlock(block)
      useAppStore.getState().updateTimeBlock(block.id, { endTime: '11:00' })
      const updated = useAppStore.getState().timeBlocks.find(b => b.id === block.id)
      expect(updated?.duration).toBe(120)
    })
  })

  describe('setup', () => {
    it('toggles hasCompletedSetup', () => {
      useAppStore.getState().setHasCompletedSetup(true)
      expect(useAppStore.getState().hasCompletedSetup).toBe(true)
    })
  })

  describe('selection', () => {
    it('sets selectedBlockId', () => {
      useAppStore.getState().setSelectedBlockId('block-123')
      expect(useAppStore.getState().selectedBlockId).toBe('block-123')
    })

    it('clears selectedBlockId', () => {
      useAppStore.getState().setSelectedBlockId('block-123')
      useAppStore.getState().setSelectedBlockId(null)
      expect(useAppStore.getState().selectedBlockId).toBeNull()
    })
  })
})
