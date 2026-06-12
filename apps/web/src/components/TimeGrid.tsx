import { useState, useMemo, useEffect } from 'react'
import { DndContext, DragEndEvent, useDraggable, useDroppable } from '@dnd-kit/core'
import { useAppStore } from '../store'
import { format, addWeeks, startOfWeek, addDays, isSameDay } from 'date-fns'
import { v4 as uuidv4 } from 'uuid'
import type { TimeBlock, RecurrenceType, RecurrenceRule, Tag } from '../types'
import { formatTime, formatTimeRange, formatDuration, calculateEndTime, calculateDuration } from '../utils/time'

interface TimeBlockProps {
  block: TimeBlock
  tag: Tag
  onEdit: (block: TimeBlock) => void
  use24Hour: boolean
  startHour: number
  isSelected: boolean
  onSelect: (id: string) => void
  onResizeStart: (blockId: string, startY: number) => void
  width?: string
  left?: string
}

function minutesFromStart(startTime: string, startHour: number) {
  const [h, m] = startTime.split(':').map(Number)
  return Math.max(0, h * 60 + m - startHour * 60)
}

function DraggableTimeBlock({ block, tag, onEdit, use24Hour, startHour, isSelected, onSelect, onResizeStart, width, left }: TimeBlockProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: block.id,
    data: block
  })

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`
  } : undefined

  // Get pattern class based on tag ID (last char) for grayscale accessibility
  const getPatternClass = () => {
    const lastChar = tag.id.slice(-1)
    const charCode = lastChar.charCodeAt(0) % 6
    return `pattern-${charCode}`
  }

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onEdit(block)
  }

  return (
    <div
      ref={setNodeRef}
      className={`time-block ${isDragging ? 'dragging' : ''} ${tag.isBuffer ? 'buffer' : ''} ${isSelected ? 'selected' : ''} ${getPatternClass()}`}
      style={{
        ...style,
        backgroundColor: tag.color,
        color: tag.isBuffer ? 'var(--text-primary)' : 'var(--block-text)',
        top: `${minutesFromStart(block.startTime, startHour)}px`,
        height: `${block.duration}px`,
        width: width,
        left: left
      }}
      onClick={() => onSelect(block.id)}
      onDoubleClick={handleDoubleClick}
    >
      <div className="block-title-bar" {...listeners} {...attributes}>
        <div className="block-title-bar-left">
          <div className="block-title-text">{block.name || 'Untitled'}</div>
        </div>
      </div>
      <div className="block-content">
        <div className="block-time-row">
          <div className="block-time">{formatTimeRange(block.startTime, block.duration, use24Hour)}</div>
          <div className="block-duration">{formatDuration(block.duration)}</div>
        </div>
        {block.notes && <div className="block-notes">{block.notes}</div>}
      </div>
      <div className="block-title-tag">{tag.name}</div>
      <div
        className="block-resizer"
        onMouseDown={(e) => {
          e.stopPropagation()
          e.preventDefault()
          onResizeStart(block.id, e.clientY)
        }}
      />
    </div>
  )
}

interface DayColumnProps {
  dayIndex: number
  date: Date
  blocks: TimeBlock[]
  onEditBlock: (block: TimeBlock) => void
  use24Hour: boolean
  startHour: number
  columnHeight: number
  selectedBlockId: string | null
  onSelectBlock: (id: string) => void
  onResizeStart: (blockId: string, startY: number) => void
  onDoubleClick: (dayIndex: number, minuteOffset: number) => void
  onDragCreateStart: (dayIndex: number, minuteOffset: number) => void
  onDragCreateMove: (dayIndex: number, minuteOffset: number) => void
  onDragCreateEnd: () => void
  isCreatingOnDay: boolean
  createStartY: number | null
  createCurrentY: number | null
}

function DayColumn({ dayIndex, date, blocks, onEditBlock, use24Hour, startHour, columnHeight, selectedBlockId, onSelectBlock, onResizeStart, onDoubleClick, onDragCreateStart, onDragCreateMove, onDragCreateEnd, isCreatingOnDay, createStartY, createCurrentY }: DayColumnProps) {
  const tags = useAppStore(state => state.tags)
  const { setNodeRef, isOver } = useDroppable({
    id: `day-${dayIndex}`
  })

  const dayBlocks = blocks.filter(b => b.dayOfWeek === dayIndex)

  // Calculate overlapping groups and positions
  const positionedBlocks = useMemo(() => {
    if (dayBlocks.length === 0) return []

    // Helper to get block time bounds
    const getBlockBounds = (block: typeof dayBlocks[0]) => {
      const [h, m] = block.startTime.split(':').map(Number)
      return { start: h * 60 + m, end: h * 60 + m + block.duration }
    }

    // Build overlap graph
    type BlockWithMeta = typeof dayBlocks[0] & { col: number, totalCols: number }
    const result: BlockWithMeta[] = dayBlocks.map(b => ({ ...b, col: 0, totalCols: 1 }))

    // First pass: assign columns
    for (let i = 0; i < result.length; i++) {
      const boundsI = getBlockBounds(result[i])
      let col = 0

      // Check which columns are occupied by earlier blocks
      for (let j = 0; j < i; j++) {
        const boundsJ = getBlockBounds(result[j])
        // Check overlap
        if (boundsI.start < boundsJ.end && boundsI.end > boundsJ.start) {
          if (result[j].col === col) {
            col++
            j = -1 // Restart check
          }
        }
      }

      result[i].col = col
    }

    // Second pass: calculate totalCols for each block
    for (let i = 0; i < result.length; i++) {
      const boundsI = getBlockBounds(result[i])
      let maxCol = result[i].col

      // Find all overlapping blocks and their max column
      for (let j = 0; j < result.length; j++) {
        if (i === j) continue
        const boundsJ = getBlockBounds(result[j])
        if (boundsI.start < boundsJ.end && boundsI.end > boundsJ.start) {
          maxCol = Math.max(maxCol, result[j].col)
        }
      }

      result[i].totalCols = maxCol + 1
    }

    return result
  }, [dayBlocks])

  const handleDoubleClick = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const y = e.clientY - rect.top
    const minuteOffset = Math.floor(y)
    onDoubleClick(dayIndex, minuteOffset)
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return // Only left click
    // Don't start drag-create if clicking on a time block
    if ((e.target as HTMLElement).closest('.time-block')) return
    const rect = e.currentTarget.getBoundingClientRect()
    const y = e.clientY - rect.top
    onDragCreateStart(dayIndex, y)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isCreatingOnDay) return
    const rect = e.currentTarget.getBoundingClientRect()
    const y = e.clientY - rect.top
    onDragCreateMove(dayIndex, y)
  }

  const handleMouseUp = () => {
    onDragCreateEnd()
  }

  // Calculate drag preview position
  const dragPreview = useMemo(() => {
    if (!isCreatingOnDay || createStartY === null || createCurrentY === null) return null
    const start = Math.min(createStartY, createCurrentY)
    const end = Math.max(createStartY, createCurrentY)
    const height = Math.max(end - start, 15) // Minimum 15px
    return { top: start, height }
  }, [isCreatingOnDay, createStartY, createCurrentY])

  return (
    <div
      className="day-cell"
      ref={setNodeRef}
      style={{
        backgroundColor: isOver ? 'rgba(74, 144, 217, 0.1)' : undefined,
        height: `${columnHeight}px`
      }}
      onDoubleClick={handleDoubleClick}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="hour-grid-lines" style={{ height: `${columnHeight}px` }} />
      {positionedBlocks.map((positionedBlock) => {
        const tag = tags.find(t => t.id === positionedBlock.tagId)
        if (!tag) return null
        const { col, totalCols } = positionedBlock
        const width = totalCols > 1 ? `${100 / totalCols}%` : undefined
        const left = totalCols > 1 ? `${(col / totalCols) * 100}%` : undefined
        return (
          <DraggableTimeBlock
            key={positionedBlock.id}
            block={positionedBlock}
            tag={tag}
            onEdit={onEditBlock}
            use24Hour={use24Hour}
            startHour={startHour}
            isSelected={positionedBlock.id === selectedBlockId}
            onSelect={onSelectBlock}
            onResizeStart={onResizeStart}
            width={width}
            left={left}
          />
        )
      })}
      {isSameDay(date, new Date()) && (
        <CurrentTimeIndicator startHour={startHour} />
      )}
      {dragPreview && (
        <div
          className="drag-create-preview"
          style={{
            top: `${dragPreview.top}px`,
            height: `${dragPreview.height}px`
          }}
        />
      )}
    </div>
  )
}

function CurrentTimeIndicator({ startHour }: { startHour: number }) {
  const now = new Date()
  const currentMinutes = now.getHours() * 60 + now.getMinutes() - startHour * 60
  if (currentMinutes < 0) return null
  return (
    <div
      className="current-time-indicator"
      style={{ top: `${currentMinutes}px` }}
    />
  )
}

interface TimeGridProps {
  selectedDayIndex?: number | null
  onDaySelect?: (dayIndex: number | null) => void
}

function TimeGrid({ selectedDayIndex, onDaySelect }: TimeGridProps) {
  const { settings, timeBlocks, addTimeBlock, updateTimeBlock, updateRecurringBlocks, deleteTimeBlock } = useAppStore()
  const setTimeBlocks = useAppStore(state => state.setTimeBlocks)
  const selectedBlockId = useAppStore(state => state.selectedBlockId)
  const setSelectedBlockId = useAppStore(state => state.setSelectedBlockId)
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0)
  const [hiddenHours, setHiddenHours] = useState<Set<number>>(new Set())
  const [editingBlock, setEditingBlock] = useState<TimeBlock | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  // Time calculation utilities imported from ../utils/time

  const [newBlock, setNewBlock] = useState({
    name: '',
    tagId: '',
    dayOfWeek: 0,
    startTime: '09:00',
    endTime: '10:00', // calculated from start + 60min
    duration: 60,
    notes: '',
    recurrence: { type: 'none' as RecurrenceType }
  })

  const weekStart = useMemo(() => {
    const now = new Date()
    const baseStart = startOfWeek(now, { weekStartsOn: settings.weekStartsOnSunday ? 0 : 1 })
    return addWeeks(baseStart, currentWeekOffset)
  }, [currentWeekOffset, settings.weekStartsOnSunday])

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  }, [weekStart])

  const visibleHours = useMemo(() => {
    return Array.from({ length: settings.defaultEndHour - settings.defaultStartHour + 1 }, (_, i) => settings.defaultStartHour + i)
  }, [settings.defaultStartHour, settings.defaultEndHour])

  const columnHeight = useMemo(() => visibleHours.length * 60, [visibleHours])

  const [resizing, setResizing] = useState<{ id: string; startY: number; startDuration: number } | null>(null)
  
  // Drag-to-create state
  const [dragCreate, setDragCreate] = useState<{
    isActive: boolean
    dayIndex: number | null
    startY: number | null
    currentY: number | null
  }>({ isActive: false, dayIndex: null, startY: null, currentY: null })

  useEffect(() => {
    if (!resizing) return
    const handleMove = (e: MouseEvent) => {
      const block = timeBlocks.find(b => b.id === resizing.id)
      if (!block) return
      const deltaY = e.clientY - resizing.startY
      const snap = settings.timeIncrement === 'freeform' ? deltaY : Math.round(deltaY / settings.timeIncrement) * settings.timeIncrement
      const newDuration = Math.max(15, resizing.startDuration + snap)
      const startParts = block.startTime.split(':').map(Number)
      const startMinutes = startParts[0] * 60 + startParts[1]
      const maxDuration = (settings.defaultEndHour * 60) - startMinutes
      const clampedDuration = Math.max(15, Math.min(maxDuration, newDuration))
      updateTimeBlock(block.id, { duration: clampedDuration })
    }
    const handleUp = () => setResizing(null)
    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
    }
  }, [resizing, timeBlocks, updateTimeBlock, settings.timeIncrement, settings.defaultEndHour])

  const toggleHour = (hour: number) => {
    setHiddenHours(prev => {
      const next = new Set(prev)
      if (next.has(hour)) {
        next.delete(hour)
      } else {
        next.add(hour)
      }
      return next
    })
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over, delta } = event
    if (!over) return

    const blockId = active.id as string
    const block = timeBlocks.find(b => b.id === blockId)
    if (!block) return

    const newDayOfWeek = parseInt(over.id.toString().replace('day-', ''))

    // Convert vertical delta (px) to minutes (1px = 1min at 60px per hour)
    const deltaMinutesRaw = delta.y
    const snapped = settings.timeIncrement === 'freeform'
      ? deltaMinutesRaw
      : Math.round(deltaMinutesRaw / settings.timeIncrement) * settings.timeIncrement

    const [startHour, startMin] = block.startTime.split(':').map(Number)
    const startMinutes = startHour * 60 + startMin
    const newStartTotal = startMinutes + snapped

    const rangeStart = settings.defaultStartHour * 60
    const rangeEnd = settings.defaultEndHour * 60
    const minDuration = settings.timeIncrement === 'freeform' ? 1 : Math.max(15, settings.timeIncrement)
    const clampedStart = Math.max(rangeStart, Math.min(rangeEnd - minDuration, newStartTotal))

    const newHour = Math.floor(clampedStart / 60)
    const newMin = clampedStart % 60
    const newStartTime = `${newHour.toString().padStart(2, '0')}:${newMin.toString().padStart(2, '0')}`

    updateTimeBlock(blockId, { dayOfWeek: newDayOfWeek, startTime: newStartTime })
  }

  const handleAddBlock = () => {
    const baseBlock: TimeBlock = {
      id: uuidv4(),
      name: newBlock.name || 'Untitled',
      tagId: newBlock.tagId,
      dayOfWeek: newBlock.dayOfWeek,
      startTime: newBlock.startTime,
      endTime: newBlock.endTime,
      duration: newBlock.duration,
      notes: newBlock.notes,
      weekOffset: currentWeekOffset,
      recurrence: newBlock.recurrence?.type !== 'none' ? newBlock.recurrence : undefined
    }
    
    // Generate recurring instances
    const blocksToAdd = generateRecurringBlocks(baseBlock, newBlock.recurrence, currentWeekOffset)
    
    blocksToAdd.forEach(block => addTimeBlock(block))
    
    setShowAddModal(false)
    setNewBlock({ name: '', tagId: '', dayOfWeek: 0, startTime: '09:00', endTime: '10:00', duration: 60, notes: '', recurrence: { type: 'none' } })
  }

  // Generate recurring block instances based on recurrence rule
  const generateRecurringBlocks = (baseBlock: TimeBlock, recurrence: RecurrenceRule | undefined, baseWeekOffset: number): TimeBlock[] => {
    if (!recurrence || recurrence.type === 'none') {
      return [baseBlock]
    }

    const blocks: TimeBlock[] = [baseBlock]
    const maxOccurrences = recurrence.occurrences || 10 // Default to 10 occurrences if not specified
    const { dayOfWeek, startTime, duration, tagId, name, notes } = baseBlock

    let occurrenceCount = 1
    let currentWeekOffset = baseWeekOffset

    while (occurrenceCount < maxOccurrences) {
      let newDayOfWeek = dayOfWeek
      let weeksToAdd = 0

      switch (recurrence.type) {
        case 'daily':
          // Add next day, may span to next week
          newDayOfWeek = dayOfWeek + occurrenceCount
          weeksToAdd = Math.floor(newDayOfWeek / 7)
          newDayOfWeek = newDayOfWeek % 7
          break
        case 'weekdays':
          // Skip weekends
          let daysAdded = 0
          let tempDay = dayOfWeek
          while (daysAdded < occurrenceCount) {
            tempDay = (tempDay + 1) % 7
            if (tempDay !== 0 && tempDay !== 6) { // Not Sunday (0) or Saturday (6)
              daysAdded++
            }
            weeksToAdd += tempDay === 0 ? 1 : 0 // Add week if we wrap to Sunday
          }
          newDayOfWeek = tempDay
          break
        case 'weekends':
          // Only weekends
          let weekendDaysAdded = 0
          let tempWeekendDay = dayOfWeek
          while (weekendDaysAdded < occurrenceCount) {
            tempWeekendDay = (tempWeekendDay + 1) % 7
            if (tempWeekendDay === 0 || tempWeekendDay === 6) { // Sunday or Saturday
              weekendDaysAdded++
            }
            weeksToAdd += tempWeekendDay === 0 ? 1 : 0
          }
          newDayOfWeek = tempWeekendDay
          break
        case 'weekly':
          weeksToAdd = occurrenceCount
          break
        case 'biweekly':
          weeksToAdd = occurrenceCount * 2
          break
        case 'monthly':
          // For monthly, we approximate with 4-week cycles
          weeksToAdd = occurrenceCount * 4
          break
        case 'monthly-weekday':
          // Same approximation for monthly-weekday
          weeksToAdd = occurrenceCount * 4
          break
        case 'yearly':
          // For yearly, we approximate with 52-week cycles
          weeksToAdd = occurrenceCount * 52
          break
      }

      currentWeekOffset = baseWeekOffset + weeksToAdd

      // For simplicity, we'll limit the total blocks to prevent performance issues
      if (occurrenceCount < 52) { // Max ~1 year of recurring events
        // Calculate end time for this instance
        const [startH, startM] = startTime.split(':').map(Number)
        const totalMinutes = startH * 60 + startM + duration
        const endH = Math.floor(totalMinutes / 60) % 24
        const endM = totalMinutes % 60
        const instanceEndTime = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`
        
        blocks.push({
          id: uuidv4(),
          name,
          tagId,
          dayOfWeek: newDayOfWeek,
          startTime,
          endTime: instanceEndTime,
          duration,
          notes,
          weekOffset: currentWeekOffset,
          isRecurringInstance: true,
          parentId: baseBlock.id
        })
      }

      occurrenceCount++
    }

    return blocks
  }

  // Drag-to-create handlers
  const handleDragCreateStart = (dayIndex: number, y: number) => {
    setDragCreate({ isActive: true, dayIndex, startY: y, currentY: y })
  }

  const handleDragCreateMove = (dayIndex: number, y: number) => {
    if (!dragCreate.isActive || dragCreate.dayIndex !== dayIndex) return
    setDragCreate(prev => ({ ...prev, currentY: y }))
  }

  const handleDragCreateEnd = () => {
    if (!dragCreate.isActive || dragCreate.startY === null || dragCreate.currentY === null || dragCreate.dayIndex === null) {
      setDragCreate({ isActive: false, dayIndex: null, startY: null, currentY: null })
      return
    }

    // Require minimum drag distance (10 pixels) to prevent accidental single-click creation
    const dragDistance = Math.abs(dragCreate.currentY - dragCreate.startY)
    if (dragDistance < 10) {
      // This was a click, not a drag - don't create a block
      setDragCreate({ isActive: false, dayIndex: null, startY: null, currentY: null })
      return
    }

    // Calculate start and duration
    const minY = Math.min(dragCreate.startY, dragCreate.currentY)
    const maxY = Math.max(dragCreate.startY, dragCreate.currentY)
    const durationMinutes = Math.max(maxY - minY, 15) // Minimum 15 minutes

    // Convert Y position to time
    const startMinutesFromDayStart = minY
    const totalStartMinutes = settings.defaultStartHour * 60 + startMinutesFromDayStart
    const hour = Math.floor(totalStartMinutes / 60)
    const minute = Math.floor((totalStartMinutes % 60) / 15) * 15

    // Check bounds
    if (hour >= settings.defaultStartHour && hour < settings.defaultEndHour) {
      const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      const clampedDuration = Math.max(15, Math.round(Math.min(durationMinutes, (settings.defaultEndHour * 60) - totalStartMinutes) / 15) * 15)
      const endTimeStr = calculateEndTime(timeStr, clampedDuration)
      
      setNewBlock({
        name: '',
        tagId: tags[0]?.id || '',
        dayOfWeek: dragCreate.dayIndex,
        startTime: timeStr,
        endTime: endTimeStr,
        duration: clampedDuration,
        notes: '',
        recurrence: { type: 'none' as RecurrenceType }
      })
      setShowAddModal(true)
    }

    setDragCreate({ isActive: false, dayIndex: null, startY: null, currentY: null })
  }

  const handleUpdateBlock = (updateAll: boolean = false) => {
    if (!editingBlock) return
    // Ensure endTime is set before saving
    const finalEndTime = editingBlock.endTime || calculateEndTime(editingBlock.startTime, editingBlock.duration)
    const updates = {
      name: editingBlock.name,
      tagId: editingBlock.tagId,
      dayOfWeek: editingBlock.dayOfWeek,
      startTime: editingBlock.startTime,
      endTime: finalEndTime,
      duration: editingBlock.duration,
      notes: editingBlock.notes
    }
    
    if (updateAll && editingBlock.parentId) {
      // Update all occurrences of this recurring event
      updateRecurringBlocks(editingBlock.parentId, updates)
    } else {
      // Update just this single block
      updateTimeBlock(editingBlock.id, updates)
    }
    setEditingBlock(null)
  }

  const tags = useAppStore(state => state.tags)

  return (
    <div className="time-grid-container">
      <div className="week-nav">
        <h2 className="week-nav-title">
          Week of {format(weekStart, 'MMM d')} - {format(addDays(weekStart, 6), 'MMM d, yyyy')}
        </h2>
        <div className="week-nav-controls">
          <button 
            className="nav-btn" 
            onClick={() => setCurrentWeekOffset(prev => prev - 1)}
            disabled={currentWeekOffset <= -4}
          >
            ←
          </button>
          <button className="nav-btn today-btn" onClick={() => setCurrentWeekOffset(0)}>Today</button>
          <button 
            className="nav-btn" 
            onClick={() => setCurrentWeekOffset(prev => prev + 1)}
            disabled={currentWeekOffset >= 8}
          >
            →
          </button>
          <button className="week-toggle" onClick={() => {
            useAppStore.getState().setSettings({ weekStartsOnSunday: !settings.weekStartsOnSunday })
          }}>
            {settings.weekStartsOnSunday ? 'Sun' : 'Mon'} Start
          </button>
        </div>
      </div>

      <DndContext onDragEnd={handleDragEnd}>
        <div className="time-grid-wrapper">
          <div className="grid-container">
            {/* Header Row */}
            <div className="grid-header-cell corner-cell"></div>
            {weekDays.map((day, i) => (
              <div 
                key={`header-${i}`} 
                className={`grid-header-cell day-header ${selectedDayIndex === i ? 'selected-day' : ''}`}
                onClick={() => onDaySelect?.(selectedDayIndex === i ? null : i)}
                title={`Click to view ${format(day, 'EEEE')} statistics`}
              >
                {format(day, 'EEE')} {format(day, 'd')}
              </div>
            ))}
            
            {/* Time Labels Column - Sticky */}
            <div className="time-labels-column">
              {visibleHours.map(hour => (
                <div key={`hour-${hour}`} className={`hour-slot ${hiddenHours.has(hour) ? 'hidden-hour' : ''}`}>
                  <div className="hour-label" onClick={() => toggleHour(hour)}>
                    {formatTime(hour, settings.use24Hour)}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Day Columns */}
            {weekDays.map((day, dayIndex) => (
              <DayColumn
                key={`day-${dayIndex}`}
                dayIndex={dayIndex}
                date={day}
                blocks={timeBlocks.filter(b => b.weekOffset === currentWeekOffset)}
                onEditBlock={setEditingBlock}
                use24Hour={settings.use24Hour}
                startHour={settings.defaultStartHour}
                columnHeight={columnHeight}
                selectedBlockId={selectedBlockId}
                onSelectBlock={(id) => setSelectedBlockId(id)}
                onResizeStart={(id, startY) => {
                  const b = timeBlocks.find(tb => tb.id === id)
                  if (b) setResizing({ id, startY, startDuration: b.duration })
                }}
                onDoubleClick={(dayIdx, minuteOffset) => {
                  const totalMinutes = settings.defaultStartHour * 60 + minuteOffset
                  const hour = Math.floor(totalMinutes / 60)
                  const minute = Math.floor((totalMinutes % 60) / 15) * 15
                  const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
                  const endHour = Math.floor((totalMinutes + 60) / 60) % 24
                  const endMinute = (totalMinutes + 60) % 60
                  const endTimeStr = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`
                  setNewBlock({
                    name: '',
                    tagId: tags[0]?.id || '',
                    dayOfWeek: dayIdx,
                    startTime: timeStr,
                    endTime: endTimeStr,
                    duration: 60,
                    notes: '',
                    recurrence: { type: 'none' as RecurrenceType }
                  })
                  setShowAddModal(true)
                }}
                onDragCreateStart={handleDragCreateStart}
                onDragCreateMove={handleDragCreateMove}
                onDragCreateEnd={handleDragCreateEnd}
                isCreatingOnDay={dragCreate.isActive && dragCreate.dayIndex === dayIndex}
                createStartY={dragCreate.startY}
                createCurrentY={dragCreate.currentY}
              />
            ))}
          </div>
        </div>
      </DndContext>

      <div className="toolbar">
        <button className="toolbar-btn danger" onClick={() => {
          if (confirm('Are you sure you want to delete all time blocks? This action cannot be undone.')) {
            setTimeBlocks([])
          }
        }}>
          Clear All Blocks
        </button>
        <div style={{ flex: 1 }}></div>
        <button className="toolbar-btn" disabled={!selectedBlockId} onClick={() => {
          if (!selectedBlockId) return
          if (confirm('Are you sure you want to delete this time block?')) {
            deleteTimeBlock(selectedBlockId)
            setSelectedBlockId(null)
          }
        }}>
          Delete Selected
        </button>
      </div>

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">Add Time Block</h3>
            <div className="form-group">
              <label className="form-label">Name</label>
              <input
                type="text"
                className="form-input"
                value={newBlock.name}
                onChange={e => setNewBlock({ ...newBlock, name: e.target.value })}
                placeholder="e.g., Deep Work"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Tag</label>
              <select
                className="form-select"
                value={newBlock.tagId}
                onChange={e => setNewBlock({ ...newBlock, tagId: e.target.value })}
              >
                <option value="">Select a tag...</option>
                {tags.map(tag => (
                  <option key={tag.id} value={tag.id}>{tag.name}</option>
                ))}
              </select>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Day</label>
                <select
                  className="form-select"
                  value={newBlock.dayOfWeek}
                  onChange={e => setNewBlock({ ...newBlock, dayOfWeek: parseInt(e.target.value) })}
                >
                  {weekDays.map((day, i) => (
                    <option key={i} value={i}>{format(day, 'EEEE, MMM d')}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Start Time</label>
                <input
                  type="time"
                  className="form-input"
                  value={newBlock.startTime}
                  onChange={e => setNewBlock({ ...newBlock, startTime: e.target.value })}
                />
              </div>
            </div>
            {/* Time Fields - All Three */}
            <div className="form-row time-fields-row">
              <div className="form-group">
                <label className="form-label">Start Time</label>
                <input
                  type="time"
                  className="form-input"
                  value={newBlock.startTime}
                  onChange={e => {
                    const newStartTime = e.target.value
                    const newEndTime = calculateEndTime(newStartTime, newBlock.duration)
                    setNewBlock({ ...newBlock, startTime: newStartTime, endTime: newEndTime })
                  }}
                />
              </div>
              <div className="form-group">
                <label className="form-label">End Time</label>
                <input
                  type="time"
                  className="form-input"
                  value={newBlock.endTime}
                  onChange={e => {
                    const newEndTime = e.target.value
                    const newDuration = calculateDuration(newBlock.startTime, newEndTime)
                    setNewBlock({ ...newBlock, endTime: newEndTime, duration: newDuration })
                  }}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Duration</label>
                <div className="duration-input-wrapper">
                  <input
                    type="number"
                    className="form-input duration-input"
                    value={newBlock.duration}
                    min="15"
                    step="15"
                    onChange={e => {
                      const newDuration = Math.max(15, parseInt(e.target.value) || 15)
                      const newEndTime = calculateEndTime(newBlock.startTime, newDuration)
                      setNewBlock({ ...newBlock, duration: newDuration, endTime: newEndTime })
                    }}
                  />
                  <span className="duration-unit">min</span>
                </div>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Notes (optional)</label>
              <input
                type="text"
                className="form-input"
                value={newBlock.notes}
                onChange={e => setNewBlock({ ...newBlock, notes: e.target.value })}
              />
            </div>
            
            {/* Recurrence Section */}
            <div className="form-group">
              <label className="form-label">Repeat</label>
              <select
                className="form-select"
                value={newBlock.recurrence?.type || 'none'}
                onChange={e => setNewBlock({ 
                  ...newBlock, 
                  recurrence: { type: e.target.value as RecurrenceType }
                })}
              >
                <option value="none">Does not repeat</option>
                <option value="daily">Daily</option>
                <option value="weekdays">Every weekday (Mon-Fri)</option>
                <option value="weekends">Weekends (Sat-Sun)</option>
                <option value="weekly">Weekly on {weekDays[newBlock.dayOfWeek] ? format(weekDays[newBlock.dayOfWeek], 'EEEE') : 'this day'}</option>
                <option value="biweekly">Every other week</option>
                <option value="monthly">Monthly on this date</option>
                <option value="monthly-weekday">Monthly on the {Math.floor(newBlock.dayOfWeek / 7) + 1}{['st', 'nd', 'rd', 'th'][Math.floor(newBlock.dayOfWeek / 7)] || 'th'} {weekDays[newBlock.dayOfWeek] ? format(weekDays[newBlock.dayOfWeek], 'EEEE') : 'day'}</option>
                <option value="yearly">Annually on this date</option>
              </select>
            </div>
            
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAddBlock} disabled={!newBlock.tagId || !newBlock.name}>
                Add Block
              </button>
            </div>
          </div>
        </div>
      )}

      {editingBlock && (
        <div className="modal-overlay" onClick={() => setEditingBlock(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">Edit Time Block</h3>
            {/* Check if this block is part of a recurring series */}
            <div className="form-group">
              <label className="form-label">Name</label>
              <input
                type="text"
                className="form-input"
                value={editingBlock.name || ''}
                onChange={e => setEditingBlock({ ...editingBlock, name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Tag</label>
              <select
                className="form-select"
                value={editingBlock.tagId}
                onChange={e => setEditingBlock({ ...editingBlock, tagId: e.target.value })}
              >
                {tags.map(tag => (
                  <option key={tag.id} value={tag.id}>{tag.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Day</label>
              <select
                className="form-select"
                value={editingBlock.dayOfWeek}
                onChange={e => setEditingBlock({ ...editingBlock, dayOfWeek: parseInt(e.target.value) })}
              >
                {weekDays.map((day, i) => (
                  <option key={i} value={i}>{format(day, 'EEEE, MMM d')}</option>
                ))}
              </select>
            </div>
            {/* Time Fields - All Three */}
            <div className="form-row time-fields-row">
              <div className="form-group">
                <label className="form-label">Start Time</label>
                <input
                  type="time"
                  className="form-input"
                  value={editingBlock.startTime}
                  onChange={e => {
                    const newStartTime = e.target.value
                    const newEndTime = calculateEndTime(newStartTime, editingBlock.duration)
                    setEditingBlock({ ...editingBlock, startTime: newStartTime, endTime: newEndTime })
                  }}
                />
              </div>
              <div className="form-group">
                <label className="form-label">End Time</label>
                <input
                  type="time"
                  className="form-input"
                  value={editingBlock.endTime || calculateEndTime(editingBlock.startTime, editingBlock.duration)}
                  onChange={e => {
                    const newEndTime = e.target.value
                    const newDuration = calculateDuration(editingBlock.startTime, newEndTime)
                    setEditingBlock({ ...editingBlock, endTime: newEndTime, duration: newDuration })
                  }}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Duration</label>
                <div className="duration-input-wrapper">
                  <input
                    type="number"
                    className="form-input duration-input"
                    value={editingBlock.duration}
                    min="15"
                    step="15"
                    onChange={e => {
                      const newDuration = Math.max(15, parseInt(e.target.value) || 15)
                      const newEndTime = calculateEndTime(editingBlock.startTime, newDuration)
                      setEditingBlock({ ...editingBlock, duration: newDuration, endTime: newEndTime })
                    }}
                  />
                  <span className="duration-unit">min</span>
                </div>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Notes</label>
              <input
                type="text"
                className="form-input"
                value={editingBlock.notes || ''}
                onChange={e => setEditingBlock({ ...editingBlock, notes: e.target.value })}
              />
            </div>
            {/* Recurrence Section */}
            <div className="form-group">
              <label className="form-label">Repeat</label>
              <select
                className="form-select"
                value={editingBlock.recurrence?.type || 'none'}
                onChange={e => setEditingBlock({ 
                  ...editingBlock, 
                  recurrence: { type: e.target.value as RecurrenceType }
                })}
              >
                <option value="none">Does not repeat</option>
                <option value="daily">Daily</option>
                <option value="weekdays">Every weekday (Mon-Fri)</option>
                <option value="weekends">Weekends (Sat-Sun)</option>
                <option value="weekly">Weekly on {weekDays[editingBlock.dayOfWeek] ? format(weekDays[editingBlock.dayOfWeek], 'EEEE') : 'this day'}</option>
                <option value="biweekly">Every other week</option>
                <option value="monthly">Monthly on this date</option>
                <option value="monthly-weekday">Monthly on the {Math.floor(editingBlock.dayOfWeek / 7) + 1}{['st', 'nd', 'rd', 'th'][Math.floor(editingBlock.dayOfWeek / 7)] || 'th'} {weekDays[editingBlock.dayOfWeek] ? format(weekDays[editingBlock.dayOfWeek], 'EEEE') : 'day'}</option>
                <option value="yearly">Annually on this date</option>
              </select>
            </div>
            <div className="modal-actions">
              <button 
                className="btn btn-danger" 
                onClick={() => {
                  deleteTimeBlock(editingBlock.id)
                  setEditingBlock(null)
                }}
              >
                Delete
              </button>
              <button className="btn btn-secondary" onClick={() => setEditingBlock(null)}>Cancel</button>
              {(editingBlock.parentId || timeBlocks.some(b => b.parentId === editingBlock.id)) ? (
                // Recurring event - show both options
                <>
                  <button className="btn btn-secondary" onClick={() => handleUpdateBlock(false)}>
                    Save This Event
                  </button>
                  <button className="btn btn-primary" onClick={() => handleUpdateBlock(true)}>
                    Save All Events
                  </button>
                </>
              ) : (
                // Single event - just save
                <button className="btn btn-primary" onClick={() => handleUpdateBlock(false)}>
                  Save
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TimeGrid
