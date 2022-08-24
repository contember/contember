export interface MessageDictionaryByLocaleCode {
	[localeCode: string]: MessageDictionary
}

export interface MessageDictionary {
	[Key: string]: MessageDictionary | string
}

export type MessageDictionaryKeys<Dict extends MessageDictionary> = {
	[Key in keyof Dict & string]: Dict[Key] extends MessageDictionary ? `${Key}.${MessageDictionaryKeys2<Dict[Key]>}` : Key
}[keyof Dict & string]

export type MessageDictionaryKeys2<Dict extends MessageDictionary> = {
	[Key in keyof Dict & string]: Dict[Key] extends MessageDictionary ? `${Key}.${MessageDictionaryKeys3<Dict[Key]>}` : Key
}[keyof Dict & string]

export type MessageDictionaryKeys3<Dict extends MessageDictionary> = {
	[Key in keyof Dict & string]: Dict[Key] extends MessageDictionary ? `${Key}.${MessageDictionaryKeys4<Dict[Key]>}` : Key
}[keyof Dict & string]

export type MessageDictionaryKeys4<Dict extends MessageDictionary> = {
	[Key in keyof Dict & string]: Dict[Key] extends MessageDictionary ? `${Key}.${MessageDictionaryKeys5<Dict[Key]>}` : Key
}[keyof Dict & string]

export type MessageDictionaryKeys5<Dict extends MessageDictionary> = {
	[Key in keyof Dict & string]: Dict[Key] extends MessageDictionary ? string : Key
}[keyof Dict & string]
