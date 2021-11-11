import type { EditorWithBlocks } from './EditorWithBlocks'
import { InsertElementWithReference } from '../references/useInsertElementWithReference'

export interface OverrideInsertElementWithReferenceOptions {
	insertElementWithReference: InsertElementWithReference
}

export const overrideInsertElementWithReference = <E extends EditorWithBlocks>(
	editor: E,
	{ insertElementWithReference }: OverrideInsertElementWithReferenceOptions,
) => {
	editor.insertElementWithReference = insertElementWithReference
}
