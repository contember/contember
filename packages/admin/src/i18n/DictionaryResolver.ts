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

	private resolveDictionary(locale: Locale, fallbackDictionary: DictionaryCache): DictionaryCache {
		// TODO this fallback mechanism could and should be significantly smarter.
		return this.dictionaries.get(locale.code) || fallbackDictionary
	}

	public getMessageFormat(
		locale: Locale,
		key: string,
		fallbackDictionary: DictionaryCache,
	): IntlMessageFormat | undefined {
		const targetDictionary = this.resolveDictionary(locale, fallbackDictionary)
		let messageAST = targetDictionary.getMessageAST(key)

		if (messageAST === undefined) {
			messageAST = fallbackDictionary.getMessageAST(key)
		}
		if (messageAST === undefined) {
			return undefined
		}
		return new IntlMessageFormat(messageAST, locale.code)
	}

	public getResolvedMessageForDebuggingPurposes(
		locale: Locale,
		key: string,
		fallbackDictionary: DictionaryCache,
	): string | undefined {
		const targetDictionary = this.resolveDictionary(locale, fallbackDictionary)

		return (
			targetDictionary.getOriginalMessageForDebuggingPurposes(key) ??
			fallbackDictionary.getOriginalMessageForDebuggingPurposes(key)
		)
	}
}
