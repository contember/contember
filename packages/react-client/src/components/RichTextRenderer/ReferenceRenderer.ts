import { ReactElement, ReactNode } from 'react'
import { BuiltinElements } from './BuiltinElements'
import { RichTextElement } from './RichTextElement'
import { RichTextElementMetadata } from './RichTextElementMetadata'
import { RichTextLeaf } from './RichTextLeaf'
import { RichTextReference } from './RichTextReference'

export type ReferenceRendererProps<
	Reference extends RichTextReference = RichTextReference,
	CustomElements extends RichTextElement = never,
	CustomLeaves extends RichTextLeaf = never
> = {
	element: CustomElements | BuiltinElements<CustomElements, CustomLeaves>
	children: ReactElement
} & RichTextElementMetadata<CustomElements, CustomLeaves, Reference>

export type ReferenceRenderer<
	Reference extends RichTextReference = RichTextReference,
	CustomElements extends RichTextElement = never,
	CustomLeaves extends RichTextLeaf = never
> = (props: ReferenceRendererProps<Reference, CustomElements, CustomLeaves>) => ReactNode
