import { RichTextBlockSource, RichTextElement, RichTextLeaf, RichTextRenderingOptions } from '../types'
import { RichText } from './RichText'
import { useRichTextBlocksSource } from '../hooks'

export type { RichTextBlockSource }

export type RichTextBlocksRendererProps<CustomElements extends RichTextElement = never, CustomLeaves extends RichTextLeaf = RichTextLeaf> =
	& RichTextBlockSource<CustomElements, CustomLeaves>
	& RichTextRenderingOptions<CustomElements, CustomLeaves>

/**
 * Accepts raw RichText blocks and renders them using the provided renderers.
 *
 * @group Content rendering
 */
export const RichTextBlocksRenderer = <
	CustomElements extends RichTextElement = never,
	CustomLeaves extends RichTextLeaf = RichTextLeaf,
>({
	renderElement,
	renderLeaf,
	renderBlock = ({ children }) => <>{children}</>,
	attributeNamePrefix,
	referenceRenderers,
	undefinedReferenceHandler,
	...props
}: RichTextBlocksRendererProps<CustomElements, CustomLeaves>) => {
	const blocks = useRichTextBlocksSource<CustomElements, CustomLeaves>(props)
	return (
		<RichText<CustomElements, CustomLeaves>
			blocks={blocks}
			renderElement={renderElement}
			renderLeaf={renderLeaf}
			renderBlock={renderBlock}
			referenceRenderers={referenceRenderers}
			undefinedReferenceHandler={undefinedReferenceHandler}
			attributeNamePrefix={attributeNamePrefix}
		/>
	)
}
