export interface MessageDictionaryByLocaleCode {
	[localeCode: string]: MessageDictionary
}

export type MessageDictionary = {
	[Key in string]: MessageDictionary | string
}

export type PartialDictionary<Dict extends MessageDictionary> = {
	[Key in keyof Dict]?: Dict[Key] extends MessageDictionary ? PartialDictionary<Dict[Key]> : Dict[Key]
}

export type MessageDictionaryKeys<Dict extends MessageDictionary> = {
	[Key in keyof Dict & string]: Dict[Key] extends MessageDictionary ? `${Key}.${MessageDictionaryKeys<Dict[Key]>}` : Key
}[keyof Dict & string]
