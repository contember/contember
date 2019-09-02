import { toEnumClass } from './toEnumClass'

export const toEnumStateClass = <N extends string>(name: N | undefined, namedDefault?: N) =>
	toEnumClass<N>('is-', name, namedDefault)
