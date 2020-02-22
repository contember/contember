import { EntityAccessor } from '@contember/binding'
import { Editor, Node as SlateNode, Range as SlateRange, Transforms } from 'slate'
import { isContemberBlockElement } from '../elements'
import { BlockSlateEditor } from './BlockSlateEditor'

export interface OverrideInsertNodeOptions {
	batchUpdates: EntityAccessor['batchUpdates']
}

export const overrideInsertNode = <E extends BlockSlateEditor>(editor: E, options: OverrideInsertNodeOptions) => {
	const { insertNode } = editor

	editor.insertNode = node => {
		options.batchUpdates(() => {
			if (!isContemberBlockElement(node)) {
				return insertNode(node)
			}

			const selection = editor.selection

			if (!selection || SlateRange.isExpanded(selection)) {
				return
			}
			Editor.withoutNormalizing(editor, () => {
				let [topLevelIndex] = selection.focus.path

				if (SlateNode.string(editor.children[topLevelIndex]) === '') {
					Transforms.removeNodes(editor, {
						at: [topLevelIndex],
					})
				}
				Transforms.insertNodes(editor, node, {
					at: [topLevelIndex + 1],
				})
			})
		})
	}
}
