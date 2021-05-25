import { emptyObject } from '@contember/react-utils'
import { ReactNode, useMemo } from 'react'
import { defaultLocale } from './defaultLocale'
import { DictionaryResolver } from './DictionaryResolver'
import { I18nContext } from './I18nContext'
import type { I18nMetadata } from './I18nMetadata'
import type { Locale } from './Locale'
import type { MessageDictionaryByLocaleCode } from './MessageDictionary'

export interface I18nProviderProps {
	localeCode: string | undefined
	dictionaries: MessageDictionaryByLocaleCode | undefined

	children: ReactNode
}
export function I18nProvider({ localeCode, dictionaries = emptyObject, children }: I18nProviderProps) {
	const locale = useMemo<Locale>(() => ({ code: localeCode || defaultLocale.code }), [localeCode])
	const metadata = useMemo<I18nMetadata>(
		() => ({
			locale,
			dictionaryResolver: new DictionaryResolver(dictionaries),
		}),
		[dictionaries, locale],
	)
	return <I18nContext.Provider value={metadata}>{children}</I18nContext.Provider>
}
