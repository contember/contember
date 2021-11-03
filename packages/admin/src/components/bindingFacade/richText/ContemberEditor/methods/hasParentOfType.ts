import { Editor as SlateEditor, Element as SlateElement, Node as SlateNode, NodeEntry, Path as SlatePath } from 'slate'
import { ContemberEditor } from '../index'

export const hasParentOfType = <Editor extends SlateEditor, Element extends SlateElement>(
	editor: Editor,
	nodeEntry: NodeEntry<SlateNode | SlateElement>,
	type: Element['type'],
	suchThat?: Partial<Element>,
): boolean => {
	const [, path] = nodeEntry
	if (path.length === 1) {
		return false // Doesn't have a parent
	}
	const parentPath = SlatePath.parent(path)
	const parent = SlateNode.get(editor, parentPath)

	return ContemberEditor.isElementType(parent, type, suchThat)
}
