import { EntityAccessor } from '@contember/binding'
import { Editor, Node as SlateNode, Point, Range as SlateRange, Transforms } from 'slate'
import { isContemberBlockElement } from '../elements'
import { BlockSlateEditor } from './BlockSlateEditor'

export interface OverrideInsertBreakOptions {
	batchUpdates: EntityAccessor['batchUpdates']
}

export const overrideInsertBreak = <E extends BlockSlateEditor>(editor: E, options: OverrideInsertBreakOptions) => {
	const { insertBreak } = editor

	editor.insertBreak = () => {
		options.batchUpdates(() => {
			insertBreak()
			//const selection = editor.selection
			//if (!selection || SlateRange.isExpanded(selection)) {
			//	return insertBreak()
			//}
			//const [topLevelIndex] = selection.focus.path
			//const topLevelNode = editor.children[topLevelIndex]
		})
	}
}
