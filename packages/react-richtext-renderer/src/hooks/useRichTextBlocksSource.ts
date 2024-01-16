import { RichTextBlock, RichTextBlockSource, RichTextElement, RichTextLeaf, RichTextReference, RootEditorNode } from '../types'
import { defaultDeserialize } from '../internal/defaultDeserialize'
import { useMemo } from 'react'
import { RichTextRendererError } from '../RichTextRendererError'

export const useRichTextBlocksSource = <CustomElements extends RichTextElement, CustomLeaves extends RichTextLeaf>({
	deserialize = defaultDeserialize,
	blocks,
	referencesField,
	sourceField,
	referenceDiscriminationField,
}: RichTextBlockSource<CustomElements, CustomLeaves>) => {
	return useMemo((): RichTextBlock<CustomElements, CustomLeaves>[] => {
		const sourceFieldResolved = sourceField ?? 'source'
		const referencesFieldResolved = referencesField ?? 'references'
		const referenceDiscriminationFieldResolved = referenceDiscriminationField ?? 'type'

		return blocks.map(block => {
			if (!(sourceFieldResolved in block)) {
				throw new RichTextRendererError(
					`Found a block without a '${sourceFieldResolved}' field. ` +
					(sourceField === undefined
						? `The 'sourceField' prop has not been supplied, and so '${sourceFieldResolved}' was used as a default.`
						: `That is what the 'sourceField' prop has been set to, and so either this is a typo, ` +
						`or the data supplied is invalid.`),
				)
			}
			const source = block[sourceFieldResolved]
			if (typeof source !== 'string' && (typeof source !== 'object' || source === null)) {
				throw new RichTextRendererError(`Found a block whose source is not a string or an object.`)
			}

			if (referencesField !== undefined && !(referencesFieldResolved in block)) {
				throw new RichTextRendererError(
					`The 'referencesField' prop is set to '${referencesFieldResolved}' but a block without such field ` +
					`has been encountered. Unless this is just a typo, ` +
					`if you do not wish to use references, avoid supplying the 'referencesField' prop.`,
				)
			}
			const references = block[referencesFieldResolved]

			let normalizedReferences: Record<string, RichTextReference> | undefined = undefined
			if (references) {
				if (typeof Object(references)[Symbol.iterator] !== 'function') {
					throw new RichTextRendererError(`The set of references must be an iterable!`)
				}

				normalizedReferences = Object.fromEntries(Array.from(references as Iterable<RichTextReference>).map(reference => {
					if (!('id' in reference)) {
						throw new RichTextRendererError(`Found a reference without an id field.`)
					}
					if (!(referenceDiscriminationFieldResolved in reference) || typeof reference[referenceDiscriminationFieldResolved] !== 'string') {
						throw new RichTextRendererError(
							`Found a reference without a '${referenceDiscriminationFieldResolved}' field. ` +
							(referenceDiscriminationField === undefined
								? `The 'referenceDiscriminationField' prop has not been supplied, ` +
								`and so '${referenceDiscriminationFieldResolved}' was used as a default.`
								: `That is what the 'referenceDiscriminationField' prop has been set to, ` +
								`and so either this is a typo, or the data supplied is invalid.`),
						)
					}
					return [reference.id, {
						...reference,
						type: reference[referenceDiscriminationFieldResolved] as string,
					}]
				}))
			}
			return {
				id: typeof block.id === 'string' ? block.id : undefined,
				content: typeof source === 'string' ? deserialize(source) : source as RootEditorNode<CustomElements, CustomLeaves>,
				references: normalizedReferences,
			}
		})
	}, [blocks, deserialize, referenceDiscriminationField, referencesField, sourceField])
}
