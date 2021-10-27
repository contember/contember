import { Editor, Node as SlateNode, Range as SlateRange } from 'slate'
import type { BlockSlateEditor } from './BlockSlateEditor'

export interface OverrideInsertBreakOptions {}

export const overrideInsertBreak = <E extends BlockSlateEditor>(editor: E, options: OverrideInsertBreakOptions) => {
	const { insertBreak } = editor

	editor.insertBreak = () => {
		if (!editor.selection || !SlateRange.isCollapsed(editor.selection)) {
			return insertBreak()
		}

		for (const [node] of SlateNode.levels(editor, editor.selection.focus.path, { reverse: true })) {
			if ('referenceId' in node) {
				return // No splitting of references. We'd have to clone the reference and we don't know how to do that yet.
			}
			if (Editor.isBlock(editor, node)) {
				break
			}
		}
		return insertBreak()
	}
}
