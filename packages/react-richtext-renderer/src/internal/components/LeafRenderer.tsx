import { createElement } from 'react'
import type { BuiltinLeaves } from '../../types/builtin/BuiltinLeaves'
import { RenderLeafFallback } from './RenderLeafFallback'
import type { RichTextLeaf } from '../../types/structure/RichTextLeaf'
import { RichTextElement } from '../../types/structure/RichTextElement'
import { RichTextRenderingOptions } from '../../types/RichTextRenderingOptions'
import { RichTextBlock } from '../../types/RichTextBlock'

export interface LeafRendererProps<CustomElements extends RichTextElement = never, CustomLeaves extends RichTextLeaf = RichTextLeaf> {
	options: RichTextRenderingOptions<CustomElements, CustomLeaves>
	block: RichTextBlock<CustomElements, CustomLeaves>
	leaf: CustomLeaves & BuiltinLeaves
}

export function LeafRenderer<
	CustomElements extends RichTextElement = never,
	CustomLeaves extends RichTextLeaf = RichTextLeaf,
>({
	leaf,
	options: { renderLeaf },
	block: { content: { formatVersion } },
}: LeafRendererProps<CustomElements, CustomLeaves>) {
	const fallback = <RenderLeafFallback leaf={leaf} />

	return renderLeaf
		? createElement(
			renderLeaf,
			{
				formatVersion,
				leaf,
				fallback,
				children: leaf.text,
			},
		  )
		: fallback
}
