import { KebabCase } from 'type-fest'
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

			return undefined
		} else {
			return className
		}
	}).filter(Boolean) as string[]

	const themeClassNames: (string | undefined)[] = []

	const content = contentThemeClassName(theme.content)
	const controls = controlsThemeClassName(theme.controls)

	themeClassNames.push(content, controls)

	const flatThemedClassName = flatClassNameList(themeClassNames)

	if (flatThemedClassName.length > 0 || colorScheme) {
		return [colorScheme ?? defaultColorSchemeContext, ...flatThemedClassName, ...flatClassName]
	} else {
		return flatClassName
	}
}
