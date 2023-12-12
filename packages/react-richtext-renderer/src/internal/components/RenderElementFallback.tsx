import { createElement, ReactElement } from 'react'
import type { BuiltinElements, RichTextReferenceElement, RichTextTableRowElement } from '../../types/builtin/BuiltinElements'
import { renderChildren } from '../renderChildren'
import { useReferenceMetadata } from '../useReferenceMetadata'
import type { RichTextElement } from '../../types/structure/RichTextElement'
import type { RichTextLeaf } from '../../types/structure/RichTextLeaf'
import { RichTextRendererError } from '../../RichTextRendererError'
import { RichTextBlock } from '../../types/RichTextBlock'
import { RichTextRenderingOptions } from '../../types/RichTextRenderingOptions'

export interface RenderElementFallbackProps<
	CustomElements extends RichTextElement = never,
	CustomLeaves extends RichTextLeaf = RichTextLeaf,
> {
	element: BuiltinElements<CustomElements, CustomLeaves>
	children: ReactElement
	options: RichTextRenderingOptions<CustomElements, CustomLeaves>
	block: RichTextBlock<CustomElements, CustomLeaves>
}

const getElementDataAttributes = <
	CustomElements extends RichTextElement = never,
	CustomLeaves extends RichTextLeaf = RichTextLeaf,
>(
	element: RichTextElement<CustomElements, CustomLeaves>,
	attributeNamePrefix: string = 'contember-',
): {
	[dataAttribute: string]: string | number | boolean
} => {
	const { children, referenceId, ...extendedSpecifics } = element

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
	CustomLeaves extends RichTextLeaf = RichTextLeaf,
>({ element, children, options, block }: RenderElementFallbackProps<CustomElements, CustomLeaves>) {
	const attributes = getElementDataAttributes(element, options.attributeNamePrefix)

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
			return <ReferenceElementFallback element={element} children={children} options={options} block={block} />
		}
		case 'scrollTarget':
			return (
				<span {...attributes} id={element.identifier}>
					{children}
				</span>
			)
		case 'table': {
			const firstRow = element.children[0] as RichTextTableRowElement<CustomElements, CustomLeaves> | undefined
			if (!firstRow || firstRow.headerScope !== 'table') {
				return (
					<table {...attributes}>
						<tbody>{children}</tbody>
					</table>
				)
			}
			return (
				<table {...attributes}>
					<thead>{renderChildren<CustomElements, CustomLeaves>([firstRow], options, block)}</thead>
					<tbody>{renderChildren<CustomElements, CustomLeaves>(element.children.slice(1) as any, options, block)}</tbody>
				</table>
			)
		}
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
			if (import.meta.env.DEV) {
				throw new RichTextRendererError(
					`RichTextRenderer: unknown element of type '${(element as { type: string }).type}'.`,
				)
			} else {
				return children // At least render the text contents
			}
		}
	}
}

type ReferenceElementFallbackProps<CustomElements extends RichTextElement = never, CustomLeaves extends RichTextLeaf = RichTextLeaf> = {
	element: RichTextReferenceElement<CustomElements, CustomLeaves>;
	children: ReactElement
	options: RichTextRenderingOptions<CustomElements, CustomLeaves>
	block: RichTextBlock<CustomElements, CustomLeaves>
}

function ReferenceElementFallback<
	CustomElements extends RichTextElement = never,
	CustomLeaves extends RichTextLeaf = RichTextLeaf,
>({ element, children, options, block }: ReferenceElementFallbackProps<CustomElements, CustomLeaves>) {
	const elementMetadata = useReferenceMetadata<CustomElements, CustomLeaves>(element, options, block, true)

	if (
		elementMetadata.referenceRenderer === undefined ||
		elementMetadata.referenceType === undefined ||
		elementMetadata.reference === undefined
	) {
		return children // At least render the text contents
	}

	let Renderer = elementMetadata.referenceRenderer
	return (
		<>
			<Renderer
				referenceType={elementMetadata.referenceType}
				referenceRenderer={elementMetadata.referenceRenderer}
				reference={elementMetadata.reference}
				formatVersion={block.content.formatVersion}
				block={block}
				options={options}
				element={element}
			>
				{children}
			</Renderer>
		</>
	)
}
