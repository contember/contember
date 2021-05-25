import type { ReactElement, ReactNode } from 'react'
import type { BuiltinElements } from './BuiltinElements'
import type { RichTextElement } from './RichTextElement'
import type { RichTextElementMetadata } from './RichTextElementMetadata'
import type { RichTextLeaf } from './RichTextLeaf'
import type { RichTextReference } from './RichTextReference'

export type ReferenceRendererProps<
	Reference extends RichTextReference = RichTextReference,
	CustomElements extends RichTextElement = never,
	CustomLeaves extends RichTextLeaf = never
> = {
	element: CustomElements | BuiltinElements<CustomElements, CustomLeaves>
	children: ReactElement
} & {
	[Prop in keyof RichTextElementMetadata<CustomElements, CustomLeaves, Reference>]: Exclude<
		RichTextElementMetadata<CustomElements, CustomLeaves, Reference>[Prop],
		undefined
	>
}

export type ReferenceRenderer<
	Reference extends RichTextReference = RichTextReference,
	CustomElements extends RichTextElement = never,
	CustomLeaves extends RichTextLeaf = never
> = (props: ReferenceRendererProps<Reference, CustomElements, CustomLeaves>) => ReactNode
