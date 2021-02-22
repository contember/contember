import { BindingError, EntityAccessor, RelativeSingleField } from '@contember/binding'
import { getDiscriminatedDatum } from '../../../discrimination'
import { ReferenceElement } from '../elements'
import { EditorReferenceBlocks } from '../templating'
import { BlockSlateEditor } from './BlockSlateEditor'

export interface OverrideIsVoidOptions {
	getReferencedEntity: (element: ReferenceElement) => EntityAccessor
	referenceDiscriminationField: RelativeSingleField | undefined
	editorReferenceBlocks: EditorReferenceBlocks
}

export const overrideIsVoid = <E extends BlockSlateEditor>(
	editor: E,
	{ editorReferenceBlocks, getReferencedEntity, referenceDiscriminationField }: OverrideIsVoidOptions,
) => {
	const { isVoid } = editor

	editor.isVoid = element => {
		if (editor.isReferenceElement(element)) {
			if (referenceDiscriminationField === undefined) {
				throw new BindingError()
			}
			const referencedEntity = getReferencedEntity(element)
			const discriminationField = referencedEntity.getRelativeSingleField(referenceDiscriminationField)
			const selectedReference = getDiscriminatedDatum(editorReferenceBlocks, discriminationField)?.datum

			if (selectedReference === undefined) {
				throw new BindingError()
			}

			return selectedReference.template === undefined
		}

		return isVoid(element)
	}
}
