import { useState } from 'react'
import { useAppStore } from '../store'
import type { Settings, Tag } from '../types'
import { v4 as uuidv4 } from 'uuid'
import { defaultTags, defaultPalettes } from '../utils/defaults'
import { formatHour } from '../utils/time'

type Step = 'welcome' | 'skin' | 'timeFormat' | 'timeRange' | 'weekStart' | 'theme' | 'accessibility' | 'tags' | 'complete'

function SetupWizard() {
  const [step, setStep] = useState<Step>('welcome')
  const [tempSettings, setTempSettings] = useState<Partial<Settings>>({
    skin: 'glassmorphism',
    defaultStartHour: 6,
    defaultEndHour: 23,
    weekStartsOnSunday: true,
    theme: 'light',
    use24Hour: false,
    colorBlindMode: 'none'
  })
  const [tempTags, setTempTags] = useState<Tag[]>(defaultTags.map(t => ({ ...t, id: uuidv4() })))
  const { setSettings, setTags, setHasCompletedSetup } = useAppStore()

  const handleComplete = () => {
    setSettings(tempSettings as Settings)
    setTags(tempTags)
    setHasCompletedSetup(true)
  }

  const updateTag = (id: string, updates: Partial<Tag>) => {
    setTempTags(tempTags.map(t => t.id === id ? { ...t, ...updates } : t))
  }

  const applyPalette = (colors: string[]) => {
    setTempTags(tempTags.map((tag, index) => ({
      ...tag,
      color: colors[index % colors.length]
    })))
  }

  const renderStep = () => {
    switch (step) {
      case 'welcome':
        return (
          <div className="wizard-step">
            <h2 className="wizard-title">Welcome to TimeBlockrr</h2>
            <p className="wizard-description">
              Let's set up your time blocking experience. This will only take a few minutes.
            </p>
            <div className="wizard-nav" style={{ justifyContent: 'center' }}>
              <button className="btn btn-primary" onClick={() => setStep('skin')}>
                Let's Start
              </button>
            </div>
          </div>
        )

      case 'skin':
        return (
          <div className="wizard-step">
            <h2 className="wizard-title">Choose your visual style</h2>
            <p className="wizard-description">
              Select the look and feel that works best for you.
            </p>
            <div className="wizard-options">
              <div
                className={`wizard-option ${tempSettings.skin === 'glassmorphism' ? 'selected' : ''}`}
                onClick={() => setTempSettings({ ...tempSettings, skin: 'glassmorphism' })}
              >
                <div className="wizard-option-title">Glassmorphism</div>
                <div className="wizard-option-desc">Modern translucent glass effect</div>
              </div>
              <div
                className={`wizard-option ${tempSettings.skin === 'warm-minimalism' ? 'selected' : ''}`}
                onClick={() => setTempSettings({ ...tempSettings, skin: 'warm-minimalism' })}
              >
                <div className="wizard-option-title">Warm Minimalism</div>
                <div className="wizard-option-desc">Soft organic colors and clean design</div>
              </div>
            </div>
            <div className="wizard-nav">
              <button className="btn btn-secondary" onClick={() => setStep('welcome')}>Back</button>
              <button className="btn btn-primary" onClick={() => setStep('timeFormat')}>Next</button>
            </div>
          </div>
        )

      case 'timeFormat':
        return (
          <div className="wizard-step">
            <h2 className="wizard-title">What time format do you prefer?</h2>
            <p className="wizard-description">
              Choose how you want to display times throughout the app.
            </p>
            <div className="wizard-options">
              <div
                className={`wizard-option ${!tempSettings.use24Hour ? 'selected' : ''}`}
                onClick={() => setTempSettings({ ...tempSettings, use24Hour: false })}
              >
                <div className="wizard-option-title">12-hour</div>
                <div className="wizard-option-desc">AM / PM</div>
              </div>
              <div
                className={`wizard-option ${tempSettings.use24Hour ? 'selected' : ''}`}
                onClick={() => setTempSettings({ ...tempSettings, use24Hour: true })}
              >
                <div className="wizard-option-title">24-hour</div>
                <div className="wizard-option-desc">00:00 - 23:00</div>
              </div>
            </div>
            <div className="wizard-nav">
              <button className="btn btn-secondary" onClick={() => setStep('skin')}>Back</button>
              <button className="btn btn-primary" onClick={() => setStep('timeRange')}>Next</button>
            </div>
          </div>
        )

      case 'timeRange':
        return (
          <div className="wizard-step">
            <h2 className="wizard-title">What hours do you typically plan?</h2>
            <p className="wizard-description">
              Set your default time range for the weekly grid.
            </p>
            <div className="wizard-slider">
              <div className="slider-labels">
                <span>Start: {formatHour(tempSettings.defaultStartHour!, tempSettings.use24Hour!)}</span>
                <span>End: {formatHour(tempSettings.defaultEndHour!, tempSettings.use24Hour!)}</span>
              </div>
              <div className="range-slider-container">
                <div className="range-slider-track">
                  <div 
                    className="range-slider-fill"
                    style={{
                      left: `${(tempSettings.defaultStartHour! / 23) * 100}%`,
                      width: `${((tempSettings.defaultEndHour! - tempSettings.defaultStartHour!) / 23) * 100}%`
                    }}
                  />
                </div>
                <input
                  type="range"
                  min="0"
                  max="23"
                  value={tempSettings.defaultStartHour}
                  onChange={(e) => {
                    const val = parseInt(e.target.value)
                    if (val < tempSettings.defaultEndHour!) {
                      setTempSettings({ ...tempSettings, defaultStartHour: val })
                    }
                  }}
                  className="range-slider range-slider-min"
                />
                <input
                  type="range"
                  min="0"
                  max="23"
                  value={tempSettings.defaultEndHour}
                  onChange={(e) => {
                    const val = parseInt(e.target.value)
                    if (val > tempSettings.defaultStartHour!) {
                      setTempSettings({ ...tempSettings, defaultEndHour: val })
                    }
                  }}
                  className="range-slider range-slider-max"
                />
              </div>
              <div className="slider-value">
                {tempSettings.defaultEndHour! - tempSettings.defaultStartHour!} hours displayed
              </div>
            </div>
            <div className="wizard-nav">
              <button className="btn btn-secondary" onClick={() => setStep('timeFormat')}>Back</button>
              <button className="btn btn-primary" onClick={() => setStep('weekStart')}>Next</button>
            </div>
          </div>
        )

      case 'weekStart':
        return (
          <div className="wizard-step">
            <h2 className="wizard-title">When does your week start?</h2>
            <p className="wizard-description">
              Choose which day to start your week on.
            </p>
            <div className="wizard-options">
              <div
                className={`wizard-option ${tempSettings.weekStartsOnSunday ? 'selected' : ''}`}
                onClick={() => setTempSettings({ ...tempSettings, weekStartsOnSunday: true })}
              >
                <div className="wizard-option-title">Sunday</div>
                <div className="wizard-option-desc">Start on Sun</div>
              </div>
              <div
                className={`wizard-option ${!tempSettings.weekStartsOnSunday ? 'selected' : ''}`}
                onClick={() => setTempSettings({ ...tempSettings, weekStartsOnSunday: false })}
              >
                <div className="wizard-option-title">Monday</div>
                <div className="wizard-option-desc">Start on Mon</div>
              </div>
            </div>
            <div className="wizard-nav">
              <button className="btn btn-secondary" onClick={() => setStep('timeRange')}>Back</button>
              <button className="btn btn-primary" onClick={() => setStep('theme')}>Next</button>
            </div>
          </div>
        )

      case 'theme':
        return (
          <div className="wizard-step">
            <h2 className="wizard-title">Choose your theme</h2>
            <p className="wizard-description">
              Personal mode has a modern look. Business mode has a retro Windows 95 aesthetic.
            </p>
            <div className="wizard-options">
              <div
                className={`wizard-option ${tempSettings.theme === 'light' ? 'selected' : ''}`}
                onClick={() => setTempSettings({ ...tempSettings, theme: 'light' })}
              >
                <div className="wizard-option-title">Personal</div>
                <div className="wizard-option-desc">Modern light theme</div>
              </div>
              <div
                className={`wizard-option ${tempSettings.theme === 'business' ? 'selected' : ''}`}
                onClick={() => setTempSettings({ ...tempSettings, theme: 'business' })}
              >
                <div className="wizard-option-title">Business</div>
                <div className="wizard-option-desc">Windows 95 style</div>
              </div>
            </div>
            <div className="wizard-nav">
              <button className="btn btn-secondary" onClick={() => setStep('weekStart')}>Back</button>
              <button className="btn btn-primary" onClick={() => setStep('accessibility')}>Next</button>
            </div>
          </div>
        )

      case 'accessibility':
        return (
          <div className="wizard-step">
            <h2 className="wizard-title">Accessibility Options</h2>
            <p className="wizard-description">
              Select color vision assistance if needed. This will add patterns and enhanced labels to help distinguish tags.
            </p>
            <div className="wizard-options" style={{ flexDirection: 'column', gap: '8px' }}>
              <div
                className={`wizard-option ${tempSettings.colorBlindMode === 'none' ? 'selected' : ''}`}
                onClick={() => setTempSettings({ ...tempSettings, colorBlindMode: 'none' })}
                style={{ padding: '12px 16px' }}
              >
                <div className="wizard-option-title">Standard Vision</div>
                <div className="wizard-option-desc">No color adjustments</div>
              </div>
              <div
                className={`wizard-option ${tempSettings.colorBlindMode === 'deuteranopia' ? 'selected' : ''}`}
                onClick={() => setTempSettings({ ...tempSettings, colorBlindMode: 'deuteranopia' })}
                style={{ padding: '12px 16px' }}
              >
                <div className="wizard-option-title">Deuteranopia (Green-Blind)</div>
                <div className="wizard-option-desc">Enhanced borders and patterns for green color blindness</div>
              </div>
              <div
                className={`wizard-option ${tempSettings.colorBlindMode === 'protanopia' ? 'selected' : ''}`}
                onClick={() => setTempSettings({ ...tempSettings, colorBlindMode: 'protanopia' })}
                style={{ padding: '12px 16px' }}
              >
                <div className="wizard-option-title">Protanopia (Red-Blind)</div>
                <div className="wizard-option-desc">Enhanced borders and patterns for red color blindness</div>
              </div>
              <div
                className={`wizard-option ${tempSettings.colorBlindMode === 'tritanopia' ? 'selected' : ''}`}
                onClick={() => setTempSettings({ ...tempSettings, colorBlindMode: 'tritanopia' })}
                style={{ padding: '12px 16px' }}
              >
                <div className="wizard-option-title">Tritanopia (Blue-Blind)</div>
                <div className="wizard-option-desc">Enhanced borders and patterns for blue color blindness</div>
              </div>
              <div
                className={`wizard-option ${tempSettings.colorBlindMode === 'achromatopsia' ? 'selected' : ''}`}
                onClick={() => setTempSettings({ ...tempSettings, colorBlindMode: 'achromatopsia' })}
                style={{ padding: '12px 16px' }}
              >
                <div className="wizard-option-title">Achromatopsia (Monochromacy)</div>
                <div className="wizard-option-desc">Grayscale mode with enhanced patterns</div>
              </div>
            </div>
            <div className="wizard-nav">
              <button className="btn btn-secondary" onClick={() => setStep('theme')}>Back</button>
              <button className="btn btn-primary" onClick={() => setStep('tags')}>Next</button>
            </div>
          </div>
        )

      case 'tags':
        return (
          <div className="wizard-step">
            <h2 className="wizard-title">Set up your default tags</h2>
            <p className="wizard-description">
              You can customize the names and colors of your tags.
            </p>
            <div className="palette-section">
              <label className="form-label">Quick Colors (click to apply)</label>
              <div className="palette-grid">
                {Object.keys(defaultPalettes).map(paletteName => (
                  <div
                    key={paletteName}
                    className="palette-option"
                    onClick={() => applyPalette(defaultPalettes[paletteName])}
                  >
                    <div className="palette-name">{paletteName}</div>
                    <div className="palette-colors">
                      {defaultPalettes[paletteName].slice(0, 5).map((color, i) => (
                        <div key={i} className="palette-color" style={{ backgroundColor: color }} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="wizard-tags" style={{ marginTop: '16px' }}>
              {tempTags.map((tag) => (
                <div key={tag.id} className="wizard-tag-item">
                  <input
                    type="color"
                    className="tag-color-input"
                    value={tag.color}
                    onChange={(e) => updateTag(tag.id, { color: e.target.value })}
                  />
                  <input
                    type="text"
                    className="tag-input"
                    value={tag.name}
                    onChange={(e) => updateTag(tag.id, { name: e.target.value })}
                  />
                </div>
              ))}
            </div>
            <div className="wizard-nav">
              <button className="btn btn-secondary" onClick={() => setStep('accessibility')}>Back</button>
              <button className="btn btn-primary" onClick={() => setStep('complete')}>Next</button>
            </div>
          </div>
        )

      case 'complete':
        return (
          <div className="wizard-step">
            <h2 className="wizard-title">You're all set!</h2>
            <p className="wizard-description">
              TimeBlockrr is ready to help you plan your week.
            </p>
            <div className="wizard-nav" style={{ justifyContent: 'center' }}>
              <button className="btn btn-primary" onClick={handleComplete}>
                Start Planning
              </button>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="setup-wizard">
      {renderStep()}
    </div>
  )
}

export default SetupWizard
