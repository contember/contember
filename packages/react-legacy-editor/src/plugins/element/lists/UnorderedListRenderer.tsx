import { RenderElementProps } from 'slate-react'
import { FunctionComponent } from 'react'
import { UnorderedListElement } from './UnorderedListElement'
import { BlockElement } from '../../../baseEditor'

export interface UnorderedListRendererProps extends Omit<RenderElementProps, 'element'> {
	element: UnorderedListElement
}

export const UnorderedListRenderer: FunctionComponent<UnorderedListRendererProps> = props => (
	<BlockElement {...props} domElement={'ul'}>{props.children}</BlockElement>
)
UnorderedListRenderer.displayName = 'UnorderedListRenderer'
