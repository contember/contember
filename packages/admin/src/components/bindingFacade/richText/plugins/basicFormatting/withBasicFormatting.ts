import * as React from 'react'
import { Editor } from 'slate'
import { BaseEditor, WithAnotherNodeType } from '../essentials'
import { EditorWithBasicFormatting, WithBasicFormatting } from './EditorWithBasicFormatting'
import { hotKeys } from './hotKeys'
import { RichTextBooleanMarkNames, RichTextNode } from './RichTextNode'
import { RichTextNodeRenderer } from './RichTextNodeRenderer'

export const withBasicFormatting = <E extends BaseEditor>(editor: E): EditorWithBasicFormatting<E> => {
	const e: E & Partial<WithBasicFormatting<WithAnotherNodeType<E, RichTextNode>>> = editor

	const { onKeyDown } = editor

	const isRichTextNodeMarkActive = (e.isRichTextNodeMarkActive = (
		editor: WithAnotherNodeType<E, RichTextNode>,
		mark: RichTextBooleanMarkNames,
	) => {
		const marks = Editor.marks(editor)
		return marks ? !!marks[mark] : false
	})
	const toggleRichTextNodeMark = (e.toggleRichTextNodeMark = (
		editor: WithAnotherNodeType<E, RichTextNode>,
		mark: RichTextBooleanMarkNames,
	) => {
		const isActive = isRichTextNodeMarkActive(editor, mark)
		if (isActive) {
			Editor.removeMark(editor, mark)
			return false
		}
		Editor.addMark(editor, mark, true)
		return true
	})

	e.isBold = editor => isRichTextNodeMarkActive(editor, 'isBold')
	e.toggleBold = editor => toggleRichTextNodeMark(editor, 'isBold')

	e.isCode = editor => isRichTextNodeMarkActive(editor, 'isCode')
	e.toggleCode = editor => toggleRichTextNodeMark(editor, 'isCode')

	e.isItalic = editor => isRichTextNodeMarkActive(editor, 'isItalic')
	e.toggleItalic = editor => toggleRichTextNodeMark(editor, 'isItalic')

	e.isStruckThrough = editor => isRichTextNodeMarkActive(editor, 'isStruckThrough')
	e.toggleStruckThrough = editor => toggleRichTextNodeMark(editor, 'isStruckThrough')

	e.isUnderlined = editor => isRichTextNodeMarkActive(editor, 'isUnderlined')
	e.toggleUnderlined = editor => toggleRichTextNodeMark(editor, 'isUnderlined')

	e.renderLeaf = props => React.createElement(RichTextNodeRenderer, props)

	e.onKeyDown = event => {
		for (const mark in hotKeys) {
			if (hotKeys[mark as RichTextBooleanMarkNames](event.nativeEvent)) {
				toggleRichTextNodeMark(e as EditorWithBasicFormatting<E>, mark as RichTextBooleanMarkNames)
				event.preventDefault()
			}
		}
		onKeyDown(event)
	}

	return e as EditorWithBasicFormatting<E>
}
