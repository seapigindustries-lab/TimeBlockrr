import { describe, it, expect } from 'vitest'
import { calculateEndTime, calculateDuration, formatDuration } from '../utils/time'

describe('calculateEndTime', () => {
  it('adds duration to start time', () => {
    expect(calculateEndTime('09:00', 60)).toBe('10:00')
  })

  it('wraps around midnight', () => {
    expect(calculateEndTime('23:00', 120)).toBe('01:00')
  })

  it('handles zero duration', () => {
    expect(calculateEndTime('10:30', 0)).toBe('10:30')
  })
})

describe('calculateDuration', () => {
  it('calculates duration between start and end', () => {
    expect(calculateDuration('09:00', '10:00')).toBe(60)
  })

  it('handles overnight duration', () => {
    expect(calculateDuration('22:00', '02:00')).toBe(240)
  })
})

describe('formatDuration', () => {
  it('formats minutes only', () => {
    expect(formatDuration(30)).toBe('30m')
  })

  it('formats hours only', () => {
    expect(formatDuration(120)).toBe('2h')
  })

  it('formats hours and minutes', () => {
    expect(formatDuration(90)).toBe('1h 30m')
  })
})
