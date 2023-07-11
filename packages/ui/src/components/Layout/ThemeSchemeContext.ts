import { createContext, useContext } from 'react'
import { ThemeScheme } from './Types'

export const ThemeSchemeContext = createContext<ThemeScheme>({})
export const TitleThemeSchemeContext = createContext<ThemeScheme>({})

/** @deprecated no alternative to use instead */
export const useThemeScheme = ({
   scheme,
   theme,
   themeContent,
   themeControls,
}: ThemeScheme) => {
	const themeScheme = useContext(ThemeSchemeContext)

	return {
		scheme,
		theme,
		themeContent,
		themeControls,
		...themeScheme,
	}
}

/** @deprecated no alternative to use instead */
export const useTitleThemeScheme = ({
	scheme,
	theme,
	themeContent,
	themeControls,
}: ThemeScheme) => {
	const themeScheme = useContext(TitleThemeSchemeContext)

	return {
		scheme,
		theme,
		themeContent,
		themeControls,
		...themeScheme,
	}
}
