import * as React from 'react'
import { RenderElementProps } from 'slate-react'
import { ParagraphElement } from './ParagraphElement'

export interface ParagraphRendererProps extends Omit<RenderElementProps, 'element'> {
	element: ParagraphElement
}

export const ParagraphRenderer: React.FunctionComponent<ParagraphRendererProps> = (props: ParagraphRendererProps) => (
	<p {...props.attributes}>{props.children}</p>
)
ParagraphRenderer.displayName = 'ParagraphRenderer'
