import { BaseEditor, WithAnotherNodeType } from '../essentials'
import { RichTextBooleanMarkNames, RichTextNode } from './RichTextNode'

export interface WithBasicFormatting<E extends WithAnotherNodeType<BaseEditor, RichTextNode>> {
	isBold: (editor: E) => boolean
	isCode: (editor: E) => boolean
	isItalic: (editor: E) => boolean
	isStruckThrough: (editor: E) => boolean
	isUnderlined: (editor: E) => boolean

	isRichTextNodeMarkActive: (editor: E, mark: RichTextBooleanMarkNames) => boolean
}

export type EditorWithBasicFormatting<E extends BaseEditor> = WithAnotherNodeType<E, RichTextNode> &
	WithBasicFormatting<WithAnotherNodeType<E, RichTextNode>>
