import {
	Editor,
	Element as SlateElement,
	Location,
	Node as SlateNode,
	NodeEntry,
	Path as SlatePath,
	Point,
	Range as SlateRange,
	Text,
	Transforms,
} from 'slate'
import { BlockSlateEditor } from './BlockSlateEditor'

export interface OverridePrepareElementForInsertionOptions {}

export const overridePrepareElementForInsertion = <E extends BlockSlateEditor>(editor: E) => {
	// No need to call the implementation underneath. By default, it just throws anyway.
	// const { prepareElementForInsertion } = editor

	editor.prepareElementForInsertion = node => {
		const selection = editor.selection

		let targetLocation: Location

		if (selection) {
			targetLocation = selection
		} else if (editor.children.length) {
			targetLocation = Editor.end(editor, [])
		} else {
			targetLocation = { path: [], offset: 0 }
		}

		if (SlateRange.isRange(targetLocation)) {
			if (SlateRange.isExpanded(targetLocation)) {
				const [, end] = SlateRange.edges(targetLocation)
				const pointRef = Editor.pointRef(editor, end)
				Transforms.delete(editor, { at: targetLocation })
				targetLocation = pointRef.unref()!
			} else {
				targetLocation = targetLocation.focus
			}
		}

		const targetPoint = targetLocation

		// TODO maybe introduce some sort of a systemic handling for top-level-only elements like this.
		if (!editor.isReferenceElement(node)) {
			if (targetPoint.offset === 0) {
				return targetPoint.path
			}
			Transforms.splitNodes(editor, {
				at: targetPoint,
			})
			return SlatePath.next(targetPoint.path)
		}

		const [topLevelIndex] = targetPoint.path

		if (SlateNode.string(editor.children[topLevelIndex]) === '') {
			// The current element is empty so we replace remove it and insert the new one in its place.
			Transforms.removeNodes(editor, {
				at: [topLevelIndex],
			})
			return [topLevelIndex]
			// Transforms.insertNodes(editor, node, {
			// 	at: [topLevelIndex],
			// })
		} else {
			const [start, end] = Editor.edges(editor, [topLevelIndex])

			if (Point.equals(start, targetPoint)) {
				// We're at the beginning of a block so we insert above it

				// Transforms.insertNodes(editor, node, {
				// 	at: [topLevelIndex],
				// })
				return [topLevelIndex]
			} else if (Point.equals(end, targetPoint)) {
				// We're at the end of a block so we insert underneath it.

				// Transforms.insertNodes(editor, node, {
				// 	at: [topLevelIndex + 1],
				// })
				return [topLevelIndex + 1]
			} else {
				// We're in the middle so we split it and then insert between the two resulting chunks.
				Transforms.splitNodes(editor, {
					at: targetPoint,
				})
				// Transforms.insertNodes(editor, node, {
				// 	at: [topLevelIndex + 1],
				// })
				return [topLevelIndex + 1]
			}
		}
	}
}
