import { Editor, Location as SlateLocation, Node as SlateNode, NodeEntry } from 'slate'
import { BaseEditor } from '../plugins/essentials'

export const getClosestParent = <E extends BaseEditor>(
	editor: E,
	options: {
		at?: SlateLocation
		edge?: 'start' | 'end'
		match: (node: SlateNode) => boolean
	},
): NodeEntry | undefined => {
	const { at = editor.selection, match, edge } = options

	if (at === null) {
		return undefined
	}

	const path = Editor.path(editor, at, {
		edge,
	})
	const levels = SlateNode.levels(editor, path, {
		reverse: true,
	})

	for (const entry of levels) {
		if (match(entry[0])) {
			return entry
		}
	}
	return undefined
}
