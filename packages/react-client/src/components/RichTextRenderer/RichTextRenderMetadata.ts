import { ReferenceRenderer } from './ReferenceRenderer'
import { RichTextElement } from './RichTextElement'
import { RichTextLeaf } from './RichTextLeaf'
import { RichTextReference } from './RichTextReference'

export interface RichTextRenderMetadata<
	CustomElements extends RichTextElement = never,
	CustomLeaves extends RichTextLeaf = never,
	Reference extends RichTextReference = RichTextReference
> {
	formatVersion: number
	referenceRenderers: Record<string, ReferenceRenderer<Reference, CustomElements, CustomLeaves>>
	references: Map<string, RichTextReference> | undefined
	referencesField: string | undefined
	referenceDiscriminationField: string | undefined
}
