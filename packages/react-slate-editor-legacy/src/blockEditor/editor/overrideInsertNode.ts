import { Editor, Element as SlateElement, Transforms } from 'slate'
import type { EditorWithBlocks } from './EditorWithBlocks'
import { prepareElementForInsertion } from '../utils'

export const overrideInsertNode = <E extends EditorWithBlocks>(editor: E) => {
	const { insertNode } = editor

	editor.insertNode = node => {
		if (!SlateElement.isElement(node)) {
			return insertNode(node)
		}
		Editor.withoutNormalizing(editor, () => {
			const preppedPath = prepareElementForInsertion(editor, node)
			Transforms.insertNodes(editor, node, {
				at: preppedPath,
			})
		})
	}
}
