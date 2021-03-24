import { ComponentType, createElement, FunctionComponent } from 'react'
import { BuiltinLeaves } from './BuiltinLeaves'
import { RenderLeafFallback, RenderLeafFallbackProps } from './RenderLeafFallback'
import { RichTextLeaf } from './RichTextLeaf'
import { RichTextLeafMetadata } from './RichTextLeafMetadata'
import { useRichTextRenderMetadata } from './RichTextRenderMetadataContext'

export type RenderLeaf<CustomLeaves extends RichTextLeaf> = ComponentType<
	{
		leaf: CustomLeaves | BuiltinLeaves
		fallback: FunctionComponent<RenderLeafFallbackProps>
	} & RichTextLeafMetadata
>

export interface LeafRendererProps<CustomLeaves extends RichTextLeaf = never> {
	renderLeaf?: RenderLeaf<CustomLeaves>
	leaf: CustomLeaves | BuiltinLeaves
}

export function LeafRenderer<CustomLeaves extends RichTextLeaf = never>({
	leaf,
	renderLeaf,
}: LeafRendererProps<CustomLeaves>) {
	const formatVersion = useRichTextRenderMetadata().formatVersion

	if (renderLeaf) {
		return createElement(
			renderLeaf,
			{
				formatVersion,
				leaf,
				fallback: RenderLeafFallback,
			},
			leaf.text,
		)
	}
	return <RenderLeafFallback leaf={leaf} />
}
