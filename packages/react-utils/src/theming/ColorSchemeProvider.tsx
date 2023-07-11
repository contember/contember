import { KebabCase } from '@contember/utilities'
import { memo } from 'react'
import { ColorSchemeContext, useColorScheme } from './contexts'

export type ColorSchemeProviderProps<T extends KebabCase<string>> = {
	children: React.ReactNode
	scheme?: T
}

export const ColorSchemeProvider = memo(
	<T extends KebabCase<string>>({ children, scheme }: ColorSchemeProviderProps<T>) => {
		const inheritedColorScheme = useColorScheme()

		return (
			<ColorSchemeContext.Provider value={scheme ?? inheritedColorScheme}>{children}</ColorSchemeContext.Provider>
		)
	},
)
ColorSchemeProvider.displayName = 'Interface.ColorSchemeProvider'
