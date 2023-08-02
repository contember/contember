import { ColorSchemeContext, useClassName, useColorScheme } from '@contember/react-utils'
import { NonOptional, colorSchemeClassName, contentThemeClassName, controlsThemeClassName, stateDataAttributes } from '@contember/utilities'
import { PropsWithChildren } from 'react'
import { mergeProps } from 'react-aria'
import { StyleProviderProps } from './types'

const defaultProps = {
	displayContents: true,
	overridesLucideIcons: true,
	scheme: 'system',
	themeContent: 'default',
	themeControls: 'accent',
	transparent: true,
	suppressFocusRing: true,
} as NonOptional<StyleProviderProps>

export const StyleProvider = ({ children, ...props }: PropsWithChildren<StyleProviderProps>) => {
	const { scheme, themeContent, themeControls, ...state } = mergeProps(defaultProps, props)
	const colorScheme = useColorScheme()

	return (
		<ColorSchemeContext.Provider value={scheme ?? colorScheme ?? 'system'}>
			<div
				{...stateDataAttributes(state)}
				className={useClassName('root', [
					contentThemeClassName(themeContent),
					controlsThemeClassName(themeControls),
					colorSchemeClassName(scheme),
				])}
			>
				{children}
			</div>
		</ColorSchemeContext.Provider>
	)
}

StyleProvider.displayName = 'Interface.StyleProvider'
