import type { PrimitiveType } from 'intl-messageformat'
import type { ReactNode } from 'react'
import type { MessageDictionary, MessageDictionaryKeys } from './MessageDictionary'

export type FormatJSXChunk = (parts: ReactNode) => ReactNode

export interface MessageFormatter<Dict extends MessageDictionary> {
	(key: MessageDictionaryKeys<Dict>, values?: Record<string, PrimitiveType>): string
	(key: MessageDictionaryKeys<Dict>, values?: Record<string, PrimitiveType | FormatJSXChunk>): ReactNode
	(userSpecifiedKey: string | undefined, fallbackKey: MessageDictionaryKeys<Dict>, values?: Record<string, any>): string
	<U extends ReactNode>(userSpecifiedKey: U, fallbackKey: MessageDictionaryKeys<Dict>, values?: Record<string, any>):
		| U
		| string
}
