import { ComponentType, createElement, ReactElement } from 'react'
import type { BuiltinElements } from './BuiltinElements'
import type { BuiltinLeaves } from './BuiltinLeaves'
import { renderChildren } from './renderChildren'
import type { RenderChildrenOptions } from './renderChildren'
import { RenderElementFallback } from './RenderElementFallback'
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
		children: ReactElement

		fallback: ReactElement

		renderChildren: (
			children:
				| CustomElements
				| BuiltinElements<CustomElements, CustomLeaves>
				| CustomLeaves
				| BuiltinLeaves
				| Array<CustomElements | BuiltinElements<CustomElements, CustomLeaves> | CustomLeaves | BuiltinLeaves>,
			options: RenderChildrenOptions<CustomElements, CustomLeaves>,
		) => ReactElement
		renderChildrenOptions: RenderChildrenOptions<CustomElements, CustomLeaves>
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

	const fallback = (
		<RenderElementFallback element={element as BuiltinElements} options={options}>
			{children}
		</RenderElementFallback>
	)

	return options.renderElement
		? createElement(options.renderElement, {
				...elementMetadata,
				element,
				fallback,
				children,
				renderChildren,
				renderChildrenOptions: options,
		  })
		: fallback
}
