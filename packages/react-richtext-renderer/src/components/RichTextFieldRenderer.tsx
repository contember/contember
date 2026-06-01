import { RichText } from './RichText.js'
import { RichTextElement, RichTextFieldSource, RichTextLeaf, RichTextRenderingOptions } from '../types/index.js'
import { useRichTextFieldSource } from '../hooks/index.js'

export type { RichTextFieldSource }

export type RichTextFieldRendererProps<
	CustomElements extends RichTextElement = never,
	CustomLeaves extends RichTextLeaf = RichTextLeaf,
> =
	& RichTextFieldSource<CustomElements, CustomLeaves>
	& RichTextRenderingOptions<CustomElements, CustomLeaves>

/**
 * Accepts raw RichText field source and renders them using the provided renderers.
 *
 * @group Content rendering
 */
export const RichTextFieldRenderer = <
	CustomElements extends RichTextElement = never,
	CustomLeaves extends RichTextLeaf = RichTextLeaf,
>({
	renderLeaf,
	renderBlock,
	renderElement,
	attributeNamePrefix,
	undefinedReferenceHandler,
	...source
}: RichTextFieldRendererProps<CustomElements, CustomLeaves>) => {
	const blocks = useRichTextFieldSource(source)

	return (
		<RichText<CustomElements, CustomLeaves>
			blocks={blocks}
			renderElement={renderElement}
			renderLeaf={renderLeaf}
			renderBlock={renderBlock}
			attributeNamePrefix={attributeNamePrefix}
			undefinedReferenceHandler={undefinedReferenceHandler}
		/>
	)
}
