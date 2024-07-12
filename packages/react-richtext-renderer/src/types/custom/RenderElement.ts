import { RichTextElement } from '../structure/RichTextElement'
import { RichTextLeaf } from '../structure/RichTextLeaf'
import { RichTextReference } from '../RichTextReference'
import { BuiltinElements } from '../builtin/BuiltinElements'
import { ComponentType, ReactElement } from 'react'
import { RichTextReferenceMetadata } from '../RichTextReferenceMetadata'
import { RichTextRenderingOptions } from '../RichTextRenderingOptions'
import { RichTextBlock } from '../RichTextBlock'
import { RenderChildren } from '../RenderChildren'

export type RenderElementProps<
	CustomElements extends RichTextElement = never,
	CustomLeaves extends RichTextLeaf = RichTextLeaf,
	Reference extends RichTextReference = RichTextReference,
> =
	& {
		formatVersion: number
		block: RichTextBlock<CustomElements, CustomLeaves>
		element: CustomElements | BuiltinElements<CustomElements, CustomLeaves>
		children: ReactElement
		options: RichTextRenderingOptions<CustomElements, CustomLeaves>
		fallback: ReactElement

		renderChildren: RenderChildren<CustomElements, CustomLeaves>

		/**
		 * @deprecated To access the rendering options, use options. No need to pass it to renderChildren function.
		 */
		renderChildrenOptions: RichTextRenderingOptions<CustomElements, CustomLeaves>
	}
	& RichTextReferenceMetadata<CustomElements, CustomLeaves, Reference>

export type RenderElement<
	CustomElements extends RichTextElement = never,
	CustomLeaves extends RichTextLeaf = RichTextLeaf,
	Reference extends RichTextReference = RichTextReference,
> = ComponentType<RenderElementProps<CustomElements, CustomLeaves, Reference>>
