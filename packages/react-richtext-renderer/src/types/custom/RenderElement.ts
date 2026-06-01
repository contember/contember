import { RichTextElement } from '../structure/RichTextElement.js'
import { RichTextLeaf } from '../structure/RichTextLeaf.js'
import { RichTextReference } from '../RichTextReference.js'
import { BuiltinElements } from '../builtin/BuiltinElements.js'
import { ComponentType, ReactElement } from 'react'
import { RichTextReferenceMetadata } from '../RichTextReferenceMetadata.js'
import { RichTextRenderingOptions } from '../RichTextRenderingOptions.js'
import { RichTextBlock } from '../RichTextBlock.js'
import { RenderChildren } from '../RenderChildren.js'

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
