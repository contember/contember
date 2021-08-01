import type { ReactNode } from 'react'
import type { MessageDictionary, MessageDictionaryKeys } from './MessageDictionary'

export type MessageFormatterFormatJSXChunk = (parts: ReactNode) => ReactNode
export type MessageFormatterPrimitiveType = string | number | boolean | null | undefined | Date

export interface MessageFormatter<Dict extends MessageDictionary> {
	(key: MessageDictionaryKeys<Dict>, values?: Record<string, MessageFormatterPrimitiveType>): string
	(
		key: MessageDictionaryKeys<Dict>,
		values?: Record<string, MessageFormatterPrimitiveType | MessageFormatterFormatJSXChunk>,
	): ReactNode
	(userSpecifiedKey: string | undefined, fallbackKey: MessageDictionaryKeys<Dict>, values?: Record<string, any>): string
	<U extends ReactNode>(userSpecifiedKey: U, fallbackKey: MessageDictionaryKeys<Dict>, values?: Record<string, any>):
		| U
		| string
}
