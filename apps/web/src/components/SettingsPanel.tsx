import { useState } from 'react'
import { useAppStore } from '../store'
import type { Settings } from '../types'
import { v4 as uuidv4 } from 'uuid'
import { defaultPalettes } from '../utils/defaults'

interface SettingsPanelProps {
  onClose: () => void
}

function SettingsPanel({ onClose }: SettingsPanelProps) {
  const { settings, tags, setSettings, addTag, updateTag, deleteTag, setTags, setHasCompletedSetup } = useAppStore()
  const [showTagManager, setShowTagManager] = useState(false)
  const [newTag, setNewTag] = useState({ name: '', color: '#4A90D9' })
  const [selectedPalette, setSelectedPalette] = useState<string | null>(null)
  const [customPalettes, setCustomPalettes] = useState<Record<string, string[]>>({})
  const [showSavePalette, setShowSavePalette] = useState(false)
  const [newPaletteName, setNewPaletteName] = useState('')

  const allPalettes = { ...defaultPalettes, ...customPalettes }

  const handleSettingChange = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings({ [key]: value })
  }

  const handleAddTag = () => {
    if (!newTag.name.trim()) return
    addTag({
      id: uuidv4(),
      name: newTag.name,
      color: newTag.color,
      isBuffer: false
    })
    setNewTag({ name: '', color: '#4A90D9' })
  }

  const handleApplyPalette = (paletteName: string) => {
    const colors = allPalettes[paletteName]
    const updatedTags = tags.map((tag, index) => ({
      ...tag,
      color: colors[index % colors.length]
    }))
    setTags(updatedTags)
  }

  const handleSavePalette = () => {
    if (!newPaletteName.trim()) return
    const colors = tags.map(tag => tag.color)
    const newPalettes = { ...customPalettes, [newPaletteName]: colors }
    setCustomPalettes(newPalettes)
    setNewPaletteName('')
    setShowSavePalette(false)
  }

  const handleDeleteCustomPalette = (name: string) => {
    const newPalettes = { ...customPalettes }
    delete newPalettes[name]
    setCustomPalettes(newPalettes)
  }

  const handleResetSetup = () => {
    setHasCompletedSetup(false)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', maxHeight: '80vh', overflow: 'auto' }}>
        <h3 className="modal-title">Settings</h3>

        <div className="settings-section">
          <h4 className="settings-section-title">Appearance</h4>
          <div className="setting-item">
            <span className="setting-label">Use 24-hour clock</span>
            <div
              className={`toggle ${settings.use24Hour ? 'active' : ''}`}
              onClick={() => handleSettingChange('use24Hour', !settings.use24Hour)}
            ></div>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
            Change theme using the button in the header
          </p>
        </div>

        <div className="settings-section">
          <h4 className="settings-section-title">Accessibility</h4>
          <div className="setting-item">
            <span className="setting-label">Color Vision Mode</span>
            <select
              className="form-select"
              value={settings.colorBlindMode || 'none'}
              onChange={e => handleSettingChange('colorBlindMode', e.target.value as Settings['colorBlindMode'])}
              style={{ width: '200px' }}
            >
              <option value="none">Standard Vision</option>
              <option value="deuteranopia">Deuteranopia (Green-Blind)</option>
              <option value="protanopia">Protanopia (Red-Blind)</option>
              <option value="tritanopia">Tritanopia (Blue-Blind)</option>
              <option value="achromatopsia">Achromatopsia (Monochromacy)</option>
            </select>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
            Adds enhanced borders and patterns to help distinguish colors
          </p>
        </div>

        <div className="settings-section">
          <h4 className="settings-section-title">Week</h4>
          <div className="setting-item">
            <span className="setting-label">Start week on Sunday</span>
            <div
              className={`toggle ${settings.weekStartsOnSunday ? 'active' : ''}`}
              onClick={() => handleSettingChange('weekStartsOnSunday', !settings.weekStartsOnSunday)}
            ></div>
          </div>
        </div>

        <div className="settings-section">
          <h4 className="settings-section-title">Time Range</h4>
          <div className="setting-item">
            <span className="setting-label">Start hour</span>
            <select
              className="form-select"
              value={settings.defaultStartHour}
              onChange={e => handleSettingChange('defaultStartHour', parseInt(e.target.value))}
              style={{ width: '100px' }}
            >
              {Array.from({ length: 24 }, (_, i) => {
                const hourLabel = settings.use24Hour 
                  ? `${i.toString().padStart(2, '0')}:00`
                  : i === 0 ? '12:00 AM'
                  : i === 12 ? '12:00 PM'
                  : i < 12 ? `${i}:00 AM`
                  : `${i - 12}:00 PM`
                return <option key={i} value={i}>{hourLabel}</option>
              })}
            </select>
          </div>
          <div className="setting-item">
            <span className="setting-label">End hour</span>
            <select
              className="form-select"
              value={settings.defaultEndHour}
              onChange={e => handleSettingChange('defaultEndHour', parseInt(e.target.value))}
              style={{ width: '100px' }}
            >
              {Array.from({ length: 24 }, (_, i) => {
                const hourLabel = settings.use24Hour 
                  ? `${i.toString().padStart(2, '0')}:00`
                  : i === 0 ? '12:00 AM'
                  : i === 12 ? '12:00 PM'
                  : i < 12 ? `${i}:00 AM`
                  : `${i - 12}:00 PM`
                return <option key={i} value={i}>{hourLabel}</option>
              })}
            </select>
          </div>
        </div>

        <div className="settings-section">
          <h4 className="settings-section-title">Behavior</h4>
          <div className="setting-item">
            <span className="setting-label">Push blocks when dragging</span>
            <div
              className={`toggle ${settings.pushBlocksOnDrag ? 'active' : ''}`}
              onClick={() => handleSettingChange('pushBlocksOnDrag', !settings.pushBlocksOnDrag)}
            ></div>
          </div>
          <div className="setting-item">
            <span className="setting-label">Time increment</span>
            <select
              className="form-select"
              value={settings.timeIncrement}
              onChange={e => handleSettingChange('timeIncrement', e.target.value as Settings['timeIncrement'])}
              style={{ width: '120px' }}
            >
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={60}>60 minutes</option>
              <option value="freeform">Freeform</option>
            </select>
          </div>
        </div>

        <div className="settings-section">
          <h4 className="settings-section-title">Tags</h4>
          <button className="toolbar-btn" onClick={() => setShowTagManager(!showTagManager)}>
            {showTagManager ? 'Hide' : 'Manage'} Tags
          </button>
          
          {showTagManager && (
            <div style={{ marginTop: '16px' }}>
              <div className="palette-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label">Color Palettes</label>
                  <button className="toolbar-btn" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={() => setShowSavePalette(!showSavePalette)}>
                    {showSavePalette ? 'Cancel' : '+ Save Palette'}
                  </button>
                </div>

                {showSavePalette && (
                  <div className="save-palette-form">
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Palette name"
                      value={newPaletteName}
                      onChange={(e) => setNewPaletteName(e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <button className="btn btn-primary" onClick={handleSavePalette} disabled={!newPaletteName.trim()}>
                      Save
                    </button>
                  </div>
                )}

                <div className="palette-grid">
                  {Object.keys(allPalettes).map(paletteName => (
                    <div
                      key={paletteName}
                      className={`palette-option ${selectedPalette === paletteName ? 'selected' : ''}`}
                      onClick={() => {
                        setSelectedPalette(paletteName)
                        handleApplyPalette(paletteName)
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div className="palette-name">{paletteName}</div>
                        {customPalettes[paletteName] && (
                          <button
                            className="palette-delete-btn"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteCustomPalette(paletteName)
                            }}
                          >
                            x
                          </button>
                        )}
                      </div>
                      <div className="palette-colors">
                        {allPalettes[paletteName].slice(0, 10).map((color, i) => (
                          <div key={i} className="palette-color" style={{ backgroundColor: color }} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: '16px' }}>
                <label className="form-label">Current Tags</label>
                {tags.map(tag => (
                  <div key={tag.id} className="wizard-tag-item" style={{ marginBottom: '8px' }}>
                    <input
                      type="color"
                      className="tag-color-input"
                      value={tag.color}
                      onChange={e => updateTag(tag.id, { color: e.target.value })}
                    />
                    <input
                      type="text"
                      className="tag-input"
                      value={tag.name}
                      onChange={e => updateTag(tag.id, { name: e.target.value })}
                    />
                    <button
                      className="btn btn-danger"
                      style={{ padding: '4px 8px', fontSize: '12px' }}
                      onClick={() => deleteTag(tag.id)}
                    >
                      Delete
                    </button>
                  </div>
                ))}
                <div className="wizard-tag-item" style={{ marginTop: '12px' }}>
                  <input
                    type="color"
                    className="tag-color-input"
                    value={newTag.color}
                    onChange={e => setNewTag({ ...newTag, color: e.target.value })}
                  />
                  <input
                    type="text"
                    className="tag-input"
                    placeholder="New tag name"
                    value={newTag.name}
                    onChange={e => setNewTag({ ...newTag, name: e.target.value })}
                  />
                  <button className="btn btn-primary" onClick={handleAddTag}>Add</button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="settings-section">
          <h4 className="settings-section-title">Advanced</h4>
          <button className="toolbar-btn" onClick={handleResetSetup}>
            Re-run Setup Wizard
          </button>
        </div>

        <div className="modal-actions">
          <button className="btn btn-primary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}

export default SettingsPanel
