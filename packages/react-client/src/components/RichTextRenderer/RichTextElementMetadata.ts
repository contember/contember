import { ReferenceRenderer } from './ReferenceRenderer'
import { RichTextElement } from './RichTextElement'
import { RichTextLeaf } from './RichTextLeaf'
import { RichTextReference } from './RichTextReference'

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
