import { EntityAccessor, FieldValue, RelativeSingleField } from '@contember/binding'
import { Editor, Transforms } from 'slate'
import { ElementNode } from '../../baseEditor'
import { BlockSlateEditor } from './BlockSlateEditor'

export interface OverrideInsertElementWithReferenceOptions {
	referenceDiscriminationField: RelativeSingleField | undefined
}

export const overrideInsertElementWithReference = <E extends BlockSlateEditor>(
	editor: E,
	options: OverrideInsertElementWithReferenceOptions,
) => {
	const { referenceDiscriminationField } = options
	if (referenceDiscriminationField === undefined) {
		return
	}
	editor.insertElementWithReference = <Element extends ElementNode>(
		element: Omit<Element, 'referenceId'>,
		referenceDiscriminant: FieldValue,
		initialize?: EntityAccessor.BatchUpdatesHandler,
	) => {
		Editor.withoutNormalizing(editor, () => {
			const preppedPath = editor.prepareElementForInsertion(element)
			const referenceId = editor.createElementReference(preppedPath, referenceDiscriminant, initialize)
			Transforms.insertNodes(editor, { ...element, referenceId }, { at: preppedPath })
		})
	}
}
