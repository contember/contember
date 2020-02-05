import * as React from 'react'
import { RenderElementProps } from 'slate-react'
import { AnchorElement } from './AnchorElement'

export interface AnchorRendererProps extends Omit<RenderElementProps, 'element'> {
	element: AnchorElement
}

export const AnchorRenderer: React.FunctionComponent<AnchorRendererProps> = (props: AnchorRendererProps) => (
	<a {...props.attributes} href={props.element.href}>
		{props.children}
	</a>
)
AnchorRenderer.displayName = 'AnchorRenderer'
