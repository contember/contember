import type { EditorWithBlocks } from './EditorWithBlocks.js'
import { InsertElementWithReference } from '../references/useInsertElementWithReference.js'

export interface OverrideInsertElementWithReferenceOptions {
	insertElementWithReference: InsertElementWithReference
}

export const overrideInsertElementWithReference = <E extends EditorWithBlocks>(
	editor: E,
	{ insertElementWithReference }: OverrideInsertElementWithReferenceOptions,
) => {
	editor.insertElementWithReference = insertElementWithReference
}
