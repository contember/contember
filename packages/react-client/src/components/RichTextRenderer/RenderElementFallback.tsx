import { createElement, ReactElement } from 'react'
import { BuiltinElements } from './BuiltinElements'
import { RichTextElement } from './RichTextElement'
import { RichTextLeaf } from './RichTextLeaf'

export interface RenderElementFallbackProps<
	CustomElements extends RichTextElement = never,
	CustomLeaves extends RichTextLeaf = never
> {
	element: BuiltinElements<CustomElements, CustomLeaves>
	children: ReactElement | null
}

export function RenderElementFallback<
	CustomElements extends RichTextElement = never,
	CustomLeaves extends RichTextLeaf = never
>({ element, children }: RenderElementFallbackProps<CustomElements, CustomLeaves>) {
	// const formatVersion = useContext(RichTextFormatVersionContext)
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
		case 'scrollTarget':
			return <span id={element.identifier}>{children}</span>
		case 'unorderedList':
			return <ul>{children}</ul>
		default: {
			if (__DEV_MODE__) {
				throw new Error(`RichTextRenderer: unknown element of type '${(element as { type: string }).type}'.`)
			} else {
				return children // At least render the text contents
			}
		}
	}
}
