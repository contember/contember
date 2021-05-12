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
	attributeNamePrefix: string | undefined
}

const getElementDataAttributes = <
	CustomElements extends RichTextElement = never,
	CustomLeaves extends RichTextLeaf = never
>(
	element: RichTextElement<CustomElements, CustomLeaves>,
	attributeNamePrefix: string = 'contember-',
): {
	[dataAttribute: string]: string | number | boolean
} => {
	const { children, ...extendedSpecifics } = element

	return Object.fromEntries(
		Object.entries(extendedSpecifics)
			.filter(([, value]) => {
				const t = typeof value
				return t === 'string' || t === 'number' || t === 'boolean'
			})
			.map(([attribute, value]) => [`data-${attributeNamePrefix}${attribute.toLowerCase()}`, value]),
	)
}

export function RenderElementFallback<
	CustomElements extends RichTextElement = never,
	CustomLeaves extends RichTextLeaf = never
>({ element, children, attributeNamePrefix }: RenderElementFallbackProps<CustomElements, CustomLeaves>) {
	const attributes = getElementDataAttributes(element, attributeNamePrefix)

	switch (element.type) {
		case 'anchor':
			return (
				<a {...attributes} href={element.href}>
					{children}
				</a>
			)
		case 'heading':
			return createElement(`h${element.level}`, attributes, children) // TODO numbered
		case 'horizontalRule':
			return <hr {...attributes} />
		case 'listItem':
			return <li {...attributes}>{children}</li>
		case 'orderedList':
			return <ol {...attributes}>{children}</ol>
		case 'paragraph':
			return <p {...attributes}>{children}</p>
		case 'reference': {
			return <ReferenceElementFallback element={element} children={children} />
		}
		case 'scrollTarget':
			return (
				<span {...attributes} id={element.identifier}>
					{children}
				</span>
			)
		case 'table':
			return <table {...attributes}>{children}</table>
		case 'tableRow':
			return <tr {...attributes}>{children}</tr>
		case 'tableCell': {
			if (element.headerScope) {
				return (
					<th {...attributes} scope={element.headerScope}>
						{children}
					</th>
				)
			}
			return <td {...attributes}>{children}</td>
		}
		case 'unorderedList':
			return <ul {...attributes}>{children}</ul>
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

	if (
		elementMetadata.referenceRenderer === undefined ||
		elementMetadata.referenceType === undefined ||
		elementMetadata.reference === undefined
	) {
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
				referenceType: elementMetadata.referenceType,
				referenceRenderer: elementMetadata.referenceRenderer,
				reference: elementMetadata.reference,
				formatVersion: elementMetadata.formatVersion,
				element,
				children,
			})}
		</>
	)
}
