/**
 * RegExp that matches theme class names
 *
 * @internal
 *
 * For example if theme is `default` then it will match:
 *
 * - theme-default
 * - theme-default:hover
 * - theme-default:active
 * - theme-default:focus
 * - theme-default-content
 * - theme-default-content:hover
 * - theme-default-content:active
 * - theme-default-content:focus
 * - theme-default-controls
 * - theme-default-controls:hover
 * - theme-default-controls:active
 * - theme-default-controls:focus
 *
 * If theme is `brand-color` then it will match:
 *
 * - theme-brand-color
 * - theme-brand-color:hover
 * - theme-brand-color:active
 * - theme-brand-color:focus
 * - theme-brand-color-content
 * - theme-brand-color-content:hover
 * - theme-brand-color-content:active
 * - theme-brand-color-content:focus
 * - theme-brand-color-controls
 * - theme-brand-color-controls:hover
 * - theme-brand-color-controls:active
 * - theme-brand-color-controls:focus
 */

export const THEME_CLASS_NAME_REG_EXP = /^theme-(?<name>[\w-]+?)(?:-(?<scope>content|controls))?(?<state>:[\w]+(?:[\w-]+)?)?$/
