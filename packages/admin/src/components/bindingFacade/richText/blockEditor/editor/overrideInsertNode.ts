import { Range as SlateRange, Transforms } from 'slate'
import { isContemberBlockElement } from '../elements'
import { BlockSlateEditor } from './BlockSlateEditor'

export const overrideInsertNode = <E extends BlockSlateEditor>(editor: E) => {
	const { insertNode } = editor

	editor.insertNode = node => {
		if (!isContemberBlockElement(node)) {
			return insertNode(node)
		}

		const selection = editor.selection

		if (!selection || SlateRange.isExpanded(selection)) {
			return
		}
		const [topLevelIndex] = selection.focus.path
		Transforms.insertNodes(editor, node, {
			at: [topLevelIndex + 1],
		})
	}
}
