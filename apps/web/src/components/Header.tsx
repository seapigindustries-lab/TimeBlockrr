import { useAppStore } from '../store'

interface HeaderProps {
  onSettingsClick: () => void
  onThemeClick: () => void
  onSkinClick: () => void
}

function Header({ onSettingsClick, onThemeClick, onSkinClick }: HeaderProps) {
  const { settings } = useAppStore()
  
  const themeLabels: Record<string, string> = {
    'light': 'Light',
    'dark': 'Dark', 
    'business': 'Business'
  }

  const skinLabels: Record<string, string> = {
    'glassmorphism': 'Glass',
    'warm-minimalism': 'Warm'
  }
  
  return (
    <header className="header">
      <div className="header-brand">
        <img src="/LogoIon.svg" alt="TimeBlockrr" className="header-logo" />
        <h1 className="header-title">TimeBlockrr</h1>
      </div>
      <div className="header-controls">
        <button className="header-btn" onClick={onSkinClick} title="Toggle skin">
          {skinLabels[settings.skin] || 'Skin'}
        </button>
        <button className="header-btn" onClick={onThemeClick} title="Toggle theme">
          {themeLabels[settings.theme] || 'Theme'}
        </button>
        <button className="header-btn" onClick={onSettingsClick}>
          Settings
        </button>
      </div>
    </header>
  )
}

export default Header
