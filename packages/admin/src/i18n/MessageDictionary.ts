export interface MessageDictionaryByLocaleCode {
	[localeCode: string]: MessageDictionary
}

export interface MessageDictionary {
	[Key: string]: MessageDictionary | string
}

export type MessageDictionaryKeys<Dict extends MessageDictionary> = {
	[Key in keyof Dict & string]: Dict[Key] extends MessageDictionary ? `${Key}.${MessageDictionaryKeys<Dict[Key]>}` : Key
}[keyof Dict & string]
