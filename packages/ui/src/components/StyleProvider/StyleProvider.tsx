import { ColorSchemeContext, useClassName, useColorScheme } from '@contember/react-utils'
import { NonOptional, colorSchemeClassName, contentThemeClassName, controlsThemeClassName, stateDataAttributes, themeClassName } from '@contember/utilities'
import { PropsWithChildren } from 'react'
import { mergeProps } from 'react-aria'
import { Intent, Scheme } from '../../types'

export type StyleProviderProps = {
	displayContents?: boolean;
	overridesLucideIcons?: boolean;
	scheme?: Scheme;
	themeContent?: Intent;
	themeControls?: Intent;
	transparent?: boolean;
}

const initialValues: NonOptional<StyleProviderProps> = {
	displayContents: true,
	overridesLucideIcons: true,
	scheme: 'system',
	themeContent: 'default',
	themeControls: 'primary',
	transparent: true,
}

export const StyleProvider = ({ children, ...props }: PropsWithChildren<StyleProviderProps>) => {
	const { scheme, themeContent, themeControls, ...state } = mergeProps(initialValues, props)
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
