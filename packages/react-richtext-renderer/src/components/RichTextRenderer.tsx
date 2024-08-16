import { memo, ReactElement } from 'react'
import type { RichTextElement } from '../types/structure/RichTextElement'
import type { RichTextLeaf } from '../types/structure/RichTextLeaf'
import { RichTextFieldRenderer, RichTextFieldRendererProps } from './RichTextFieldRenderer'
import { RichTextBlocksRenderer, RichTextBlocksRendererProps } from './RichTextBlocksRenderer'


export type RichTextRendererProps<
	CustomElements extends RichTextElement = never,
	CustomLeaves extends RichTextLeaf = RichTextLeaf,
> =
	| RichTextFieldRendererProps<CustomElements, CustomLeaves>
	| RichTextBlocksRendererProps<CustomElements, CustomLeaves>

/**
 * @deprecated Use `RichTextBlocksRenderer` or `RichTextFieldRenderer` instead, or directly use `RichText`.
 * @group Content rendering
 */
export const RichTextRenderer = memo(function RichTextRenderer<
	CustomElements extends RichTextElement = never,
	CustomLeaves extends RichTextLeaf = RichTextLeaf,
>(props: RichTextRendererProps<CustomElements, CustomLeaves>) {

	if ('source' in props) {
		return <RichTextFieldRenderer<CustomElements, CustomLeaves> {...props} />
	}

	return <RichTextBlocksRenderer<CustomElements, CustomLeaves> {...props} />
}) as <CustomElements extends RichTextElement = never, CustomLeaves extends RichTextLeaf = RichTextLeaf>(
	props: RichTextRendererProps<CustomElements, CustomLeaves>,
) => ReactElement
