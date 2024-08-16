import type { EditorWithBlocks } from './EditorWithBlocks'
import { CreateElementReferences } from '../references'

export interface OverrideCreateElementReferenceOptions {
	createElementReferences: CreateElementReferences
}

export const overrideCreateElementReference = <E extends EditorWithBlocks>(
	editor: E,
	options: OverrideCreateElementReferenceOptions,
) => {
	const {
		createElementReferences,
	} = options
	editor.createElementReference = (targetPath, referenceDiscriminant, initialize) => {
		return createElementReferences(editor, targetPath, referenceDiscriminant, initialize)
	}
}
