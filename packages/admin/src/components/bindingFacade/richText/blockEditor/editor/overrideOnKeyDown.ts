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

export interface OverrideOnKeyDownOptions {}

export const overrideOnKeyDown = <E extends BlockSlateEditor>(editor: E, options: OverrideOnKeyDownOptions) => {
	const { onKeyDown } = editor

	editor.onKeyDown = event => {
		if (event.key !== 'Tab' || !editor.selection || !SlateRange.isCollapsed(editor.selection)) {
			return onKeyDown(event)
		}
		const closestBlockEntry = ContemberEditor.closestBlockEntry(editor, editor.selection)

		if (closestBlockEntry === undefined) {
			return onKeyDown(event)
		}
		const [fieldBackedElement, path] = closestBlockEntry

		if (!editor.isContemberFieldElement(fieldBackedElement)) {
			return onKeyDown(event)
		}

		let targetPath: SlatePath
		if (event.shiftKey) {
			const lastIndex = path[path.length - 1]
			if (lastIndex === 0) {
				return onKeyDown(event)
			}
			targetPath = SlatePath.previous(path)
		} else {
			targetPath = SlatePath.next(path)
		}

		event.preventDefault()
		const targetEnd = Editor.end(editor, targetPath)
		return Transforms.select(editor, targetEnd)
	}
}
