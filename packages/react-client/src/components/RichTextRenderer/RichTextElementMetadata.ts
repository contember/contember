import type { ReferenceRenderer } from './ReferenceRenderer'
import type { RichTextElement } from './RichTextElement'
import type { RichTextLeaf } from './RichTextLeaf'
import type { RichTextReference } from './RichTextReference'

export interface RichTextElementMetadata<
	CustomElements extends RichTextElement = never,
	CustomLeaves extends RichTextLeaf = never,
	Reference extends RichTextReference = RichTextReference
> {
	formatVersion: number
	reference: Reference | undefined
	referenceType: string | undefined
	referenceRenderer: ReferenceRenderer<Reference, CustomElements, CustomLeaves> | undefined
}
