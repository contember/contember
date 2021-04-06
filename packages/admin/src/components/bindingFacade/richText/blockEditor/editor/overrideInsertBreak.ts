import { Editor, Node as SlateNode, Path as SlatePath, Point, Range as SlateRange, Transforms } from 'slate'
import { ContemberEditor } from '../../ContemberEditor'
import { BlockSlateEditor } from './BlockSlateEditor'

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

		const closestBlockEntry = ContemberEditor.closestBlockEntry(editor)

		if (closestBlockEntry === undefined) {
			return insertBreak()
		}
		const [fieldBackedElement, path] = closestBlockEntry
		if (
			!editor.isContemberFieldElement(fieldBackedElement) ||
			!Point.equals(editor.selection.focus, Editor.end(editor, path))
		) {
			return insertBreak()
		}
		const nextSiblingPath = SlatePath.next(path)
		const nextSibling = SlateNode.get(editor, nextSiblingPath)

		if (!editor.isContemberFieldElement(nextSibling) && SlateNode.string(nextSibling) !== '') {
			return insertBreak()
		}

		const nextSiblingEnd = Editor.end(editor, nextSiblingPath)

		return Transforms.select(editor, nextSiblingEnd)
	}
}
