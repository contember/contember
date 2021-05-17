import { IntlMessageFormat } from 'intl-messageformat'
import { DictionaryCache } from './DictionaryCache'
import { Locale } from './Locale'
import { MessageDictionaryByLocaleCode } from './MessageDictionary'

export class DictionaryResolver {
	private dictionaries: Map<string, DictionaryCache> = new Map()

	public constructor(mainDictionaries: MessageDictionaryByLocaleCode) {
		for (const localeCode in mainDictionaries) {
			this.dictionaries.set(localeCode, new DictionaryCache(mainDictionaries[localeCode]))
		}
	}

	public getMessageFormat(
		locale: Locale,
		key: string,
		fallbackDictionary: DictionaryCache,
	): IntlMessageFormat | undefined {
		// TODO this fallback mechanism could and should be significantly smarter.
		let targetDictionary = this.dictionaries.get(locale.code) || fallbackDictionary
		let messageAST = targetDictionary.getMessageAST(key)

		if (messageAST === undefined) {
			targetDictionary = fallbackDictionary
			messageAST = targetDictionary.getMessageAST(key)
		}
		if (messageAST === undefined) {
			return undefined
		}
		return new IntlMessageFormat(messageAST, locale.code)
	}
}
