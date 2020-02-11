import { RichTextBooleanMarkNames } from './RichTextNode'

export type BasicFormatting = RichTextBooleanMarkNames

export const defaultBasicFormatting: BasicFormatting[] = [
	'isBold',
	'isCode',
	'isItalic',
	'isStruckThrough',
	'isUnderlined',
]
