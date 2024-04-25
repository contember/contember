import { EditorHeading } from '@contember/ui'
import type { FunctionComponent } from 'react'
import type { RenderElementProps } from 'slate-react'
import type { HeadingElement } from './HeadingElement'

export interface HeadingRendererProps extends Omit<RenderElementProps, 'element'> {
	element: HeadingElement
}

export const HeadingRenderer: FunctionComponent<HeadingRendererProps> = ({
	attributes,
	element,
	children,
}: HeadingRendererProps) => (
	// TODO use BlockElement
	<EditorHeading attributes={attributes} level={element.level} align={element.align} isNumbered={element.isNumbered}>
		{children}
	</EditorHeading>
)
HeadingRenderer.displayName = 'HeadingRenderer'
