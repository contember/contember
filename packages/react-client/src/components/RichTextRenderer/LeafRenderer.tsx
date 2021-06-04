import { ComponentType, createElement, ReactElement } from 'react'
import type { BuiltinLeaves } from './BuiltinLeaves'
import { RenderLeafFallback } from './RenderLeafFallback'
import type { RichTextLeaf } from './RichTextLeaf'
import type { RichTextLeafMetadata } from './RichTextLeafMetadata'
import { useRichTextRenderMetadata } from './RichTextRenderMetadataContext'

export type RenderLeaf<CustomLeaves extends RichTextLeaf> = ComponentType<
	{
		leaf: CustomLeaves | BuiltinLeaves
		fallback: ReactElement
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
	const fallback = <RenderLeafFallback leaf={leaf} />

	return renderLeaf
		? createElement(
				renderLeaf,
				{
					formatVersion,
					leaf,
					fallback,
				},
				leaf.text,
		  )
		: fallback
}
