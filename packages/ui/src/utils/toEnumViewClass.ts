import { toEnumClass } from './toEnumClass'

export const toEnumViewClass = (name: string | undefined) => toEnumClass('view-', name)
