import { ColorSchemeContext, useClassName, useColorScheme } from '@contember/react-utils'
import { colorSchemeClassName, contentThemeClassName, controlsThemeClassName, stateDataAttributes } from '@contember/utilities'
import { PropsWithChildren } from 'react'
import { mergeProps } from 'react-aria'
import { useInterfaceConfig } from '../../config'
import { StyleProviderProps } from './types'

export const StyleProvider = ({ children, ...props }: PropsWithChildren<StyleProviderProps>) => {
	const { scheme, themeContent, themeControls, ...state } = mergeProps(useInterfaceConfig().StyleProvider, props)
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
