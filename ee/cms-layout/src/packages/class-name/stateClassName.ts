import { ClassNameStateMap } from './Types'

const UPPER_CASE_REG_EXP = /([A-Z])/g

function toKebabCase(value: string) {
	return value.replace(UPPER_CASE_REG_EXP, '-$1').toLowerCase()
}

/**
 * Combines a state map of class names into a single string
 *
 * @example
 * stateClassName({ foo: true, bar: false, baz: 1 }) // => 'foo baz-1'
 *
 * @param state State map object with class names as keys and literals as values.
 * @param glue Glue to use between the class name and the value, default is '-'. Set to '' to disable.
 * @returns Combined class names as string
 */
export function stateClassName(state: ClassNameStateMap | null = null, glue = '-'): string[] {
	const entries = Object.entries(state ?? []).map(
		([className, value]) => value || value === 0
			? (value === true ? toKebabCase(className) : `${toKebabCase(className)}${glue}${value}`)
			: '',
	).filter(Boolean)

	return entries
}
