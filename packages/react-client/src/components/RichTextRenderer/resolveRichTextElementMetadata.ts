import { BuiltinElements } from './BuiltinElements'
import { ReferenceRenderer } from './ReferenceRenderer'
import { RichTextElement } from './RichTextElement'
import { RichTextElementMetadata } from './RichTextElementMetadata'
import { RichTextLeaf } from './RichTextLeaf'
import { RichTextReference } from './RichTextReference'
import { RichTextRendererError } from './RichTextRendererError'
import { RichTextRenderMetadata } from './RichTextRenderMetadata'

export const resolveRichTextElementMetadata = <
	CustomElements extends RichTextElement = never,
	CustomLeaves extends RichTextLeaf = never,
	Reference extends RichTextReference = RichTextReference
>(
	element: CustomElements | BuiltinElements<CustomElements, CustomLeaves>,
	metadata: RichTextRenderMetadata<CustomElements, CustomLeaves, Reference>,
): RichTextElementMetadata<CustomElements, CustomLeaves, Reference> => {
	let reference: Reference | undefined = undefined

	if ('referenceId' in element && typeof element['referenceId'] === 'string') {
		const resolved = metadata.references?.get(element['referenceId'])

		if (resolved === undefined) {
			throw new RichTextRendererError(
				`Cannot find reference id '${element['referenceId']}'` +
					(metadata.references === undefined
						? ` because its containing block's lacks the '${metadata.referencesField}' field. `
						: `.`),
			)
		}
		reference = resolved as Reference
	}

	let referenceRenderer: ReferenceRenderer<Reference, CustomElements, CustomLeaves> | undefined = undefined
	let referenceType: string | undefined = undefined

	if (reference && metadata.referenceDiscriminationField) {
		referenceType = (reference as Reference & Record<typeof metadata.referenceDiscriminationField, string>)[
			metadata.referenceDiscriminationField
		]
		referenceRenderer = metadata.referenceRenderers[referenceType]
	}

	return {
		formatVersion: metadata.formatVersion,
		reference,
		referenceType,
		referenceRenderer,
	}
}
