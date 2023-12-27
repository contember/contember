import { COLOR_SCHEME_CLASS_NAME_REG_EXP } from './constants'
import { ColorSchemeClassName } from './types'

/**
 * Returns a string with a color scheme class name, prefixed with `scheme-`
 *
 * @param scheme - Color scheme name
 * @returns A color scheme class name
 *
 * @example
 * ```tsx
 * const colorScheme = colorSchemeClassName('system')
 * //  ^ 'scheme-system'
 *
 * return (
 * 	<div className={colorScheme}>
 * 		<button className={controlsThemeClassName}>Click me</button>
 * 	</div>
 *
 * // renders:
 * // <div class="scheme-system">
 * // 	<button class="scheme-system theme-default-controls theme-danger-controls:hover">Click me</button>
 * // </div>
 * ```
 */
export function colorSchemeClassName(scheme: string): ColorSchemeClassName;
export function colorSchemeClassName(scheme: null | undefined): undefined;
export function colorSchemeClassName(scheme: string | null | undefined): ColorSchemeClassName | undefined {
	if (typeof scheme === 'string') {
		return `scheme-${scheme}`
	} else {
		return undefined
	}
}

/**
 * Tests if a string is a color scheme CSS class
 * @param value - String to test
 * @returns `true` if the string is a color scheme CSS class
 * @internal
 */
export function isColorSchemeClassName(value: string): value is ColorSchemeClassName {
	return COLOR_SCHEME_CLASS_NAME_REG_EXP.test(value)
}
