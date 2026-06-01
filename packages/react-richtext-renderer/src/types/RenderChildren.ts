import { RichTextChild, RichTextElement, RichTextLeaf } from './structure/index.js'
import { RichTextRenderingOptions } from './RichTextRenderingOptions.js'
import { ReactElement } from 'react'

export type RenderChildren<
	CustomElements extends RichTextElement = never,
	CustomLeaves extends RichTextLeaf = RichTextLeaf,
> = (
	children:
		| RichTextChild<CustomElements, CustomLeaves>
		| readonly RichTextChild<CustomElements, CustomLeaves>[],
	/**
	 * @deprecated No need to pass this anymore.
	 */
	options?: RichTextRenderingOptions<CustomElements, CustomLeaves>,
) => ReactElement
