import { BuiltinLeaves } from './BuiltinLeaves'
import { RenderLeafFallback, RenderLeafFallbackProps } from './RenderLeafFallback'
import { RichTextLeaf } from './RichTextLeaf'
import * as React from 'react'

export type RenderLeaf<CustomLeaves extends RichTextLeaf> = React.ComponentType<{
	leaf: CustomLeaves | BuiltinLeaves
	fallback: React.FunctionComponent<RenderLeafFallbackProps>
	formatVersion: number
}>

export interface LeafRendererProps<CustomLeaves extends RichTextLeaf = never> {
	renderLeaf?: RenderLeaf<CustomLeaves>
	leaf: CustomLeaves | BuiltinLeaves
	formatVersion: number
}

export function LeafRenderer<CustomLeaves extends RichTextLeaf = never>({
	formatVersion,
	leaf,
	renderLeaf,
}: LeafRendererProps<CustomLeaves>) {
	if (renderLeaf) {
		return React.createElement(
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
