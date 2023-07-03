import { createOptionalContextFactory } from '../context'

export const DEFAULT_COLOR_SCHEME = 'system'


/**
 * @group UI
 *
 * @description
 * Provides the current color scheme, possible values are `'light'`, `'dark'` or `'system'`.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme
 *
 */
export const [ColorSchemeContext, useColorScheme] = createOptionalContextFactory<string>(
	'Interface.ColorScheme',
	DEFAULT_COLOR_SCHEME,
)
