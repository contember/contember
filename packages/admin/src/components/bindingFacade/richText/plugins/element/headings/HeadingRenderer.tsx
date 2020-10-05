import { EditorHeading } from '@contember/ui'
import * as React from 'react'
import { RenderElementProps } from 'slate-react'
import { HeadingElement } from './HeadingElement'

export interface HeadingRendererProps extends Omit<RenderElementProps, 'element'> {
	element: HeadingElement
}

export const HeadingRenderer: React.FunctionComponent<HeadingRendererProps> = ({
	attributes,
	element,
	children,
}: HeadingRendererProps) => (
	// TODO use BlockElement
	<EditorHeading attributes={attributes} level={element.level} isNumbered={element.isNumbered}>
		{children}
	</EditorHeading>
)
HeadingRenderer.displayName = 'HeadingRenderer'
