import { memo } from 'react'
import { ColorSchemeContext, useColorScheme } from './contexts'

export type ColorSchemeProviderProps = {
	children: React.ReactNode
	scheme?: string
}

export const ColorSchemeProvider = memo(({ children, scheme }: ColorSchemeProviderProps) => {
	const inheritedColorScheme = useColorScheme()

	return (
		<ColorSchemeContext.Provider value={scheme ?? inheritedColorScheme}>{children}</ColorSchemeContext.Provider>
	)
})
ColorSchemeProvider.displayName = 'Interface.ColorSchemeProvider'
