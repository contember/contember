import * as React from 'react'
import { Editor } from 'slate'
import { BaseEditor, WithAnotherNodeType } from '../essentials'
import { EditorWithBasicFormatting, WithBasicFormatting } from './EditorWithBasicFormatting'
import { RichTextBooleanMarkNames, RichTextNode } from './RichTextNode'
import { RichTextNodeRenderer } from './RichTextNodeRenderer'

export const withBasicFormatting = <E extends BaseEditor>(editor: E): EditorWithBasicFormatting<E> => {
	const e: E & Partial<WithBasicFormatting<WithAnotherNodeType<E, RichTextNode>>> = editor

	const isRichTextNodeMarkActive = (e.isRichTextNodeMarkActive = (
		editor: WithAnotherNodeType<E, RichTextNode>,
		mark: RichTextBooleanMarkNames,
	) => {
		const marks = Editor.marks(editor)
		return marks ? !!marks[mark] : false
	})

	e.isBold = editor => isRichTextNodeMarkActive(editor, 'isBold')
	e.isCode = editor => isRichTextNodeMarkActive(editor, 'isCode')
	e.isItalic = editor => isRichTextNodeMarkActive(editor, 'isItalic')
	e.isStruckThrough = editor => isRichTextNodeMarkActive(editor, 'isStruckThrough')
	e.isUnderlined = editor => isRichTextNodeMarkActive(editor, 'isUnderlined')

	e.renderLeaf = props => React.createElement(RichTextNodeRenderer, props)

	return e as EditorWithBasicFormatting<E>
}
