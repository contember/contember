import { EntityAccessor, EntityListAccessor, FieldValue, RelativeSingleField } from '@contember/binding'
import { ElementNode } from '../../baseEditor'
import { BlockSlateEditor } from './BlockSlateEditor'

export interface OverrideInsertElementWithReferenceOptions {
	createNewReference: EntityListAccessor.CreateNewEntity | undefined
	referenceDiscriminationField: RelativeSingleField | undefined
}

export const overrideInsertElementWithReference = <E extends BlockSlateEditor>(
	editor: E,
	options: OverrideInsertElementWithReferenceOptions,
) => {
	const { createNewReference, referenceDiscriminationField } = options
	if (referenceDiscriminationField === undefined || createNewReference === undefined) {
		return
	}
	editor.insertElementWithReference = <Element extends ElementNode>(
		element: Omit<Element, 'referenceId'>,
		referenceDiscriminant: FieldValue,
		initialize?: EntityAccessor.BatchUpdatesHandler,
	) => {
		editor.insertNode({
			...element,
			referenceId: editor.createElementReference(referenceDiscriminant, initialize),
		})
	}
}
