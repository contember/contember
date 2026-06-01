import type { ReactElement } from 'react'
import { createElement } from 'react'
import type { BuiltinElements } from '../../types/builtin/BuiltinElements.js'
import { renderChildren } from '../renderChildren.js'
import { RenderElementFallback } from './RenderElementFallback.js'
import { useReferenceMetadata } from '../useReferenceMetadata.js'
import type { RichTextElement } from '../../types/structure/RichTextElement.js'
import type { RichTextLeaf } from '../../types/structure/RichTextLeaf.js'
import { RichTextBlock } from '../../types/RichTextBlock.js'
import { RichTextRenderingOptions } from '../../types/RichTextRenderingOptions.js'

export interface ElementRendererProps<
	CustomElements extends RichTextElement = never,
	CustomLeaves extends RichTextLeaf = RichTextLeaf,
> {
	element: CustomElements | BuiltinElements<CustomElements, CustomLeaves>
	children: ReactElement
	options: RichTextRenderingOptions<CustomElements, CustomLeaves>
	block: RichTextBlock<CustomElements, CustomLeaves>
}

export function ElementRenderer<
	CustomElements extends RichTextElement = never,
	CustomLeaves extends RichTextLeaf = RichTextLeaf,
>({ element, children, options, block }: ElementRendererProps<CustomElements, CustomLeaves>) {
	const referenceMetadata = useReferenceMetadata<CustomElements, CustomLeaves>(element, options, block)

	const fallback = (
		<RenderElementFallback<CustomElements, CustomLeaves>
			element={element as BuiltinElements<CustomElements, CustomLeaves>}
			options={options}
			block={block}
		>
			{children}
		</RenderElementFallback>
	)

	return options.renderElement
		? createElement(options.renderElement, {
			...referenceMetadata,
			formatVersion: block.content.formatVersion,
			block,
			options,
			element,
			fallback,
			children,
			renderChildren: (children, opts = options) => renderChildren(children, opts, block),
			renderChildrenOptions: options,
		})
		: fallback
}
