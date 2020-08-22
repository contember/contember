import * as React from 'react'
import { BuiltinElements } from './BuiltinElements'

export interface RenderElementFallbackProps {
	element: BuiltinElements
	children: React.ReactElement | null
}

export function RenderElementFallback({ element, children }: RenderElementFallbackProps) {
	// const formatVersion = React.useContext(RichTextFormatVersionContext)
	switch (element.type) {
		case 'anchor':
			return <a href={element.href}>{children}</a>
		case 'heading':
			return React.createElement(`h${element.level}`, null, children) // TODO numbered
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
		default:
			return null
	}
}
