import { Editor, Location, NodeEntry, Text } from 'slate'
import type { BaseEditor, EditorNode, ElementNode } from '../../baseEditor'

export const closest = <E extends BaseEditor>(
	editor: E,
	options: {
		at?: Location
		match: (node: ElementNode | EditorNode) => boolean
	},
): NodeEntry<ElementNode | EditorNode> | undefined => {
	const entries = Editor.levels<ElementNode | EditorNode>(editor, {
		at: options.at,
		match: node => {
			return !Text.isText(node) && options.match(node)
		},
		reverse: true,
	})
	for (const entry of entries) {
		return entry
	}
	return undefined
}
