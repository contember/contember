/**
 * RegExp that matches theme class names
 *
 * @internal
 *
 * If theme is `default` then it will match:
 *
 * - theme-default
 * - theme-default-content
 * - theme-default-controls
 *
 * If theme is `brand-color` then it will match:
 *
 * - theme-brand-color
 * - theme-brand-color-content
 * - theme-brand-color-controls
 */

// TODO: v1.3.0 >>> THEME_CLASS_NAME_REG_EXP = /^theme-(?<name>[\w-]+?)(?:-(?<scope>content|controls))?$/
export const THEME_CLASS_NAME_REG_EXP = /^theme-(?<name>[\w-]+?)(?:-(?<scope>content|controls))?(?<state>:[\w]+(?:[\w-]+)?)?$/

/**
 * Regular expression for testing if a string is a color scheme CSS class
 * @internal
 */
export const COLOR_SCHEME_CLASS_NAME_REG_EXP = /^scheme-(?<colorScheme>[a-z0-9]|[a-z0-9]+[a-z-]+[a-z])$/
