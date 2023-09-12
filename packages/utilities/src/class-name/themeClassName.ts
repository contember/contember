import { KebabCase } from 'type-fest'
import { isDefined } from '../assert-types'
import { deprecate } from '../deprecate'
import { ThemeContentClassName, ThemeControlsClassName } from './types'

/**
 * Returns a string with a content theme class name, prefixed with `theme-` and suffixed with `-content`
 *
 * IMPORTANT: Make sure to use color scheme class in combination with theme class names.
 *
 * @param contentTheme - Theme name basis for content
 * @returns A content theme class name
 *
 * @see {@link controlsThemeClassName}
 * @see {@link (colorSchemeClassName:3)}
 *
 * @example
 * ```tsx
 * const colorScheme = colorSchemeClassName('system')
 * //  ^ 'scheme-system'
 * const contentThemeClassName = contentThemeClassName('default')
 * //  ^ 'theme-default-content'
 *
 * return (
 * 	<div className={`${colorScheme} ${contentThemeClassName}`}>
 * 		<button className={`${colorScheme} ${dangerOnMouseOverTheme}`}>Delete</button>
 * 	</div>
 * )
 * ```
 */
export function contentThemeClassName<
	ContentTheme extends KebabCase<string> = KebabCase<string>,
	State extends `:${KebabCase<string>}` | null | undefined = undefined,
>(
	theme: ContentTheme | null | undefined,
	state?: State | null | undefined,
) {
	deprecate('1.3.0', isDefined(state), '`state` argument', null)

	return theme ? `theme-${theme}-content${state ?? ''}` as ThemeContentClassName<ContentTheme, State> : undefined
}

/**
 * Returns a string with a controls theme class name, prefixed with `theme-` and suffixed with `-controls`
 *
 * IMPORTANT: Make sure to use color scheme class in combination with theme class names.
 *
 * @param theme - Theme name basis for controls
 * @returns A controls theme class name
 *
 * @see {@link contentThemeClassName}
 * @see {@link (colorSchemeClassName:3)}
 *
 * @example
 * ```tsx
 * const colorScheme = colorSchemeClassName('system')
 * //  ^ 'scheme-system'
 * const contentThemeClassName = contentThemeClassName('default')
 * //  ^ 'theme-default-content'
 *
 * return (
 * 	<div className={`${colorScheme} ${contentThemeClassName}`}>
 * 		<button className={`${colorScheme} ${dangerOnMouseOverTheme}`}>Delete</button>
 * 	</div>
 * )
 * ```
 */
export function controlsThemeClassName<
	ControlsTheme extends KebabCase<string> = KebabCase<string>,
	State extends `:${KebabCase<string>}` | null | undefined = undefined,
>(
	theme: ControlsTheme | null | undefined,
	state?: State | null | undefined,
) {
	deprecate('1.3.0', isDefined(state), '`state` argument', null)

	return theme ? `theme-${theme}-controls${state ?? ''}` as ThemeControlsClassName<ControlsTheme, State> : undefined
}

/**
 * Returns a tuple with a content theme class name and a controls theme class name, prefixed with `theme-` and suffixed with `-content` and `-controls` respectively
 *
 * IMPORTANT: Make sure to use color scheme class in combination with theme class names.
 *
 * @param theme - Theme name basis for content and controls
 * @returns A tuple with a content theme class name and a controls theme class name
 *
 * @see {@link contentThemeClassName}
 * @see {@link controlsThemeClassName}
 * @see {@link (colorSchemeClassName:3)}
 *
 * @example
 * ```tsx
 * const colorScheme = colorSchemeClassName('system')
 * //  ^ 'scheme-system'
 * const errorTheme = themeClassName('danger').join(' ')
 * //  ^ 'theme-danger-content theme-danger-controls'
 *
 * return (
 * 	<div className={`${colorScheme} ${errorTheme}`}>File not found</div>
 * )
 * ```
 */
export function themeClassName<
	Theme extends KebabCase<string> = KebabCase<string>,
	State extends `:${KebabCase<string>}` | null | undefined = undefined,
>(
	theme: Theme | null | undefined,
	state?: State | null | undefined,
) {
	deprecate('1.3.0', isDefined(state), '`state` argument', null)

	return [
		contentThemeClassName(theme, state),
		controlsThemeClassName(theme, state),
	] as const
}
