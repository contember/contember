import { EditorParagraph } from '@contember/ui'
import type { RenderElementProps } from 'slate-react'
import type { ParagraphElement } from './ParagraphElement'

export interface ParagraphRendererProps extends Omit<RenderElementProps, 'element'> {
	element: ParagraphElement
}

export function ParagraphRenderer({ attributes, children, element }: ParagraphRendererProps) {
	return (
		// TODO use BlockElement
		<EditorParagraph attributes={attributes} align={element.align} isNumbered={element.isNumbered}>
			{children}
		</EditorParagraph>
	)
}
