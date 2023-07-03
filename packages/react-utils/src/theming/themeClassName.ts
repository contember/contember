import { KebabCase } from '@contember/utilities'

/**
 * Returns a tuple of two strings
 *
 * - the first one is the content theme class name, prefixed with `theme-` and suffixed with `-content`
 * - the second one is the controls theme class name, prefixed with `theme-` and suffixed with `-controls`
 *
 * @param contentTheme - Theme name basis for content
 * @param controlsTheme - Theme name basis for controls
 * @param state - State of the theme starting with a ":", e.g. `":hover"`, `":focus"`, `":active"`, `":focus-visible"`
 * @returns A tuple of two theme strings
 *
 * @example
 * ```tsx
 * const [contentThemeClassName, controlsThemeClassName] = getThemeClassName('default', 'corporate', ':hover')
 * //  ^ ['theme-default-content:hover', 'theme-corporate-controls:hover']
 *
 * return (
 * 	<div className={contentThemeClassName}>
 * 		<button className={controlsThemeClassName}>Click me</button>
 * 	</div>
 * )
 * ```
 *
 *
 */
export function getThemeClassName<
	ContentTheme extends KebabCase<string> = KebabCase<string>,
	ControlsTheme extends KebabCase<string> = KebabCase<string>,
	State extends KebabCase<string> = KebabCase<string>
>(
	contentTheme: ContentTheme | null | undefined,
	controlsTheme: ControlsTheme | null | undefined,
	state?: State extends KebabCase<State> ? `:${State}` : never,
): [string | undefined, string | undefined] {
	return [
		contentTheme ? `theme-${contentTheme}-content${state ?? ''}` : undefined,
		controlsTheme ? `theme-${controlsTheme}-controls${state ?? ''}` : undefined,
	]
}
