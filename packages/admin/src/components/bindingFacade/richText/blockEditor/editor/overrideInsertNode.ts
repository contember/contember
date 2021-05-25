import { Editor, Element as SlateElement, Transforms } from 'slate'
import type { BlockSlateEditor } from './BlockSlateEditor'

export const overrideInsertNode = <E extends BlockSlateEditor>(editor: E) => {
	const { insertNode } = editor

	editor.insertNode = node => {
		if (!SlateElement.isElement(node)) {
			return insertNode(node)
		}
		Editor.withoutNormalizing(editor, () => {
			const preppedPath = editor.prepareElementForInsertion(node)
			Transforms.insertNodes(editor, node, {
				at: preppedPath,
			})
		})
	}
}
