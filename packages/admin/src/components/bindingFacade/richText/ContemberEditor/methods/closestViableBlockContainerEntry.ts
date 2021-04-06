import { Editor, Location as SlateLocation, NodeEntry, Text } from 'slate'
import { BaseEditor, EditorNode, ElementNode } from '../../baseEditor'

export const closestViableBlockContainerEntry = <E extends BaseEditor>(
	editor: E,
	at?: SlateLocation,
): NodeEntry<ElementNode | EditorNode> | undefined => {
	for (const [node, path] of Editor.levels(editor, {
		at,
		match: node => !Text.isText(node) && editor.canContainAnyBlocks(node),
		reverse: true,
	})) {
		if (!Text.isText(node)) {
			return [node, path]
		}
	}

	return undefined
}
