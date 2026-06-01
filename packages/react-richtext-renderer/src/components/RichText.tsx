import { createElement } from 'react'
import { renderChildren } from '../internal/renderChildren.js'
import type { RichTextBlock } from '../types/index.js'
import { RichTextElement, RichTextLeaf, RichTextRenderingOptions } from '../types/index.js'

export type RichTextProps<
	CustomElements extends RichTextElement = never,
	CustomLeaves extends RichTextLeaf = RichTextLeaf,
> =
	& {
		blocks: RichTextBlock<CustomElements, CustomLeaves>[]
	}
	& RichTextRenderingOptions<CustomElements, CustomLeaves>

/**
 * Accepts normalized decoded RichText blocks and renders them using the provided renderers.
 * To use decoders, use `RichTextBlocksRenderer` or `RichTextFieldRenderer` instead.
 *
 * @group Content rendering
 */
export const RichText = <
	CustomElements extends RichTextElement = never,
	CustomLeaves extends RichTextLeaf = RichTextLeaf,
>({
	blocks,
	renderElement,
	renderLeaf,
	renderBlock = ({ children }) => <>{children}</>,
	attributeNamePrefix,
	referenceRenderers,
	undefinedReferenceHandler,
}: RichTextProps<CustomElements, CustomLeaves>) => {
	return (
		<>
			{blocks.map((block, i) => (
				createElement(
					renderBlock,
					{
						block,
						key: block.id ?? i,
					},
					renderChildren(block.content.children, {
						referenceRenderers,
						renderBlock,
						renderLeaf,
						renderElement,
						attributeNamePrefix,
						undefinedReferenceHandler,
					}, block),
				)
			))}
		</>
	)
}
