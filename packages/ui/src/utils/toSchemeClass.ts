import { Scheme } from '../types'
import { toEnumClass } from './toEnumClass'

export const toSchemeClass = <T extends Scheme>(scheme?: T) => toEnumClass('scheme-', scheme)
