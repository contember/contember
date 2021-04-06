import { Editor, Location, NodeEntry, Text } from 'slate'
import { BaseEditor, EditorNode, ElementNode } from '../../baseEditor'

export const closest = <E extends BaseEditor>(
	editor: E,
	options: {
		at?: Location
		match: (node: ElementNode | EditorNode) => boolean
	},
): NodeEntry<ElementNode | EditorNode> | undefined => {
	for (const entry of Editor.levels<ElementNode | EditorNode>(editor, {
		at: options.at,
		match: node => !Text.isText(node) && options.match(node),
		reverse: true,
	})) {
		return entry
	}
	return undefined
}
