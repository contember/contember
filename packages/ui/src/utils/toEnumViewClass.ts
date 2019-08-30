import { toEnumClass } from './toEnumClass'

export const toEnumViewClass = (name: string | undefined, namedDefault?: string) =>
	toEnumClass('view-', name, namedDefault)
