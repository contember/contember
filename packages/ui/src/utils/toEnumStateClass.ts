import { toEnumClass } from './toEnumClass'

export const toEnumStateClass = (name: string | undefined, namedDefault?: string) =>
	toEnumClass('is-', name, namedDefault)
