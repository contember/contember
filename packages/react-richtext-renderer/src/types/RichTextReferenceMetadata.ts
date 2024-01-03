import type { RichTextElement, RichTextLeaf } from './structure'
import type { RichTextReference } from './RichTextReference'
import { ReferenceRenderer } from './custom'

export type RichTextReferenceMetadata<
	CustomElements extends RichTextElement = never,
	CustomLeaves extends RichTextLeaf = RichTextLeaf,
	Reference extends RichTextReference = RichTextReference,
> =
	| RichTextReferenceFilledMetadata<CustomElements, CustomLeaves, Reference>
	| RichTextReferenceEmptyMetadata

export interface RichTextReferenceFilledMetadata<
	CustomElements extends RichTextElement = never,
	CustomLeaves extends RichTextLeaf = RichTextLeaf,
	Reference extends RichTextReference = RichTextReference,
> {
	reference: Reference
	referenceType: string
	referenceRenderer?: ReferenceRenderer<Reference, CustomElements, CustomLeaves>
}

export interface RichTextReferenceEmptyMetadata {
	reference: undefined
	referenceType: undefined
	referenceRenderer: undefined
}
