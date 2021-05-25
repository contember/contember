import { Editor, Element as SlateElement, Node as SlateNode, Range as SlateRange } from 'slate'
import type { UnderlyingEditor } from '../Node'

export const overrideDeleteBackward = <E extends UnderlyingEditor>(editor: E) => {
	const { deleteBackward } = editor

	editor.deleteBackward = unit => {
		const selection = editor.selection

		if (selection && SlateRange.isCollapsed(selection)) {
			const [node, nodePath] = Editor.node(editor, [selection.focus.path[0]])
			if (SlateElement.isElement(node) && SlateNode.string(node) === '') {
				const previous = Editor.previous(editor, {
					at: nodePath,
					voids: true,
				})

				if (previous) {
					const [previousNode] = previous
					if (SlateElement.isElement(previousNode) && editor.isVoid(previousNode)) {
						editor.apply({
							type: 'remove_node',
							path: nodePath,
							node,
						})
						return
					}
				}
			}
		}
		deleteBackward(unit)
	}
}
