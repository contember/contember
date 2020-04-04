import { BaseEditor, WithAnotherNodeType } from '../../essentials'
import { BasicFormatting } from './BasicFormatting'
import { RichTextBooleanMarkNames, RichTextNode } from './RichTextNode'

export interface WithBasicFormatting<E extends WithAnotherNodeType<BaseEditor, RichTextNode>> {
	enabledFormatting: BasicFormatting[]

	isBold: (editor: E) => boolean
	toggleBold: (editor: E) => boolean
	canSetBold: (editor: E) => boolean

	isCode: (editor: E) => boolean
	toggleCode: (editor: E) => boolean
	canSetCode: (editor: E) => boolean

	isItalic: (editor: E) => boolean
	toggleItalic: (editor: E) => boolean
	canSetItalic: (editor: E) => boolean

	isStruckThrough: (editor: E) => boolean
	toggleStruckThrough: (editor: E) => boolean
	canSetStruckThrough: (editor: E) => boolean

	isUnderlined: (editor: E) => boolean
	toggleUnderlined: (editor: E) => boolean
	canSetUnderlined: (editor: E) => boolean

	isRichTextNodeMarkActive: (editor: E, mark: RichTextBooleanMarkNames) => boolean
	toggleRichTextNodeMark: (editor: E, mark: RichTextBooleanMarkNames) => boolean
	canSetRichTextNodeMark: (editor: E, mark: RichTextBooleanMarkNames) => boolean
}

export type EditorWithBasicFormatting<E extends BaseEditor> = WithAnotherNodeType<E, RichTextNode> &
	WithBasicFormatting<WithAnotherNodeType<E, RichTextNode>>
