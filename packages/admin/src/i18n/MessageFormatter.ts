import { ReactNode } from 'react'
import { MessageDictionary, MessageDictionaryKeys } from './MessageDictionary'

export interface MessageFormatter<Dict extends MessageDictionary> {
	(key: MessageDictionaryKeys<Dict>, values?: object): string
	<U extends ReactNode>(userSpecifiedKey: U, fallbackKey: MessageDictionaryKeys<Dict>, values?: Record<string, any>):
		| U
		| string
}
