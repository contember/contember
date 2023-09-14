import type { IntlMessageFormat } from 'intl-messageformat'
import { createElement, Fragment, ReactElement, ReactNode, useCallback, useMemo } from 'react'
import { DictionaryCache } from './DictionaryCache'
import { I18nError } from './I18nError'
import type { I18nMetadata } from './I18nMetadata'
import type { MessageDictionary } from './MessageDictionary'
import type { MessageFormatter } from './MessageFormatter'
import { useI18n } from './useI18n'

const assignKeys = (chunks: ReactNode | ReactNode[]): ReactElement => {
	if (!Array.isArray(chunks)) {
		chunks = [chunks]
	}
	return createElement(Fragment, {
		children: (chunks as ReactNode[]).map((chunk, index) =>
			createElement(Fragment, {
				key: index,
				children: chunk,
			}),
		),
	})
}

const hasFunctionValue = (object: Record<string, unknown>): boolean => {
	for (const key in object) {
		if (typeof object[key] === 'function') {
			return true
		}
	}
	return false
}

const formatMessage = (
	i18n: I18nMetadata,
	fallback: DictionaryCache,
	key: string,
	values: Record<string, any> | undefined,
): ReactNode => {
	let message: IntlMessageFormat | undefined
	try {
		message = i18n.dictionaryResolver.getMessageFormat(i18n.locale, key, fallback)
	} catch (e) {
		const original = i18n.dictionaryResolver.getResolvedMessageForDebuggingPurposes(i18n.locale, key, fallback)

		throw new I18nError(
			`Failed to format key '${key}'.${original ? ` It resolved to\n${original}` : ''}\n\n${e instanceof Error ? e.message : null}`,
		)
	}

	if (message === undefined) {
		throw new I18nError(
			`Cannot translate the message '${key}'. It's neither in the resolved nor the fallback dictionary.`,
		)
	}

	if (values && hasFunctionValue(values)) {
		values = Object.fromEntries(
			Object.entries(values).map(([key, value]) => {
				if (typeof value === 'function') {
					return [key, (chunks: ReactNode) => value(assignKeys(chunks))]
				}
				return [key, value]
			}),
		)
	}

	try {
		let formatted = message.format(values as any)

		if (typeof formatted === 'string') {
			return formatted
		}
		return assignKeys(formatted as ReactNode[])
	} catch (e) {
		const original = i18n.dictionaryResolver.getResolvedMessageForDebuggingPurposes(i18n.locale, key, fallback)
		throw new I18nError(`Failed to format key '${key}'. It resolved to\n${original}\n\n${e instanceof Error ? e.message : null}`)
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
				| [key: string, values?: Record<string, any>]
				| [userSpecifiedKey: U, fallbackKey: string, values?: Record<string, any>]
		): U | string => {
			if (args.length === 1 || (args.length === 2 && typeof args[1] !== 'string')) {
				const [key, values] = args as [string, Record<string, any> | undefined]

				return formatMessage(i18n, fallbackDictionaryCache, key, values) as U | string
			} else {
				const [userSpecifiedKey, fallbackKey, values] = args as [U, string, Record<string, unknown> | undefined]

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
				return formatMessage(i18n, fallbackDictionaryCache, fallbackKey, values) as U | string
			}
		},
		[fallbackDictionaryCache, i18n],
	)
}
