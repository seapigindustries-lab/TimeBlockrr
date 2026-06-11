export function calculateEndTime(startTime: string, duration: number): string {
  const [startH, startM] = startTime.split(':').map(Number)
  const totalMinutes = startH * 60 + startM + duration
  const endH = Math.floor(totalMinutes / 60) % 24
  const endM = totalMinutes % 60
  return `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`
}

export function calculateDuration(startTime: string, endTime: string): number {
  const [startH, startM] = startTime.split(':').map(Number)
  const [endH, endM] = endTime.split(':').map(Number)
  let duration = (endH * 60 + endM) - (startH * 60 + startM)
  if (duration < 0) duration += 24 * 60
  return duration
}

export function formatTime(hour: number, use24Hour: boolean): string {
  if (use24Hour) {
    return `${hour.toString().padStart(2, '0')}:00`
  }
  if (hour === 0) return '12 AM'
  if (hour < 12) return `${hour} AM`
  if (hour === 12) return '12 PM'
  return `${hour - 12} PM`
}

export function formatHour(hour: number, use24Hour: boolean): string {
  if (use24Hour) {
    return `${hour.toString().padStart(2, '0')}:00`
  }
  if (hour === 0) return '12:00 AM'
  if (hour === 12) return '12:00 PM'
  if (hour < 12) return `${hour}:00 AM`
  return `${hour - 12}:00 PM`
}

export function formatTimeRange(startTime: string, duration: number, use24Hour: boolean): string {
  const [hours, minutes] = startTime.split(':').map(Number)
  const startDate = new Date()
  startDate.setHours(hours, minutes, 0, 0)
  const endDate = new Date(startDate.getTime() + duration * 60000)
  // Use native formatter to avoid date-fns dependency in utils
  const fmt = (d: Date) => {
    if (use24Hour) {
      return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
    }
    let h = d.getHours()
    const m = d.getMinutes().toString().padStart(2, '0')
    const ampm = h >= 12 ? 'PM' : 'AM'
    h = h % 12
    h = h ? h : 12
    return `${h}:${m} ${ampm}`
  }
  return `${fmt(startDate)} - ${fmt(endDate)}`
}

export function formatDuration(durationMinutes: number): string {
  const hours = Math.floor(durationMinutes / 60)
  const minutes = durationMinutes % 60
  if (hours === 0) return `${minutes}m`
  if (minutes === 0) return `${hours}h`
  return `${hours}h ${minutes}m`
}

export function formatRange(startTime: string, duration: number, use24Hour: boolean) {
  const [h, m] = startTime.split(':').map(Number)
  const startDate = new Date()
  startDate.setHours(h, m, 0, 0)
  const endDate = new Date(startDate.getTime() + duration * 60000)
  const fmt = (d: Date) => {
    if (use24Hour) {
      return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
    }
    let hr = d.getHours()
    const min = d.getMinutes().toString().padStart(2, '0')
    const ampm = hr >= 12 ? 'PM' : 'AM'
    hr = hr % 12
    hr = hr ? hr : 12
    return `${hr}:${min} ${ampm}`
  }
  return `${fmt(startDate)} - ${fmt(endDate)}`
}
