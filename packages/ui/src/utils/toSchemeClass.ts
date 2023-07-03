import { Scheme } from '../types'
import { toEnumClass } from './toEnumClass'

export const toSchemeClass = <T extends string = Scheme>(scheme?: T) => toEnumClass('scheme-', scheme)
