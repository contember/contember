import { ComponentType, createElement, FunctionComponent, ReactElement } from 'react'
import { BuiltinElements } from './BuiltinElements'
import { RenderElementFallback, RenderElementFallbackProps } from './RenderElementFallback'
import { resolveRichTextElementMetadata } from './resolveRichTextElementMetadata'
import { RichTextElement } from './RichTextElement'
import { RichTextElementMetadata } from './RichTextElementMetadata'
import { RichTextLeaf } from './RichTextLeaf'
import { RichTextReference } from './RichTextReference'
import { useRichTextRenderMetadata } from './RichTextRenderMetadataContext'

export type RenderElement<
	CustomElements extends RichTextElement = never,
	CustomLeaves extends RichTextLeaf = never,
	Reference extends RichTextReference = RichTextReference
> = ComponentType<
	{
		element: CustomElements | BuiltinElements<CustomElements, CustomLeaves>
		fallback: FunctionComponent<RenderElementFallbackProps<CustomElements, CustomLeaves>>
		children: ReactElement
	} & RichTextElementMetadata<CustomElements, CustomLeaves, Reference>
>

export interface ElementRendererProps<
	CustomElements extends RichTextElement = never,
	CustomLeaves extends RichTextLeaf = never
> {
	renderElement?: RenderElement<CustomElements, CustomLeaves>
	element: CustomElements | BuiltinElements<CustomElements, CustomLeaves>
	children: ReactElement
}

export function ElementRenderer<
	CustomElements extends RichTextElement = never,
	CustomLeaves extends RichTextLeaf = never
>({ element, renderElement, children }: ElementRendererProps<CustomElements, CustomLeaves>) {
	const metadata = useRichTextRenderMetadata<CustomElements, CustomLeaves>()
	const elementMetadata = resolveRichTextElementMetadata<CustomElements, CustomLeaves>(element, metadata)

	if (renderElement) {
		return createElement(renderElement, {
			...elementMetadata,
			element,
			fallback: RenderElementFallback,
			children,
		})
	}
	return <RenderElementFallback element={element as BuiltinElements}>{children}</RenderElementFallback>
}
