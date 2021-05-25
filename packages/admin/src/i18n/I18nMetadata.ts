import type { DictionaryResolver } from './DictionaryResolver'
import type { Locale } from './Locale'

export interface I18nMetadata {
	locale: Locale
	dictionaryResolver: DictionaryResolver
}
