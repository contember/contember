import {
	BindingError,
	BindingOperations,
	EntityAccessor,
	EntityListAccessor,
	FieldValue,
	RelativeSingleField,
} from '@contember/binding'
import { BlockSlateEditor } from './BlockSlateEditor'

export interface OverrideCreateElementReferenceOptions {
	bindingOperations: BindingOperations
	createNewReference: EntityListAccessor.CreateNewEntity | undefined
	referenceDiscriminationField: RelativeSingleField | undefined
}

export const overrideCreateElementReference = <E extends BlockSlateEditor>(
	editor: E,
	options: OverrideCreateElementReferenceOptions,
) => {
	const { bindingOperations, createNewReference, referenceDiscriminationField } = options
	if (referenceDiscriminationField === undefined || createNewReference === undefined) {
		return
	}
	editor.createElementReference = (
		referenceDiscriminant: FieldValue,
		initialize?: EntityAccessor.BatchUpdatesHandler,
	) => {
		const invalidFallbackUuid = 'richEditorIsBroken'
		let referenceUuid = invalidFallbackUuid

		bindingOperations.batchDeferredUpdates(() => {
			createNewReference((getNewReference, bindingOperations) => {
				getNewReference().getField('id').asUuid.setToUuid()
				getNewReference().getField(referenceDiscriminationField).updateValue(referenceDiscriminant)

				referenceUuid = getNewReference().getField<string>('id').currentValue!

				initialize?.(getNewReference, bindingOperations)
			})
		})

		if (referenceUuid === invalidFallbackUuid) {
			throw new BindingError(``)
		}

		return referenceUuid
	}
}
