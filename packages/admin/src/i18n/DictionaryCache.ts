import { MessageFormatElement, parse } from '@formatjs/icu-messageformat-parser'
import type { MessageDictionary } from './MessageDictionary'

export class DictionaryCache {
	private static astCacheByDictionary: WeakMap<MessageDictionary, Map<string, MessageFormatElement[]>> = new WeakMap()

	public constructor(public readonly dictionary: MessageDictionary) {}

	public getMessageAST(key: string): MessageFormatElement[] | undefined {
		let keyCache = DictionaryCache.astCacheByDictionary.get(this.dictionary)

		if (keyCache === undefined) {
			DictionaryCache.astCacheByDictionary.set(this.dictionary, (keyCache = new Map()))
		}
		let ast = keyCache.get(key)

		if (ast === undefined) {
			const message = this.getDictionaryMessage(this.dictionary, key)

			if (message === undefined) {
				return undefined
			}
			ast = parse(message)
			keyCache.set(key, ast)
		}
		return ast
	}

	public getOriginalMessageForDebuggingPurposes(key: string): string | undefined {
		return this.getDictionaryMessage(this.dictionary, key)
	}

	private getDictionaryMessage(dictionary: MessageDictionary, key: string): string | undefined {
		// This deliberately resolves the ambiguity:
		// If the key is 'foo.bar' and the dictionary is { 'foo.bar': 'abc', foo: { bar: 'xyz' } },
		// we want to resolve to 'abc'.
		// That way, the nesting isn't mandatory. However, this only applies at the top level!

		if (key in dictionary) {
			const message = dictionary[key]

			return typeof message === 'string' ? message : undefined
		}

		const propertyPath = key.split('.')

		for (const [i, property] of propertyPath.entries()) {
			if (property in dictionary) {
				const message = dictionary[property]

				if (typeof message === 'string') {
					if (i === propertyPath.length - 1) {
						return message
					}
					return undefined
				}
				dictionary = message
			} else {
				return undefined
			}
		}
	}
}
