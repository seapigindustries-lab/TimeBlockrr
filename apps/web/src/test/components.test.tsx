import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import Header from '../components/Header'
import StatsPanel from '../components/StatsPanel'
import SettingsPanel from '../components/SettingsPanel'
import SetupWizard from '../components/SetupWizard'
import { useAppStore } from '../store'
import { defaultSettings, defaultTags } from '../utils/defaults'

// Mock store for component tests
beforeEach(() => {
  useAppStore.setState({
    settings: defaultSettings,
    tags: defaultTags,
    timeBlocks: [],
    hasCompletedSetup: true,
    isLoading: false,
    selectedBlockId: null
  })
})

describe('Header', () => {
  it('renders without crashing', () => {
    render(
      <Header
        onSettingsClick={() => {}}
        onThemeClick={() => {}}
        onSkinClick={() => {}}
      />
    )
    expect(screen.getByText('TimeBlockrr')).toBeInTheDocument()
  })

  it('displays current skin label', () => {
    render(
      <Header
        onSettingsClick={() => {}}
        onThemeClick={() => {}}
        onSkinClick={() => {}}
      />
    )
    expect(screen.getByText('Glass')).toBeInTheDocument()
  })
})

describe('StatsPanel', () => {
  it('renders without crashing', () => {
    render(<StatsPanel />)
    expect(screen.getByText('Statistics')).toBeInTheDocument()
  })

  it('shows selected block placeholder', () => {
    render(<StatsPanel />)
    expect(screen.getByText('Click a block to see details here.')).toBeInTheDocument()
  })
})

describe('SettingsPanel', () => {
  it('renders without crashing', () => {
    render(<SettingsPanel onClose={() => {}} />)
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  it('shows appearance section', () => {
    render(<SettingsPanel onClose={() => {}} />)
    expect(screen.getByText('Appearance')).toBeInTheDocument()
  })
})

describe('SetupWizard', () => {
  it('renders welcome step', () => {
    useAppStore.setState({ hasCompletedSetup: false })
    render(<SetupWizard />)
    expect(screen.getByText('Welcome to TimeBlockrr')).toBeInTheDocument()
  })
})
