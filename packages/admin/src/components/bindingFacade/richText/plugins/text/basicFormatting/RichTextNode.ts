import { TextNode } from '../../essentials'

export type RichTextBooleanMarkNames = {
	[M in keyof Required<RichTextNode>]: RichTextNode[M] extends boolean | undefined ? M : never
}[keyof RichTextNode]

export interface RichTextNode extends TextNode {
	text: string

	isBold?: boolean
	isCode?: boolean
	isItalic?: boolean
	isStruckThrough?: boolean
	isUnderlined?: boolean
}
