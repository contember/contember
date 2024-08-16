import { Editor as SlateEditor, Editor, Element, Location, NodeEntry, Text } from 'slate'

export const closest = <E extends SlateEditor>(
	editor: E,
	options: {
		at?: Location
		match: (node: Editor | Element) => boolean
	},
): NodeEntry<Editor | Element> | undefined => {
	const entries = Editor.levels<Editor | Element>(editor, {
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
