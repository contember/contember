import { toEnumClass } from './toEnumClass'

export const toViewClass = (name: string | undefined) => toEnumClass('view-', name)
