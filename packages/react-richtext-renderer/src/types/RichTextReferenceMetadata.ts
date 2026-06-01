import type { RichTextElement, RichTextLeaf } from './structure/index.js'
import type { RichTextReference } from './RichTextReference.js'
import { ReferenceRenderer } from './custom/index.js'

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
