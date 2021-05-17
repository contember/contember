import { DictionaryResolver } from './DictionaryResolver'
import { Locale } from './Locale'

export interface I18nMetadata {
	locale: Locale
	dictionaryResolver: DictionaryResolver
}
