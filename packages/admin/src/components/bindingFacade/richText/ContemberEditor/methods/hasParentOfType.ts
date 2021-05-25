import { Node as SlateNode, NodeEntry, Path as SlatePath } from 'slate'
import type { BaseEditor, ElementNode, ElementSpecifics } from '../../baseEditor'
import { ContemberEditor } from '../index'

export const hasParentOfType = <Editor extends BaseEditor, Element extends ElementNode>(
	editor: Editor,
	nodeEntry: NodeEntry<SlateNode | ElementNode>,
	type: Element['type'],
	suchThat?: ElementSpecifics<Element>,
): boolean => {
	const [, path] = nodeEntry
	if (path.length === 1) {
		return false // Doesn't have a parent
	}
	const parentPath = SlatePath.parent(path)
	const parent = SlateNode.get(editor, parentPath)

	return ContemberEditor.isElementType(parent, type, suchThat)
}
