import {
	Editor,
	Element as SlateElement,
	Node as SlateNode,
	NodeEntry,
	Path as SlatePath,
	Point,
	Range as SlateRange,
	Text,
	Transforms,
} from 'slate'
import { ContemberEditor } from '../../ContemberEditor'
import { BlockSlateEditor } from './BlockSlateEditor'

export interface OverrideInsertBreakOptions {}

export const overrideInsertBreak = <E extends BlockSlateEditor>(editor: E, options: OverrideInsertBreakOptions) => {
	const { insertBreak } = editor

	editor.insertBreak = () => {
		if (!editor.selection || !SlateRange.isCollapsed(editor.selection)) {
			return insertBreak()
		}
		const closestBlockEntry = ContemberEditor.closestBlockEntry(editor, editor.selection)

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
		const nextSibling = SlatePath.next(path)
		const nextSiblingEnd = Editor.end(editor, nextSibling)

		return Transforms.select(editor, nextSiblingEnd)
	}
}
