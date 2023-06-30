import { NonOptional, stateDataAttributes, useClassName } from '@contember/utilities'
import { PropsWithChildren } from 'react'
import { mergeProps } from 'react-aria'
import { Intent, Scheme } from '../../types'
import { toSchemeClass, toThemeClass } from '../../utils'

export type StyleProviderProps = {
	transparent?: boolean;
	displayContents?: boolean;
	scheme?: Scheme;
	themeContent?: Intent;
	themeControls?: Intent;
	overridesLucideIcons?: boolean;
}

const initialValues: NonOptional<StyleProviderProps> = {
	displayContents: true,
	overridesLucideIcons: true,
	scheme: 'light',
	themeContent: 'default',
	themeControls: 'primary',
	transparent: true,
}

export const StyleProvider = ({
	children,
	...props
}: PropsWithChildren<StyleProviderProps>) => {
	const { scheme, themeContent, themeControls, ...state } = mergeProps(initialValues, props)

	return (
		<div
			{...stateDataAttributes(state)}
			className={useClassName('root', [
				toThemeClass(themeContent, themeControls),
				toSchemeClass(scheme),
			])}
		>
			{children}
		</div>
	)
}
StyleProvider.displayName = 'Interface.StyleProvider'
