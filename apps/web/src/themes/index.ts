export const lightTheme = {
  name: 'light' as const,
  colors: {
    background: '#F5F5F5',
    surface: '#FFFFFF',
    primary: '#4A90D9',
    secondary: '#9B7FD9',
    textPrimary: '#2D2D2D',
    textSecondary: '#6B6B6B',
    border: '#E0E0E0',
    success: '#5CB85C',
    warning: '#F0AD4E',
    error: '#D9534F',
    blockText: '#FFFFFF'
  }
}

export const darkTheme = {
  name: 'dark' as const,
  colors: {
    background: '#1E1E1E',
    surface: '#2D2D2D',
    primary: '#5DADE2',
    secondary: '#AF7AC5',
    textPrimary: '#E8E8E8',
    textSecondary: '#A0A0A0',
    border: '#404040',
    success: '#5CB85C',
    warning: '#F0AD4E',
    error: '#D9534F',
    blockText: '#FFFFFF'
  }
}

export const businessTheme = {
  name: 'business' as const,
  colors: {
    background: '#008080',
    surface: '#C0C0C0',
    primary: '#000080',
    secondary: '#808080',
    textPrimary: '#000000',
    textSecondary: '#000000',
    border: '#808080',
    success: '#008000',
    warning: '#FFA500',
    error: '#FF0000',
    blockText: '#000000'
  }
}

export type Theme = typeof lightTheme

export const getTheme = (themeName: 'light' | 'dark' | 'business'): typeof lightTheme | typeof darkTheme | typeof businessTheme => {
  switch (themeName) {
    case 'dark':
      return darkTheme
    case 'business':
      return businessTheme
    default:
      return lightTheme
  }
}
