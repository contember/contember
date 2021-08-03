import type { ReferenceRenderer } from './ReferenceRenderer'
import type { RichTextElement } from './RichTextElement'
import type { RichTextLeaf } from './RichTextLeaf'
import type { RichTextReference } from './RichTextReference'

export interface RichTextRenderMetadata<
	CustomElements extends RichTextElement = never,
	CustomLeaves extends RichTextLeaf = never,
	Reference extends RichTextReference = RichTextReference,
> {
	formatVersion: number
	referenceRenderers: Record<string, ReferenceRenderer<Reference, CustomElements, CustomLeaves>>
	references: Map<string, RichTextReference> | undefined
	referencesField: string | undefined
	referenceDiscriminationField: string | undefined
}
