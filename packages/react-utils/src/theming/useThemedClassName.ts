import { flatClassNameList, KebabCase, NestedClassName } from '@contember/utilities'
import { THEME_CLASS_NAME_REG_EXP } from './constants'
import { useColorScheme } from './contexts'
import { themeClassName } from './themeClassName'

export type ThemeConfig = { content: string | undefined, controls: string | undefined }

/**
 * Looks for theme CSS classes in the given class name, deduplicates them and returns final theme class name with scheme CSS class set
 * @internal
 *
 * @param className - class name string or array of class names, even nested
 * @returns array of theme class names
 *
 * @see getThemeClassName
 * @see THEME_CLASS_NAME_REG_EXP
 * @see useColorScheme
 *
 * @example
 * ```tsx
 * function Button({ className }: { className?: string | string[] }) {
 * 	 const [contentThemeClassName, controlsThemeClassName] = useThemedClassName(className)
 *
 * 	 return (
 * 		 <div className={contentThemeClassName}>
 * 			 <button className={controlsThemeClassName}>Click me</button>
 * 		 </div>
 * 	 )
 * }
 *
 * function App() {
 * 	 return (
 * 		 <Button className="theme-default theme-danger:hover" />
 * 	 )
 * }
 *
 * // renders:
 * // <div class="scheme-system theme-default-content theme-danger-content:hover">
 * // 	<button class="scheme-system theme-default-controls theme-danger-controls:hover">Click me</button>
 * // </div>
 * ```
 */
export function useThemedClassName(className: NestedClassName): (string | undefined)[] {
	const theme: ThemeConfig = { content: undefined, controls: undefined }
	const stateThemes: Record<string, ThemeConfig> = {}
	const colorScheme = `scheme-${useColorScheme()}`
	let schemeClassName: string | undefined = undefined

	const flatClassName = flatClassNameList(className).map(className => {
		if (className.startsWith('scheme-')) {
			schemeClassName = className

			return undefined
		}

		const match = className.match(THEME_CLASS_NAME_REG_EXP)

		if (match) {
			const name = match.groups!.name as KebabCase<string>
			const scope = match.groups!.scope as KebabCase<string>
			const state = match.groups!.state as `:${KebabCase<string>}`

			if (state) {
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

	if (theme.content || theme.controls) {
		const [content, controls] = getThemeClassName(theme.content, theme.controls)
		themeClassNames.push(content, controls)
	}

	for (const state in stateThemes) {
		const { content, controls } = stateThemes[state]
		const [contentClassName, controlsClassName] = getThemeClassName(content, controls, state as `:${KebabCase<string>}`)

		themeClassNames.push(contentClassName, controlsClassName)
	}

	const flatThemeClassNames = flatClassNameList(themeClassNames)

	return [schemeClassName ?? colorScheme, ...flatThemeClassNames, ...flatClassName]
}
