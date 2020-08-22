import * as React from 'react'
import { BuiltinElements } from './BuiltinElements'
import { RenderElementFallback, RenderElementFallbackProps } from './RenderElementFallback'
import { RichTextElement } from './RichTextElement'
import { RichTextLeaf } from './RichTextLeaf'

export type RenderElement<
	CustomElements extends RichTextElement,
	CustomLeaves extends RichTextLeaf
> = React.ComponentType<{
	element: CustomElements | BuiltinElements<CustomElements, CustomLeaves>
	fallback: React.FunctionComponent<RenderElementFallbackProps<CustomElements, CustomLeaves>>
	formatVersion: number
	children: React.ReactElement | null
}>

export interface ElementRendererProps<
	CustomElements extends RichTextElement = never,
	CustomLeaves extends RichTextLeaf = never
> {
	renderElement?: RenderElement<CustomElements, CustomLeaves>
	element: CustomElements | BuiltinElements<CustomElements, CustomLeaves>
	formatVersion: number
	children: React.ReactElement | null
}

export function ElementRenderer<
	CustomElements extends RichTextElement = never,
	CustomLeaves extends RichTextLeaf = never
>({ element, formatVersion, renderElement, children }: ElementRendererProps<CustomElements, CustomLeaves>) {
	if (renderElement) {
		return React.createElement(renderElement, {
			element,
			formatVersion,
			fallback: RenderElementFallback,
			children,
		})
	}
	return <RenderElementFallback element={element as BuiltinElements}>{children}</RenderElementFallback>
}
