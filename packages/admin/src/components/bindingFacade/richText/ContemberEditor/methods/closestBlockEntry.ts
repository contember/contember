import { Editor, Location } from 'slate'
import { BaseEditor, ElementNode } from '../../baseEditor'

export const closestBlockEntry = <E extends BaseEditor>(
	editor: E,
	options?: {
		at?: Location
		match?: (node: ElementNode) => boolean
	},
) => {
	return Editor.above(editor, {
		at: options?.at,
		match: node => Editor.isBlock(editor, node) && (options?.match ? options.match(node) : true),
	})
}
