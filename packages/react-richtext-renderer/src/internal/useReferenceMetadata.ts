import type { BuiltinElements } from '../types/builtin/BuiltinElements'
import type { RichTextElement } from '../types/structure/RichTextElement'
import type { RichTextReferenceMetadata } from '../types/RichTextReferenceMetadata'
import { RichTextReferenceEmptyMetadata } from '../types/RichTextReferenceMetadata'
import type { RichTextLeaf } from '../types/structure/RichTextLeaf'
import type { RichTextReference } from '../types/RichTextReference'
import { RichTextRendererError } from '../RichTextRendererError'
import { RichTextBlock } from '../types/RichTextBlock'
import { RichTextRenderingOptions } from '../types/RichTextRenderingOptions'
import { useMemo } from 'react'

const emptyReference: RichTextReferenceEmptyMetadata = {
	reference: undefined,
	referenceType: undefined,
	referenceRenderer: undefined,
}
export const useReferenceMetadata = <
	CustomElements extends RichTextElement = never,
	CustomLeaves extends RichTextLeaf = RichTextLeaf,
	Reference extends RichTextReference = RichTextReference,
>(
	element: CustomElements | BuiltinElements<CustomElements, CustomLeaves>,
	options: RichTextRenderingOptions<CustomElements, CustomLeaves, Reference>,
	block: RichTextBlock<CustomElements, CustomLeaves>,
	expectReference: boolean = false,
): RichTextReferenceMetadata<CustomElements, CustomLeaves, Reference> => {
	const undefinedReferenceHandler = options.undefinedReferenceHandler
	const referenceRenderers = options.referenceRenderers

	return useMemo(() => {
		const id = element['referenceId']

		if (typeof id !== 'string') {
			if (import.meta.env.DEV && expectReference) {
				throw new RichTextRendererError(
					`RichTextRenderer: Expected element to have a referenceId.`,
				)
			}
			return emptyReference
		}

		const reference: Reference | undefined = block.references?.[id] as Reference | undefined

		if (reference === undefined) {
			if (undefinedReferenceHandler) {
				return undefinedReferenceHandler(id) ?? emptyReference
			} else {
				throw new RichTextRendererError(
					`RichTextRenderer: Cannot find reference id '${id}'`,
				)
			}
		}

		const referenceRenderer = referenceRenderers?.[reference.type]

		return {
			reference,
			referenceType: reference.type,
			referenceRenderer,
		}
	}, [block.references, element, expectReference, referenceRenderers, undefinedReferenceHandler])
}
