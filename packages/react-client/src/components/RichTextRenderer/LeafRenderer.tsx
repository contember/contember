import * as React from 'react'
import { ComponentType, createElement, FunctionComponent } from 'react'
import { BuiltinLeaves } from './BuiltinLeaves'
import { RenderLeafFallback, RenderLeafFallbackProps } from './RenderLeafFallback'
import { RichTextLeaf } from './RichTextLeaf'

export type RenderLeaf<CustomLeaves extends RichTextLeaf> = ComponentType<{
	leaf: CustomLeaves | BuiltinLeaves
	fallback: FunctionComponent<RenderLeafFallbackProps>
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
