import type { EditorWithBlocks } from './EditorWithBlocks'
import { isInReferenceElement } from '../utils'

export interface OverrideInsertBreakOptions {}

export const overrideInsertBreak = <E extends EditorWithBlocks>(editor: E, options: OverrideInsertBreakOptions) => {
	const { insertBreak } = editor

	editor.insertBreak = () => {
		if (isInReferenceElement(editor)) {
			return
		}
		return insertBreak()
	}
}
