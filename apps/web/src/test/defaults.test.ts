import { describe, it, expect } from 'vitest'
import { defaultSettings, defaultTags, defaultPalettes } from '../utils/defaults'

describe('defaultSettings', () => {
  it('has valid skin value', () => {
    expect(['glassmorphism', 'warm-minimalism']).toContain(defaultSettings.skin)
  })

  it('has valid theme value', () => {
    expect(['light', 'dark', 'business']).toContain(defaultSettings.theme)
  })

  it('has valid time increment', () => {
    expect([15, 30, 60, 'freeform']).toContain(defaultSettings.timeIncrement)
  })

  it('has valid color blind mode', () => {
    expect(['none', 'deuteranopia', 'protanopia', 'tritanopia', 'achromatopsia']).toContain(defaultSettings.colorBlindMode)
  })

  it('has reasonable hour range', () => {
    expect(defaultSettings.defaultStartHour).toBeGreaterThanOrEqual(0)
    expect(defaultSettings.defaultStartHour).toBeLessThan(24)
    expect(defaultSettings.defaultEndHour).toBeGreaterThan(defaultSettings.defaultStartHour)
    expect(defaultSettings.defaultEndHour).toBeLessThanOrEqual(24)
  })
})

describe('defaultTags', () => {
  it('has at least one tag', () => {
    expect(defaultTags.length).toBeGreaterThan(0)
  })

  it('each tag has id, name, color, and isBuffer', () => {
    defaultTags.forEach(tag => {
      expect(tag).toHaveProperty('id')
      expect(tag).toHaveProperty('name')
      expect(tag).toHaveProperty('color')
      expect(tag).toHaveProperty('isBuffer')
      expect(typeof tag.id).toBe('string')
      expect(typeof tag.name).toBe('string')
      expect(typeof tag.color).toBe('string')
      expect(typeof tag.isBuffer).toBe('boolean')
    })
  })

  it('all tag colors are valid hex', () => {
    defaultTags.forEach(tag => {
      expect(tag.color).toMatch(/^#[0-9A-Fa-f]{6}$/)
    })
  })

  it('all tag IDs are unique', () => {
    const ids = defaultTags.map(t => t.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('defaultPalettes', () => {
  it('has at least one palette', () => {
    expect(Object.keys(defaultPalettes).length).toBeGreaterThan(0)
  })

  it('each palette has at least 5 colors', () => {
    Object.values(defaultPalettes).forEach(colors => {
      expect(colors.length).toBeGreaterThanOrEqual(5)
    })
  })

  it('all palette colors are valid hex', () => {
    Object.values(defaultPalettes).forEach(colors => {
      colors.forEach(color => {
        expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/)
      })
    })
  })
})
