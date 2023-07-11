import { KebabCase } from 'type-fest'
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
export function colorSchemeClassName<S extends KebabCase<string> = KebabCase<string>>(scheme: S): ColorSchemeClassName<S>;
export function colorSchemeClassName<S extends KebabCase<string> = KebabCase<string>>(scheme: null | undefined): undefined;
export function colorSchemeClassName<S extends KebabCase<string> = KebabCase<string>>(scheme: S | null | undefined): ColorSchemeClassName<S> | undefined;
export function colorSchemeClassName<S extends KebabCase<string> = KebabCase<string>>(scheme: S | null | undefined): ColorSchemeClassName<S> | undefined {
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
export function isColorSchemeClassName<T extends string>(value: string): value is ColorSchemeClassName<T> {
	return COLOR_SCHEME_CLASS_NAME_REG_EXP.test(value)
}
