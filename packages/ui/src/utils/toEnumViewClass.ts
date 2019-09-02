import { toEnumClass } from './toEnumClass'

export const toEnumViewClass = <N extends string>(name: N | undefined, namedDefault?: N) =>
	toEnumClass<N>('view-', name, namedDefault)
