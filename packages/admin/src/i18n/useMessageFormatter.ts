import { IntlMessageFormat } from 'intl-messageformat'
import { ReactNode, useCallback, useMemo } from 'react'
import { DictionaryCache } from './DictionaryCache'
import { I18nError } from './I18nError'
import { I18nMetadata } from './I18nMetadata'
import { MessageDictionary, MessageDictionaryKeys } from './MessageDictionary'
import { MessageFormatter } from './MessageFormatter'
import { useI18n } from './useI18n'

const formatMessage = (
	i18n: I18nMetadata,
	fallback: DictionaryCache,
	key: string,
	values: Record<string, any> | undefined,
): string => {
	let message: IntlMessageFormat | undefined
	try {
		message = i18n.dictionaryResolver.getMessageFormat(i18n.locale, key, fallback)
	} catch (e) {
		const original = i18n.dictionaryResolver.getResolvedMessageForDebuggingPurposes(i18n.locale, key, fallback)

		throw new I18nError(
			`Failed to format key '${key}'.${original ? ` It resolved to\n${original}` : ''}\n\n${e.message}`,
		)
	}

	if (message === undefined) {
		throw new I18nError(
			`Cannot translate the message '${key}'. It's neither in the resolved nor the fallback dictionary.`,
		)
	}

	try {
		// TODO the `as string` is likely wrong?
		return message.format(values as any) as string
	} catch (e) {
		const original = i18n.dictionaryResolver.getResolvedMessageForDebuggingPurposes(i18n.locale, key, fallback)
		throw new I18nError(`Failed to format key '${key}'. It resolved to\n${original}\n\n${e.message}`)
	}
}

export const useMessageFormatter = <Dict extends MessageDictionary>(
	defaultDictionary: Dict,
): MessageFormatter<Dict> => {
	const i18n = useI18n()
	const fallbackDictionaryCache = useMemo(() => new DictionaryCache(defaultDictionary), [defaultDictionary])

	return useCallback<MessageFormatter<Dict>>(
		<U extends ReactNode>(
			...args:
				| [key: MessageDictionaryKeys<Dict>, values?: Record<string, any>]
				| [userSpecifiedKey: U, fallbackKey: MessageDictionaryKeys<Dict>, values?: Record<string, any>]
		): U | string => {
			if (args.length === 1 || (args.length === 2 && typeof args[1] !== 'string')) {
				const [key, values] = args as [MessageDictionaryKeys<Dict>, Record<string, any> | undefined]

				return formatMessage(i18n, fallbackDictionaryCache, key, values)
			} else {
				const [userSpecifiedKey, fallbackKey, values] = args as [
					U,
					MessageDictionaryKeys<Dict>,
					Record<string, unknown> | undefined,
				]

				if (userSpecifiedKey !== undefined) {
					// The user-specified key isn't mandatory
					if (typeof userSpecifiedKey === 'string') {
						// This is a string but it might not be a message path but an already user-readable message.
						const message = i18n.dictionaryResolver.getMessageFormat(
							i18n.locale,
							userSpecifiedKey,
							fallbackDictionaryCache,
						)
						if (message === undefined) {
							// The user key is probably a message then.
							// Can we warn if it suspiciously looks like a typo? Like if it's /\w+(\.\w+)*/
							return userSpecifiedKey
						}
						return message.format(values) as string
					}
					// It's probably a ReactNode that handles strings through other means.
					return userSpecifiedKey
				}
				return formatMessage(i18n, fallbackDictionaryCache, fallbackKey, values)
			}
		},
		[fallbackDictionaryCache, i18n],
	)
}
