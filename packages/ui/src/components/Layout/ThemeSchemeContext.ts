import { createContext, useContext } from 'react'
import { ThemeScheme } from './Types'

export const ThemeSchemeContext = createContext<ThemeScheme>({})

export const useThemeScheme = () => {
  const themeScheme = useContext(ThemeSchemeContext)

  return themeScheme
}
