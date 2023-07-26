import { deprecate } from '@contember/utilities'
import { Scheme } from '../types'
import { toEnumClass } from '../utils/toEnumClass'

/**
 * @deprecated Use `colorSchemeClassName` from `@contember/react-utils` instead.
 */
export const toSchemeClass = <T extends string = Scheme>(scheme?: T) => {
	deprecate('1.3.0', true, 'toSchemeClass function', 'import { colorSchemeClassName } from \'@contember/react-utils\'')
	return toEnumClass('scheme-', scheme)
}
