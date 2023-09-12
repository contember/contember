import { KebabCase } from 'type-fest'
import { deprecate } from '../deprecate'
import { isColorSchemeClassName } from './colorSchemeClassName'
import { THEME_CLASS_NAME_REG_EXP } from './constants'
import { flatClassNameList } from './flatClassNameList'
import { contentThemeClassName, controlsThemeClassName } from './themeClassName'
import { ColorSchemeClassName, NestedClassName } from './types'

export type ThemeConfig = { content: string | undefined, controls: string | undefined }

export function filterThemedClassName(
	nestedClassName: NestedClassName,
	defaultColorSchemeContext: ColorSchemeClassName,
) {
	const theme: ThemeConfig = { content: undefined, controls: undefined }
	const stateThemes: Record<string, ThemeConfig> = {}
	let colorScheme: ColorSchemeClassName | undefined = undefined

	const flatClassName = flatClassNameList(nestedClassName).map(className => {
		if (isColorSchemeClassName(className)) {
			colorScheme = className
			return undefined
		}

		const match = className.match(THEME_CLASS_NAME_REG_EXP)

		if (match) {
			const name = match.groups!.name as KebabCase<string>
			const scope = match.groups!.scope as KebabCase<string>
			const state = match.groups!.state as `:${KebabCase<string>}`

			if (state) {
				deprecate('1.3.0', true, 'State themes are deprecated.', null)
				stateThemes[state] = stateThemes[state] ?? { content: undefined, controls: undefined }

				if (!scope) {
					stateThemes[state].content = name
					stateThemes[state].controls = name
				} else if (scope === 'content') {
					stateThemes[state].content = name
				} else if (scope === 'controls') {
					stateThemes[state].controls = name
				} else {
					throw new Error(`Unknown theme scope: ${scope}`)
				}
			} else {
				if (!scope) {
					theme.content = name
					theme.controls = name
				} else if (scope === 'content') {
					theme.content = name
				} else if (scope === 'controls') {
					theme.controls = name
				} else {
					throw new Error(`Unknown theme scope: ${scope}`)
				}
			}

			return undefined
		} else {
			return className
		}
	}).filter(Boolean) as string[]

	const themeClassNames: (string | undefined)[] = []

	const content = contentThemeClassName(theme.content)
	const controls = controlsThemeClassName(theme.controls)

	themeClassNames.push(content, controls)

	for (const state in stateThemes) {
		const { content, controls } = stateThemes[state]

		const contentClassName = contentThemeClassName(content, state as `:${KebabCase<string>}`)
		const controlsClassName = controlsThemeClassName(controls, state as `:${KebabCase<string>}`)

		themeClassNames.push(contentClassName, controlsClassName)
	}

	const flatThemedClassName = flatClassNameList(themeClassNames)

	if (flatThemedClassName.length > 0 || colorScheme) {
		return [colorScheme ?? defaultColorSchemeContext, ...flatThemedClassName, ...flatClassName]
	} else {
		return flatClassName
	}
}
