import { Editor, Element as SlateElement, Point, Range as SlateRange, Transforms } from 'slate'
import { ContemberEditor } from '../../../ContemberEditor'
import { isParagraphElement, ParagraphElement, paragraphElementPlugin, paragraphElementType } from './ParagraphElement'
import { paragraphHtmlDeserializer } from './ParagraphHtmlDeserializer'

export const withParagraphs = <E extends Editor>(editor: E): E => {
	const {
		canToggleElement,
		deleteBackward,
	} = editor

	editor.registerElement(paragraphElementPlugin)


	editor.canToggleElement = (elementType, suchThat) => {
		// This only allows numbered paragraphs at the top level.
		// TODO this is pretty bad but in order to fix this, we'd also have to fix toggleElement and there's no time now.

		if (elementType !== paragraphElementType || suchThat === undefined) {
			return canToggleElement(elementType, suchThat)
		}
		const isNumbered = suchThat.isNumbered

		if (isNumbered !== true) {
			return canToggleElement(elementType, suchThat)
		}

		if (!editor.selection) {
			return false
		}
		const closestBlockEntry = ContemberEditor.closestBlockEntry(editor)
		if (closestBlockEntry === undefined) {
			return true
		}
		const [closestBlockElement, closestBlockPath] = closestBlockEntry

		return closestBlockPath.length === 1 &&  SlateElement.isElement(closestBlockElement) && closestBlockElement.type === paragraphElementType
	}

	editor.deleteBackward = unit => {
		const selection = editor.selection
		if (unit !== 'character' || !selection || !SlateRange.isCollapsed(selection) || selection.focus.offset !== 0) {
			return deleteBackward(unit)
		}
		// The offset being zero doesn't necessarily imply that selection refers to the start of a paragraph.
		// It's just a way to early-exit.

		const closestNumberedEntry = Editor.above<ParagraphElement>(editor, {
			match: node => SlateElement.isElement(node) && isParagraphElement(node, { isNumbered: true }),
		})
		if (closestNumberedEntry === undefined) {
			return deleteBackward(unit)
		}
		const [, paragraphPath] = closestNumberedEntry
		const paragraphStartPoint = Editor.start(editor, paragraphPath)

		if (!Point.equals(paragraphStartPoint, selection.focus)) {
			return deleteBackward(unit)
		}
		Transforms.setNodes(
			editor,
			{ isNumbered: null }, // null removes the key altogether
			{ at: paragraphPath },
		)
	}
	editor.htmlDeserializer.registerPlugin(paragraphHtmlDeserializer)

	return editor
}
