import type { ComponentType, ReactElement } from 'react'
import type { BuiltinElements } from '../builtin'
import type { RichTextElement, RichTextLeaf } from '../structure'
import { RichTextReferenceFilledMetadata } from '../RichTextReferenceMetadata'
import type { RichTextReference } from '../RichTextReference'
import { RichTextBlock } from '../RichTextBlock'
import { RichTextRenderingOptions } from '../RichTextRenderingOptions'

export type ReferenceRendererProps<
	Reference extends RichTextReference = RichTextReference,
	CustomElements extends RichTextElement = never,
	CustomLeaves extends RichTextLeaf = RichTextLeaf,
> =
	& {
		element: CustomElements | BuiltinElements<CustomElements, CustomLeaves>
		children: ReactElement
		formatVersion: number
		block: RichTextBlock<CustomElements, CustomLeaves>
		options: RichTextRenderingOptions<CustomElements, CustomLeaves>
	}
	& RichTextReferenceFilledMetadata<CustomElements, CustomLeaves, Reference>

export type ReferenceRenderer<
	Reference extends RichTextReference = RichTextReference,
	CustomElements extends RichTextElement = never,
	CustomLeaves extends RichTextLeaf = RichTextLeaf,
> = ComponentType<ReferenceRendererProps<Reference, CustomElements, CustomLeaves>>

export type ReferenceRendererMap<
	Reference extends RichTextReference = RichTextReference,
	CustomElements extends RichTextElement = never,
	CustomLeaves extends RichTextLeaf = RichTextLeaf,
> = Record<string, ReferenceRenderer<Reference, CustomElements, CustomLeaves>>
