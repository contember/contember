import { Editor as SlateEditor, Editor, Location, Element } from 'slate'
import { closest } from './closest'

export const closestBlockEntry = <E extends SlateEditor>(
	editor: E,
	options?: {
		at?: Location
		match?: (node: Element) => boolean
	},
) =>
	closest(editor, {
		at: options?.at,
		match: node => Editor.isBlock(editor, node) && (options?.match ? options.match(node) : true),
	})
