// This isn't in i18n in order to avoid unnecessary circular imports.
import type { RepeaterDictionary } from './components'

// This should ideally be a complete list of all individual dictionaries throughout the entire package.
// That way, translation packages can implement this and have TS warn them about missing messages.
export type AdminDictionary = RepeaterDictionary
