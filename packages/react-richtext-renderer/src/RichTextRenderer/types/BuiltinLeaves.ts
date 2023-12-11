import type { RichTextLeaf } from './RichTextLeaf'

export type BuiltinLeaves = RichTextBoldLeaf &
	RichTextCodeLeaf &
	RichTextHighlightLeaf &
	RichTextItalicLeaf &
	RichTextStrikeThroughLeaf &
	RichTextUnderlineLeaf

export interface RichTextBoldLeaf extends RichTextLeaf {
	isBold?: boolean
}

export interface RichTextCodeLeaf extends RichTextLeaf {
	isCode?: boolean
}

export interface RichTextHighlightLeaf extends RichTextLeaf {
	isHighlighted?: boolean
}

export interface RichTextItalicLeaf extends RichTextLeaf {
	isItalic?: boolean
}

export interface RichTextStrikeThroughLeaf extends RichTextLeaf {
	isStruckThrough?: boolean
}

export interface RichTextUnderlineLeaf extends RichTextLeaf {
	isUnderlined?: boolean
}
