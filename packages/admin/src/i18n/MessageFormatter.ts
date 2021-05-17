import { PrimitiveType } from 'intl-messageformat'
import { ReactNode } from 'react'
import { MessageDictionary, MessageDictionaryKeys } from './MessageDictionary'

export type FormatJSXChunk = (parts: ReactNode) => ReactNode

export interface MessageFormatter<Dict extends MessageDictionary> {
	(key: MessageDictionaryKeys<Dict>, values?: Record<string, PrimitiveType>): string
	(key: MessageDictionaryKeys<Dict>, values?: Record<string, PrimitiveType | FormatJSXChunk>): ReactNode
	<U extends ReactNode>(userSpecifiedKey: U, fallbackKey: MessageDictionaryKeys<Dict>, values?: Record<string, any>):
		| U
		| string
}
