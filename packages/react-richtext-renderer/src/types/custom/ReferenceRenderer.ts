import type { ComponentType, ReactElement } from 'react'
import type { BuiltinElements } from '../builtin/index.js'
import type { RichTextElement, RichTextLeaf } from '../structure/index.js'
import { RichTextReferenceFilledMetadata } from '../RichTextReferenceMetadata.js'
import type { RichTextReference } from '../RichTextReference.js'
import { RichTextBlock } from '../RichTextBlock.js'
import { RichTextRenderingOptions } from '../RichTextRenderingOptions.js'

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
