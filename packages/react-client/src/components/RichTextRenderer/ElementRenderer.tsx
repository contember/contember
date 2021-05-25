import { ComponentType, createElement, FunctionComponent, ReactElement } from 'react'
import type { BuiltinElements } from './BuiltinElements'
import type { RenderChildrenOptions } from './renderChildren'
import { RenderElementFallback, RenderElementFallbackProps } from './RenderElementFallback'
import { resolveRichTextElementMetadata } from './resolveRichTextElementMetadata'
import type { RichTextElement } from './RichTextElement'
import type { RichTextElementMetadata } from './RichTextElementMetadata'
import type { RichTextLeaf } from './RichTextLeaf'
import type { RichTextReference } from './RichTextReference'
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
	element: CustomElements | BuiltinElements<CustomElements, CustomLeaves>
	children: ReactElement
	options: RenderChildrenOptions<CustomElements, CustomLeaves>
}

export function ElementRenderer<
	CustomElements extends RichTextElement = never,
	CustomLeaves extends RichTextLeaf = never
>({ element, children, options }: ElementRendererProps<CustomElements, CustomLeaves>) {
	const metadata = useRichTextRenderMetadata<CustomElements, CustomLeaves>()
	const elementMetadata = resolveRichTextElementMetadata<CustomElements, CustomLeaves>(element, metadata)

	if (options.renderElement) {
		return createElement(options.renderElement, {
			...elementMetadata,
			element,
			fallback: RenderElementFallback,
			children,
		})
	}
	return (
		<RenderElementFallback element={element as BuiltinElements} options={options}>
			{children}
		</RenderElementFallback>
	)
}
