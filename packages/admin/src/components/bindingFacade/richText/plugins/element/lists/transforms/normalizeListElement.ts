import { Editor, Element as SlateElement, Node as SlateNode, Path as SlatePath, Transforms } from 'slate'
import { listItemElementType } from '../ListItemElement'
import { ContemberEditor } from '../../../../ContemberEditor'

export const normalizeListElement = ({ editor, path }: { editor: Editor, path: SlatePath }) => {
	for (const [child, childPath] of SlateNode.children(editor, path)) {
		if (SlateElement.isElement(child)) {
			if (child.type !== listItemElementType) {
				ContemberEditor.ejectElement(editor, childPath)
				Transforms.setNodes(editor, { type: listItemElementType }, { at: childPath })
			}
		} else {
			// If a list contains non-element nodes, just remove it.
			return Transforms.removeNodes(editor, {
				at: path,
			})
		}
	}
	return true
}
