import { Editor as SlateEditor, Node as SlateNode, Path, Text as SlateText } from 'slate'
import type { TextSpecifics } from '../../baseEditor'

export const hasMarks = <T extends SlateText, E extends SlateEditor>(
	editor: E,
	marks: TextSpecifics<T>,
	options: {
		from?: Path
		to?: Path
	} = {},
) => {
	const from = options.from ?? editor.selection?.anchor.path
	const to = options.to ?? editor.selection?.focus.path

	if (!from && !to) {
		return false
	}

	for (const [text] of SlateNode.texts(editor, {
		from,
		to,
	})) {
		for (const markName in marks) {
			if (!(markName in text) || text[markName] !== (marks as any)[markName]) {
				return false
			}
		}
	}
	return true
}
