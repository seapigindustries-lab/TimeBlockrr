import { useEffect, useState } from 'react'
import { useAppStore } from './store'
import { getTheme } from './themes'
import SetupWizard from './components/SetupWizard'
import Header from './components/Header'
import TimeGrid from './components/TimeGrid'
import StatsPanel from './components/StatsPanel'
import SettingsPanel from './components/SettingsPanel'

function App() {
  const { settings, hasCompletedSetup, isLoading, loadData, setSettings } = useAppStore()
  const [showSettings, setShowSettings] = useState(false)
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null)
  const theme = getTheme(settings.theme)

  // Dynamic skin CSS loading via link tag
  useEffect(() => {
    const skin = settings.skin || 'glassmorphism'
    const linkId = 'theme-skin'
    let link = document.getElementById(linkId) as HTMLLinkElement | null
    if (!link) {
      link = document.createElement('link')
      link.id = linkId
      link.rel = 'stylesheet'
      document.head.appendChild(link)
    }
    link.href = `/themes/${skin}.css`
  }, [settings.skin])

  const cycleTheme = () => {
    const themes = ['light', 'dark', 'business'] as const
    const currentIndex = themes.indexOf(settings.theme)
    const nextTheme = themes[(currentIndex + 1) % themes.length]
    setSettings({ theme: nextTheme })
  }

  const cycleSkin = () => {
    const skins = ['glassmorphism', 'warm-minimalism'] as const
    const currentIndex = skins.indexOf(settings.skin)
    const nextSkin = skins[(currentIndex + 1) % skins.length]
    setSettings({ skin: nextSkin })
  }

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme)
  }, [settings.theme])

  useEffect(() => {
    document.documentElement.setAttribute('data-color-blind', settings.colorBlindMode || 'none')
  }, [settings.colorBlindMode])

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  if (!hasCompletedSetup) {
    return <SetupWizard />
  }

  return (
    <div className="app-container">
      <Header 
        onSettingsClick={() => setShowSettings(true)} 
        onThemeClick={cycleTheme} 
        onSkinClick={cycleSkin}
      />
      <div className="main-content">
        <TimeGrid selectedDayIndex={selectedDayIndex} onDaySelect={setSelectedDayIndex} />
        <StatsPanel selectedDayIndex={selectedDayIndex} onDaySelect={setSelectedDayIndex} />
      </div>
      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
    </div>
  )
}

export default App
