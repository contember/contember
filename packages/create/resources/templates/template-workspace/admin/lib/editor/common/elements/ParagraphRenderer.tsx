import { ParagraphElement } from '@contember/react-slate-editor-base'
import type { RenderElementProps } from 'slate-react'

export interface ParagraphRendererProps extends Omit<RenderElementProps, 'element'> {
	element: ParagraphElement
}

export function ParagraphRenderer({ attributes, children, element }: ParagraphRendererProps) {
	return (
		// TODO numbered element.isNumbered
		<p {...attributes} style={{ textAlign: element.align }}>
			{children}
		</p>
	)
}
