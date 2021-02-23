import { BindingError, BindingOperations, RelativeSingleField } from '@contember/binding'
import { Editor } from 'slate'
import { BlockSlateEditor } from './BlockSlateEditor'

export interface OverrideCreateElementReferenceOptions {
	bindingOperations: BindingOperations
	referenceDiscriminationField: RelativeSingleField | undefined
}

export const overrideCreateElementReference = <E extends BlockSlateEditor>(
	editor: E,
	options: OverrideCreateElementReferenceOptions,
) => {
	const { bindingOperations, referenceDiscriminationField } = options
	if (referenceDiscriminationField === undefined) {
		return
	}
	editor.createElementReference = (targetPath, referenceDiscriminant, initialize) => {
		const invalidFallbackUuid = 'richEditorIsBroken'
		let referenceUuid = invalidFallbackUuid

		Editor.withoutNormalizing(editor, () => {
			bindingOperations.batchDeferredUpdates(() => {
				const [topLevelIndex] = targetPath

				editor.createReferencedEntity(topLevelIndex, (getNewReference, bindingOperations) => {
					getNewReference().getField('id').asUuid.setToUuid()
					getNewReference().getField(referenceDiscriminationField).updateValue(referenceDiscriminant)

					referenceUuid = getNewReference().getField<string>('id').value!

					initialize?.(getNewReference, bindingOperations)
				})
			})
		})

		if (referenceUuid === invalidFallbackUuid) {
			throw new BindingError()
		}

		return referenceUuid
	}
}
