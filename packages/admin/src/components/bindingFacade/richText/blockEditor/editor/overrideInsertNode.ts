import { EntityAccessor } from '@contember/binding'
import { Editor, Node as SlateNode, Point, Range as SlateRange, Transforms } from 'slate'
import { BlockSlateEditor } from './BlockSlateEditor'

export interface OverrideInsertNodeOptions {
	batchUpdates: EntityAccessor['batchUpdates']
}

export const overrideInsertNode = <E extends BlockSlateEditor>(editor: E, options: OverrideInsertNodeOptions) => {
	const { insertNode } = editor

	editor.insertNode = node => {
		options.batchUpdates(() => {
			if (!editor.isContemberBlockElement(node)) {
				return insertNode(node)
			}

			const selection = editor.selection

			if (!selection || SlateRange.isExpanded(selection)) {
				return
			}

			const [topLevelIndex] = selection.focus.path
			Editor.withoutNormalizing(editor, () => {
				if (SlateNode.string(editor.children[topLevelIndex]) === '') {
					// The current element is empty so we replace remove it and insert the new one in its place.
					Transforms.removeNodes(editor, {
						at: [topLevelIndex],
					})
					Transforms.insertNodes(editor, node, {
						at: [topLevelIndex],
					})
				} else {
					const [start, end] = Editor.edges(editor, [topLevelIndex])

					if (Point.equals(start, selection.focus)) {
						// We're at the beginning of a block so we insert above it
						Transforms.insertNodes(editor, node, {
							at: [topLevelIndex],
						})
					} else if (Point.equals(end, selection.focus)) {
						// We're at the end of a block so we insert underneath it.
						Transforms.insertNodes(editor, node, {
							at: [topLevelIndex + 1],
						})
					} else {
						// We're in the middle so we split it and then insert between the two resulting chunks.
						Transforms.splitNodes(editor, {
							at: selection.focus,
						})
						Transforms.insertNodes(editor, node, {
							at: [topLevelIndex + 1],
						})
					}
				}
			})
		})
	}
}
