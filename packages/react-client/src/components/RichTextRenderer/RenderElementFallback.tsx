import { createElement, ReactElement } from 'react'
import { BuiltinElements, RichTextReferenceElement } from './BuiltinElements'
import { resolveRichTextElementMetadata } from './resolveRichTextElementMetadata'
import { RichTextElement } from './RichTextElement'
import { RichTextLeaf } from './RichTextLeaf'
import { RichTextRendererError } from './RichTextRendererError'
import { useRichTextRenderMetadata } from './RichTextRenderMetadataContext'

export interface RenderElementFallbackProps<
	CustomElements extends RichTextElement = never,
	CustomLeaves extends RichTextLeaf = never
> {
	element: BuiltinElements<CustomElements, CustomLeaves>
	children: ReactElement
}

export function RenderElementFallback<
	CustomElements extends RichTextElement = never,
	CustomLeaves extends RichTextLeaf = never
>({ element, children }: RenderElementFallbackProps<CustomElements, CustomLeaves>) {
	switch (element.type) {
		case 'anchor':
			return <a href={element.href}>{children}</a>
		case 'heading':
			return createElement(`h${element.level}`, null, children) // TODO numbered
		case 'horizontalRule':
			return <hr />
		case 'listItem':
			return <li>{children}</li>
		case 'orderedList':
			return <ol>{children}</ol>
		case 'paragraph':
			return <p>{children}</p>
		case 'reference': {
			return <ReferenceElementFallback element={element} children={children} />
		}
		case 'scrollTarget':
			return <span id={element.identifier}>{children}</span>
		case 'unorderedList':
			return <ul>{children}</ul>
		default: {
			if (__DEV_MODE__) {
				throw new RichTextRendererError(
					`RichTextRenderer: unknown element of type '${(element as { type: string }).type}'.`,
				)
			} else {
				return children // At least render the text contents
			}
		}
	}
}

function ReferenceElementFallback<
	CustomElements extends RichTextElement = never,
	CustomLeaves extends RichTextLeaf = never
>({ element, children }: { element: RichTextReferenceElement<CustomElements, CustomLeaves>; children: ReactElement }) {
	const metadata = useRichTextRenderMetadata<CustomElements, CustomLeaves>()
	const elementMetadata = resolveRichTextElementMetadata<CustomElements, CustomLeaves>(element, metadata)

	if (elementMetadata.referenceRenderer === undefined) {
		if (__DEV_MODE__) {
			throw new RichTextRendererError(
				`RichTextRenderer: cannot render reference of type '${elementMetadata.referenceType}'.`,
			)
		} else {
			return children // At least render the text contents
		}
	}

	return (
		<>
			{elementMetadata.referenceRenderer?.({
				...elementMetadata,
				element,
				children,
			})}
		</>
	)
}
