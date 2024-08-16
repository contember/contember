import { toKebabCase } from '../string-utilities'
import { dataAttribute } from './dataAttribute'

export function stateDataAttributes(state: Record<string, unknown>) {
	return Object.fromEntries(Object.entries(state).map(
		([key, value]) => [`data-${toKebabCase(key).toLowerCase()}`, dataAttribute(value)],
	))
}
