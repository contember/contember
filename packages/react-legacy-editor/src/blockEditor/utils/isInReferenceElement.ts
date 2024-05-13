import { Editor, Element as SlateElement, Node as SlateNode, Path } from 'slate'
import { isElementWithReference } from '../elements'

const isPathInReferenceElement = (editor: Editor, path: Path) => {
	for (const [node] of SlateNode.levels(editor, path, { reverse: true })) {
		if (isElementWithReference(node)) {
			return true
		}
		if (SlateElement.isElement(node) && Editor.isBlock(editor, node)) {
			break
		}
	}
	return false
}
export const isInReferenceElement = (editor: Editor) => {
	if (!editor.selection) {
		return false
	}
	return isPathInReferenceElement(editor, editor.selection.focus.path)
}
