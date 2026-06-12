import { useMemo, useState, useEffect } from 'react'
import { useAppStore } from '../store'
import { isSameDay, startOfWeek, isWithinInterval, addDays, format } from 'date-fns'
import { calculateEndTime, calculateDuration, formatRange } from '../utils/time'

// Pie Chart Component
interface PieChartProps {
  data: { color: string; hours: number; name: string }[]
  size?: number
  showLabels?: boolean
}

function PieChart({ data, size = 80, showLabels = false }: PieChartProps) {
  const total = data.reduce((sum, item) => sum + item.hours, 0)
  if (total === 0) return null

  let currentAngle = 0
  const radius = size / 2
  const center = radius
  const labelRadius = radius * 1.35 // Position labels outside the pie

  const segments = data.map((item, _index) => {
    const angle = (item.hours / total) * 360
    const startAngle = currentAngle
    const endAngle = currentAngle + angle
    const midAngle = startAngle + angle / 2
    currentAngle += angle

    // Calculate path for arc
    const startRad = (startAngle - 90) * (Math.PI / 180)
    const endRad = (endAngle - 90) * (Math.PI / 180)
    
    const x1 = center + radius * Math.cos(startRad)
    const y1 = center + radius * Math.sin(startRad)
    const x2 = center + radius * Math.cos(endRad)
    const y2 = center + radius * Math.sin(endRad)
    
    const largeArc = angle > 180 ? 1 : 0
    
    const path = `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`

    // Calculate label position
    const midRad = (midAngle - 90) * (Math.PI / 180)
    const labelX = center + labelRadius * Math.cos(midRad)
    const labelY = center + labelRadius * Math.sin(midRad)

    return {
      path,
      color: item.color,
      labelX,
      labelY,
      name: item.name,
      hours: item.hours,
      percentage: ((item.hours / total) * 100).toFixed(0)
    }
  })

  const centerOffsetX = showLabels ? size * 0.4 : 0
  const centerOffsetY = showLabels ? size * 0.25 : 0

  return (
    <svg width={showLabels ? size * 1.8 : size} height={showLabels ? size * 1.5 : size} viewBox={`0 0 ${showLabels ? size * 1.8 : size} ${showLabels ? size * 1.5 : size}`} style={{ overflow: 'visible' }}>
      {/* Layer 1: Labels with callout lines (behind everything) */}
      {showLabels && segments.map((segment, index) => (
        <g key={`label-${index}`} style={{ zIndex: 1 }}>
          {/* Callout line */}
          <line
            x1={center + centerOffsetX}
            y1={center + centerOffsetY}
            x2={segment.labelX + centerOffsetX}
            y2={segment.labelY + centerOffsetY}
            stroke={segment.color}
            strokeWidth="1.5"
            opacity="0.6"
          />
          {/* Label dot */}
          <circle
            cx={segment.labelX + centerOffsetX}
            cy={segment.labelY + centerOffsetY}
            r="3"
            fill={segment.color}
            opacity="0.8"
          />
          {/* Label text - positioned outside to avoid center overlap */}
          <text
            x={segment.labelX + centerOffsetX + (segment.labelX > center ? 10 : -10)}
            y={segment.labelY + centerOffsetY + 4}
            textAnchor={segment.labelX > center ? 'start' : 'end'}
            fontSize="9"
            fontWeight="500"
            fill="var(--text-primary)"
          >
            {segment.name} ({segment.percentage}%)
          </text>
        </g>
      ))}
      
      {/* Layer 2: Pie segments */}
      <g transform={showLabels ? `translate(${centerOffsetX}, ${centerOffsetY})` : undefined} style={{ zIndex: 2 }}>
        {segments.map((segment, index) => (
          <path
            key={index}
            d={segment.path}
            fill={segment.color}
            stroke="var(--surface)"
            strokeWidth="2"
          />
        ))}
      </g>
      
      {/* Layer 3: Center hole and total hours (on top) */}
      <g transform={showLabels ? `translate(${centerOffsetX}, ${centerOffsetY})` : undefined} style={{ zIndex: 3 }}>
        {/* Center hole for donut effect */}
        <circle cx={center} cy={center} r={radius * 0.4} fill="var(--surface)" />
        {/* Background circle to ensure text readability */}
        <circle cx={center} cy={center} r={radius * 0.35} fill="var(--surface)" opacity="0.9" />
        <text 
          x={center} 
          y={center} 
          textAnchor="middle" 
          dominantBaseline="middle" 
          fontSize="11" 
          fontWeight="700"
          fill="var(--text-primary)"
        >
          {total.toFixed(1)}h
        </text>
      </g>
    </svg>
  )
}

// Helper to determine if text should be dark or light based on background color
function getContrastColor(bgColor: string): string {
  // Convert hex to RGB
  const hex = bgColor.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16) || 0
  const g = parseInt(hex.substring(2, 4), 16) || 0
  const b = parseInt(hex.substring(4, 6), 16) || 0
  
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  
  return luminance > 0.6 ? '#2A2F4F' : '#FFFFFF'
}

// Time calculation utilities imported from ../utils/time

interface StatsPanelProps {
  selectedDayIndex?: number | null
  onDaySelect?: (dayIndex: number | null) => void
}

function StatsPanel({ selectedDayIndex, onDaySelect }: StatsPanelProps) {
  const { timeBlocks, tags, settings, selectedBlockId } = useAppStore()
  const updateTimeBlock = useAppStore(state => state.updateTimeBlock)
  
  // Toggle between 'week' and 'day' view for tag breakdown
  const [statsView, setStatsView] = useState<'week' | 'day'>('week')
  
  // When a day is selected via header click, force 'day' view mode for pie chart display
  const isDaySelected = selectedDayIndex !== undefined && selectedDayIndex !== null

  const selectedBlock = useMemo(() => {
    if (!selectedBlockId) return null
    const block = timeBlocks.find(b => b.id === selectedBlockId)
    if (!block) return null
    const tag = tags.find(t => t.id === block.tagId)
    const weekStart = startOfWeek(new Date(), { weekStartsOn: settings.weekStartsOnSunday ? 0 : 1 })
    const blockDate = addDays(weekStart, block.dayOfWeek)
    const timeLabel = formatRange(block.startTime, block.duration, settings.use24Hour)
    return { block, tag, blockDate, timeLabel }
  }, [selectedBlockId, timeBlocks, tags, settings.weekStartsOnSunday, settings.use24Hour])

  const [editDraft, setEditDraft] = useState(() => selectedBlock?.block)

  useEffect(() => {
    if (selectedBlock) {
      setEditDraft(selectedBlock.block)
    } else {
      setEditDraft(undefined)
    }
  }, [selectedBlock])

  const currentWeekBlocks = useMemo(() => {
    // Filter blocks to only include those from the current week (weekOffset === 0)
    return timeBlocks.filter(block => block.weekOffset === 0)
  }, [timeBlocks])

  const todayBlocks = useMemo(() => {
    const today = new Date()
    const todayDayOfWeek = today.getDay()
    // Filter blocks for today: weekOffset === 0 and dayOfWeek matches today
    return timeBlocks.filter(block => block.weekOffset === 0 && block.dayOfWeek === todayDayOfWeek)
  }, [timeBlocks])

  const todayHours = useMemo(() => {
    return todayBlocks.reduce((sum, block) => sum + block.duration / 60, 0)
  }, [todayBlocks])

  const weekHours = useMemo(() => {
    return currentWeekBlocks.reduce((sum, block) => sum + block.duration / 60, 0)
  }, [currentWeekBlocks])

  // Weekly tag stats
  const weeklyTagStats = useMemo(() => {
    const stats: Record<string, number> = {}
    currentWeekBlocks.forEach(block => {
      stats[block.tagId] = (stats[block.tagId] || 0) + block.duration / 60
    })
    return tags.map(tag => ({
      ...tag,
      hours: stats[tag.id] || 0
    })).sort((a, b) => b.hours - a.hours)
  }, [currentWeekBlocks, tags])

  // Selected day stats (for single day view)
  const selectedDayBlocks = useMemo(() => {
    if (selectedDayIndex === undefined || selectedDayIndex === null) return []
    return currentWeekBlocks.filter(block => block.dayOfWeek === selectedDayIndex)
  }, [currentWeekBlocks, selectedDayIndex])

  const selectedDayTagStats = useMemo(() => {
    const stats: Record<string, number> = {}
    selectedDayBlocks.forEach(block => {
      stats[block.tagId] = (stats[block.tagId] || 0) + block.duration / 60
    })
    return tags.map(tag => ({
      ...tag,
      hours: stats[tag.id] || 0
    })).filter(t => t.hours > 0).sort((a, b) => b.hours - a.hours)
  }, [selectedDayBlocks, tags])

  const selectedDayHours = useMemo(() => {
    return selectedDayBlocks.reduce((sum, block) => sum + block.duration / 60, 0)
  }, [selectedDayBlocks])

  const selectedDayName = useMemo(() => {
    if (selectedDayIndex === undefined || selectedDayIndex === null) return ''
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    return days[selectedDayIndex]
  }, [selectedDayIndex])

  // Daily tag stats - breakdown by day
  const dailyTagStats = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    
    const dayStats = days.map((dayName, dayIndex) => {
      const dayBlocks = currentWeekBlocks.filter(block => block.dayOfWeek === dayIndex)
      const stats: Record<string, number> = {}
      dayBlocks.forEach(block => {
        stats[block.tagId] = (stats[block.tagId] || 0) + block.duration / 60
      })
      return {
        dayName,
        dayIndex,
        tagHours: tags.map(tag => ({
          ...tag,
          hours: stats[tag.id] || 0
        })).filter(t => t.hours > 0).sort((a, b) => b.hours - a.hours)
      }
    })
    
    return dayStats.filter(day => day.tagHours.length > 0)
  }, [currentWeekBlocks, tags, settings.weekStartsOnSunday])

  const tagStats = statsView === 'week' ? weeklyTagStats : [] // Empty for day view
  const maxHours = Math.max(...weeklyTagStats.map(t => t.hours), 1)

  return (
    <aside className="stats-panel">
      <div className="selection-panel">
        <h3 className="stats-title">Selected Block</h3>
        {selectedBlock && editDraft ? (
          <div className="selected-block-card">
            <div className="form-group">
              <label className="form-label">Name</label>
              <input
                className="form-input"
                value={editDraft.name}
                onChange={(e) => setEditDraft({ ...editDraft, name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Tag</label>
              <div className="tag-selector-row">
                {tags.map(tag => (
                  <div
                    key={tag.id}
                    className={`tag-color-option ${editDraft.tagId === tag.id ? 'selected' : ''}`}
                    style={{ backgroundColor: tag.color }}
                    onClick={() => setEditDraft({ ...editDraft, tagId: tag.id })}
                    title={tag.name}
                  >
                    <span 
                      className="tag-option-name"
                      style={{ color: getContrastColor(tag.color), textShadow: 'none' }}
                    >
                      {tag.name}
                    </span>
                  </div>
                ))}
              </div>
              <div className="selected-block-detail" style={{ marginTop: 4 }}>
                {tags.find(t => t.id === editDraft.tagId)?.name || 'No tag'}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Day</label>
              <select
                className="form-select"
                value={editDraft.dayOfWeek}
                onChange={(e) => setEditDraft({ ...editDraft, dayOfWeek: parseInt(e.target.value) })}
              >
                {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, i) => (
                  <option key={i} value={i}>{day}</option>
                ))}
              </select>
            </div>
            
            {/* Time Fields - All Three */}
            <div className="form-group" style={{ marginTop: 8 }}>
              <label className="form-label">Time</label>
              <div className="time-fields-row-compact">
                <div className="time-field-group">
                  <label className="time-field-label">Start</label>
                  <input
                    type="time"
                    className="form-input time-input-compact"
                    value={editDraft.startTime}
                    onChange={(e) => {
                      const newStartTime = e.target.value
                      const newEndTime = calculateEndTime(newStartTime, editDraft.duration)
                      setEditDraft({ ...editDraft, startTime: newStartTime, endTime: newEndTime })
                    }}
                  />
                </div>
                <div className="time-field-group">
                  <label className="time-field-label">End</label>
                  <input
                    type="time"
                    className="form-input time-input-compact"
                    value={editDraft.endTime || calculateEndTime(editDraft.startTime, editDraft.duration)}
                    onChange={(e) => {
                      const newEndTime = e.target.value
                      const newDuration = calculateDuration(editDraft.startTime, newEndTime)
                      setEditDraft({ ...editDraft, endTime: newEndTime, duration: newDuration })
                    }}
                  />
                </div>
                <div className="time-field-group">
                  <label className="time-field-label">Duration</label>
                  <div className="duration-input-wrapper-compact">
                    <input
                      type="number"
                      className="form-input duration-input-compact"
                      value={editDraft.duration}
                      min="15"
                      step="15"
                      onChange={(e) => {
                        const newDuration = Math.max(15, parseInt(e.target.value) || 15)
                        const newEndTime = calculateEndTime(editDraft.startTime, newDuration)
                        setEditDraft({ ...editDraft, duration: newDuration, endTime: newEndTime })
                      }}
                    />
                    <span className="duration-unit-compact">m</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Notes</label>
              <input
                className="form-input"
                value={editDraft.notes || ''}
                onChange={(e) => setEditDraft({ ...editDraft, notes: e.target.value })}
              />
            </div>
            <div className="modal-actions" style={{ padding: 0 }}>
              <button
                className="btn btn-primary"
                onClick={() => {
                  const finalEndTime = editDraft.endTime || calculateEndTime(editDraft.startTime, editDraft.duration)
                  updateTimeBlock(editDraft.id, {
                    name: editDraft.name,
                    tagId: editDraft.tagId,
                    startTime: editDraft.startTime,
                    endTime: finalEndTime,
                    duration: editDraft.duration,
                    notes: editDraft.notes
                  })
                }}
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <div className="selected-block-empty">Click a block to see details here.</div>
        )}
      </div>

      <h3 className="stats-title" style={{ marginTop: 24 }}>Statistics</h3>
      
      {!isDaySelected && (
        <>
          <div className="stats-section compact-stat">
            <div className="stats-label">Today</div>
            <div className="stats-value">{todayHours.toFixed(1)}h</div>
          </div>

          <div className="stats-section compact-stat">
            <div className="stats-label">This Week</div>
            <div className="stats-value">{weekHours.toFixed(1)}h</div>
          </div>
        </>
      )}

      {isDaySelected && (
        <div className="stats-section compact-stat">
          <div className="stats-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>{selectedDayName}</span>
            <button 
              className="clear-day-btn"
              onClick={() => onDaySelect?.(null)}
              title="Show all days"
            >
              ✕
            </button>
          </div>
          <div className="stats-value">{selectedDayHours.toFixed(1)}h</div>
        </div>
      )}

      <div className="stats-section">
        <div className="stats-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>By Tag</span>
          <div className="stats-toggle">
            <button 
              className={`stats-toggle-btn ${statsView === 'week' && !isDaySelected ? 'active' : ''}`}
              onClick={() => {
                setStatsView('week')
                if (isDaySelected) onDaySelect?.(null)
              }}
            >
              Week
            </button>
            <button 
              className={`stats-toggle-btn ${statsView === 'day' || isDaySelected ? 'active' : ''}`}
              onClick={() => setStatsView('day')}
            >
              Day
            </button>
          </div>
        </div>
        <div className="tag-stats">
          {statsView === 'week' && !isDaySelected ? (
            // Weekly view - bar charts
            tagStats.map(tag => (
              <div key={tag.id}>
                <div className="tag-stat-item">
                  <div className="tag-color-dot" style={{ backgroundColor: tag.color }}></div>
                  <span className="tag-name">{tag.name}</span>
                  <span className="tag-hours">{tag.hours.toFixed(1)}h</span>
                </div>
                <div 
                  className="tag-bar" 
                  style={{ 
                    width: `${(tag.hours / maxHours) * 100}%`,
                    backgroundColor: tag.color 
                  }}
                ></div>
              </div>
            ))
          ) : isDaySelected ? (
            // Single day view - bar charts + pie chart with labels
            <div className="single-day-view">
              {/* Pie Chart with callout labels */}
              <div className="single-day-pie">
                <PieChart data={selectedDayTagStats} size={90} showLabels={true} />
              </div>
              {/* Bar Charts */}
              <div className="single-day-bars">
                {selectedDayTagStats.map(tag => (
                  <div key={tag.id}>
                    <div className="tag-stat-item">
                      <div className="tag-color-dot" style={{ backgroundColor: tag.color }}></div>
                      <span className="tag-name">{tag.name}</span>
                      <span className="tag-hours">{tag.hours.toFixed(1)}h</span>
                    </div>
                    <div 
                      className="tag-bar" 
                      style={{ 
                        width: `${(tag.hours / Math.max(...selectedDayTagStats.map(t => t.hours), 1)) * 100}%`,
                        backgroundColor: tag.color 
                      }}
                    ></div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // Daily view with pie charts (all days)
            <div className="daily-pie-grid">
              {dailyTagStats.map(day => (
                <div 
                  key={day.dayIndex} 
                  className="daily-pie-item clickable"
                  onClick={() => onDaySelect?.(day.dayIndex)}
                  title={`Click to view ${day.dayName} details`}
                >
                  <div className="daily-pie-day">{day.dayName}</div>
                  <div className="daily-pie-chart">
                    <PieChart data={day.tagHours} size={70} />
                  </div>
                  <div className="daily-pie-legend">
                    {day.tagHours.slice(0, 3).map(tag => (
                      <div key={`${day.dayIndex}-${tag.id}`} className="daily-pie-tag">
                        <div className="daily-pie-dot" style={{ backgroundColor: tag.color }}></div>
                        <span className="daily-pie-tag-name">{tag.name}</span>
                        <span className="daily-pie-tag-hours">{tag.hours.toFixed(1)}h</span>
                      </div>
                    ))}
                    {day.tagHours.length > 3 && (
                      <div className="daily-pie-more">+{day.tagHours.length - 3} more</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}

export default StatsPanel
