import { toEnumClass } from './toEnumClass'

export const toEnumStateClass = (name: string | undefined) => toEnumClass('is-', name)
